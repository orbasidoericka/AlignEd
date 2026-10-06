// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckIcon } from "lucide-react";

import { BackgroundGradient } from "@/components/aceternity/background-gradient";
import { BackgroundLines } from "@/components/aceternity/background-lines";
import {
  dismissRapidAnswerToast,
  RapidAnswerDialog,
  showRapidAnswerToast,
} from "@/components/journey/rapid-answer-warnings";
import { QuestionNavigator } from "@/components/journey/question-navigator";
import { HexagonPattern } from "@/components/magic/hexagon-pattern";
import { Button } from "@/components/ui/button";
import {
  RadioCard,
  RadioCardIndicator,
  RadioGroup,
} from "@/components/ui/radio-group";
import { useRapidAnswerGuard } from "@/hooks/use-rapid-answer-guard";
import { playSound } from "@/lib/sound/sound-manager";
import {
  ANSWER_OPTIONS,
  orderQuestions,
  QUESTIONS,
} from "@/lib/riasec/questions";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

export const ADVANCE_DELAY_MS = 280;
// Taps landing this soon after a statement appears are ignored: on slow
// phones a double tap would otherwise answer the next statement unseen.
export const INPUT_GUARD_MS = 350;

const LAST_INDEX = QUESTIONS.length - 1;
const statementId = (questionId: string) => `statement-${questionId}`;
const FINISH_HEADING_ID = "assessment-finish-heading";

// Keyboard shortcuts: first letter of each answer label (Y / N).
const SHORTCUTS = new Map(
  ANSWER_OPTIONS.map((option) => [option.label[0]!.toLowerCase(), option.value]),
);

// Each answer has its own sound, keyed off the same options the cards render
// from, so relabelling them can never leave the audio pointing at the wrong
// choice.
const ANSWER_SOUNDS = new Map<number, "yes" | "no">(
  ANSWER_OPTIONS.map((option) => [
    option.value,
    option.label[0]!.toLowerCase() === "y" ? "yes" : "no",
  ]),
);

function playAnswerSound(value: number) {
  const name = ANSWER_SOUNDS.get(value);
  if (name) playSound(name);
}

// Focus Mode texture: static, faint hexagon grid with two corner cells that
// glow in and out slowly, faded out before the answer cards so nothing
// competes with the question.
function FocusBackground() {
  return (
    <HexagonPattern
      radius={48}
      gap={6}
      hexagons={[
        [0, 0, "fill-stage-assessment/40"],
        [5, 1, "fill-stage-assessment/40"],
      ]}
      className="-z-10 stroke-stage-assessment-strong/20 mask-[radial-gradient(ellipse_at_top,white,transparent_75%)] print:hidden dark:stroke-stage-assessment-strong/10"
    />
  );
}

// RIASEC quiz runner (PRD FR-3): one statement in focus, answers persist on
// every change, resume at the first unanswered statement. Stage accent:
// calming blue.
export function AssessmentRunner() {
  const router = useRouter();
  const answers = useAssessmentStore((state) => state.answers);
  const setAnswer = useAssessmentStore((state) => state.setAnswer);
  const clearAnswer = useAssessmentStore((state) => state.clearAnswer);
  const setTotalQuestions = useAssessmentStore(
    (state) => state.setTotalQuestions,
  );
  const setCurrentStep = useAssessmentStore((state) => state.setCurrentStep);
  const questionOrder = useAssessmentStore((state) => state.questionOrder);
  const ensureQuestionOrder = useAssessmentStore(
    (state) => state.ensureQuestionOrder,
  );

  // The statements in this session's random order (printed order until the
  // store seeds one, which happens in the effect below). Index-based
  // navigation walks this list; answers and scoring stay keyed by id, so the
  // order only changes what the student sees, never what they get.
  const questions = useMemo(
    () => orderQuestions(questionOrder),
    [questionOrder],
  );

  // Seed a per-session order on first visit; a valid persisted one is left
  // alone so a resume keeps the same sequence and the same navigator numbers.
  useEffect(() => {
    ensureQuestionOrder();
  }, [ensureQuestionOrder]);

  const firstUnanswered = useMemo(() => {
    const index = questions.findIndex((q) => !(q.id in answers));
    return index === -1 ? LAST_INDEX : index;
    // Resume position only matters on mount; answers churn afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(firstUnanswered);
  const [direction, setDirection] = useState(1);
  // A fully answered quiz (e.g. reopened after finishing) resumes on the
  // finish view instead of stranding the student on the last statement.
  const [finishing, setFinishing] = useState(() =>
    questions.every((q) => q.id in answers),
  );
  const [resumed] = useState(
    () => Object.keys(answers).length > 0 && firstUnanswered > 0,
  );
  // Armed when the student arrives already finished, so reopening a completed
  // quiz is silent.
  const celebrated = useRef(questions.every((q) => q.id in answers));
  const [advancePending, setAdvancePending] = useState(false);
  // Set by a finish attempt that found gaps: the navigator then marks every
  // open statement and explains why the quiz can't finish yet.
  const [flagOpen, setFlagOpen] = useState(false);
  // Latched on "See my results" so a double tap can't navigate twice.
  const [submitting, setSubmitting] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef(0);
  const arrowNavigating = useRef(false);
  const skipInitialFocus = useRef(true);

  const question = questions[index];
  const allAnswered = questions.every((q) => q.id in answers);
  const showFinish = finishing && allAnswered;
  const currentAnswer = question ? answers[question.id]?.value : undefined;
  const currentAnswered = currentAnswer !== undefined;

  // Integrity check: answering in under 2s warns twice, then blocks.
  const { isBlocked, recordAnswer, acknowledge } = useRapidAnswerGuard({
    questionKey: question?.id ?? "",
  });

  useEffect(() => {
    setTotalQuestions(QUESTIONS.length);
  }, [setTotalQuestions]);

  useEffect(() => {
    setCurrentStep(index);
  }, [index, setCurrentStep]);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  // Restart the input guard whenever a statement appears.
  useEffect(() => {
    shownAt.current = performance.now();
  }, [question?.id, showFinish]);

  // Move focus to each new statement so keyboard and screen reader users
  // hear it; the focused radio from the previous statement has unmounted.
  useEffect(() => {
    if (showFinish) return;
    if (skipInitialFocus.current) {
      skipInitialFocus.current = false;
      return;
    }
    if (question) {
      document
        .getElementById(statementId(question.id))
        ?.focus({ preventScroll: true });
    }
  }, [question, showFinish]);

  useEffect(() => {
    if (showFinish) {
      document.getElementById(FINISH_HEADING_ID)?.focus({ preventScroll: true });
    }
  }, [showFinish]);

  const cancelAdvance = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    setAdvancePending(false);
  };

  const moveTo = (target: number) => {
    cancelAdvance();
    if (target === index) return;
    setDirection(target > index ? 1 : -1);
    setIndex(target);
  };

  // The submission gate. The quiz only finishes when the store holds an answer
  // for every statement; otherwise it stays open, flags the gaps, and takes the
  // student to the first one.
  const requestFinish = () => {
    cancelAdvance();
    const latest = useAssessmentStore.getState().answers;
    const firstOpen = questions.findIndex((q) => !(q.id in latest));
    if (firstOpen === -1) {
      // The reward sounds for the answer that actually completed the quiz, and
      // never for the re-entries: a refresh of a finished quiz, or the
      // Review my answers loop back through Finish.
      if (!celebrated.current) {
        celebrated.current = true;
        playSound("celebration");
      }
      setFinishing(true);
      return;
    }
    setFlagOpen(true);
    if (firstOpen === index) {
      // No statement change to trigger the focus effect, so move focus here:
      // it lands the student on the gap and lets the notice be announced.
      document
        .getElementById(statementId(questions[firstOpen]!.id))
        ?.focus({ preventScroll: true });
      return;
    }
    moveTo(firstOpen);
  };

  // Next statement in order (Next, re-tap, revisions), or the finish gate
  // after the last one.
  const goForward = () => {
    if (index < LAST_INDEX) {
      moveTo(index + 1);
    } else {
      cancelAdvance();
    }
  };

  // After a fresh answer: the next statement still waiting for one, wrapping
  // past the end, or the finish gate once none are left. In a front-to-back
  // run that is simply the next statement; after jumping around it skips the
  // ones already answered.
  const advanceToNextOpen = () => {
    const latest = useAssessmentStore.getState().answers;
    const ahead = questions.findIndex((q, i) => i > index && !(q.id in latest));
    const target =
      ahead !== -1 ? ahead : questions.findIndex((q) => !(q.id in latest));
    if (target !== -1) {
      moveTo(target);
    } else {
      cancelAdvance();
    }
  };

  const scheduleAdvance = (advance: () => void = goForward) => {
    cancelAdvance();
    setAdvancePending(true);
    advanceTimer.current = setTimeout(advance, ADVANCE_DELAY_MS);
  };

  const inputLocked = () =>
    performance.now() - shownAt.current < INPUT_GUARD_MS;

  const handleChoice = (value: number) => {
    // Guarded taps stay silent: nothing was recorded, so nothing is confirmed.
    if (!question || isBlocked || inputLocked()) return;

    // Re-choosing the answer already given confirms it and moves on. Base UI
    // fires no value change for an already-checked radio, so without this a
    // revisited statement had no way forward.
    if (currentAnswer === value) {
      // Arrow keys landing back on the current answer change nothing.
      if (arrowNavigating.current) return;
      playAnswerSound(value);
      scheduleAdvance();
      return;
    }

    const isRevision = currentAnswered;
    setAnswer(question.id, { trait: question.trait, value });
    // The answer is in the store by now, including on the arrow-key and
    // rapid-answer-block paths below, so the sound is always truthful.
    playAnswerSound(value);

    // Arrow keys move the selection; they should not commit and advance.
    if (arrowNavigating.current) return;

    const rapidEvent = recordAnswer({ isRevision });
    if (rapidEvent === "warn") {
      showRapidAnswerToast();
      // Every warning level discards the rushed answer and holds the
      // student here, not just the final one, so a flagged answer never
      // carries straight through to the next statement.
      cancelAdvance();
      clearAnswer(question.id);
      return;
    }
    if (rapidEvent === "block") {
      dismissRapidAnswerToast();
      // Stay until the student acknowledges the pause, so they have to
      // think it through again rather than just confirming the rapid tap.
      cancelAdvance();
      clearAnswer(question.id);
      return;
    }
    scheduleAdvance(isRevision ? goForward : advanceToNextOpen);
  };

  // Keep the latest handler for the document-level shortcut listener.
  const choiceRef = useRef(handleChoice);
  useEffect(() => {
    choiceRef.current = handleChoice;
  });

  useEffect(() => {
    if (showFinish) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      const value = SHORTCUTS.get(event.key.toLowerCase());
      if (value === undefined) return;
      // The target can be the document itself when nothing is focused.
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }
      // Never answer behind an open dialog (exit confirm, rapid-answer pause).
      if (document.querySelector("[role='dialog'], [role='alertdialog']")) {
        return;
      }
      event.preventDefault();
      choiceRef.current(value);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showFinish]);

  // Unreachable: index always stays inside the bank's bounds.
  if (!question) return null;

  const goBack = () => {
    if (index === 0) return;
    moveTo(index - 1);
  };

  const seeResults = () => {
    if (submitting) return;
    // Re-check against the store rather than trusting the view: nothing
    // reaches /results unless every statement has an answer.
    const latest = useAssessmentStore.getState().answers;
    const firstOpen = questions.findIndex((q) => !(q.id in latest));
    if (firstOpen !== -1) {
      setFinishing(false);
      setFlagOpen(true);
      moveTo(firstOpen);
      return;
    }
    setSubmitting(true);
    router.push("/results");
  };

  if (showFinish) {
    return (
      // Celebration: palette streaks burst from behind the message.
      <BackgroundLines className="flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden bg-stage-assessment-soft px-4 py-16 text-center">
        {/* Hexi, celebrating. A plain <img>: the file carries its own CSS
            animation and its own prefers-reduced-motion rule, and an <img>
            runs both while keeping the markup out of the accessibility tree.
            Decorative — the h1 below says "All done!" in words. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image
            would have to serve this through the optimizer, which refuses SVG
            unless dangerouslyAllowSVG is on; that flag is a real XSS surface
            and buys nothing for a static asset that is already 15 KB. Width
            and height are set, so there is no layout shift to optimize away. */}
        <img
          src="/hexi-celebrate.svg"
          alt=""
          aria-hidden
          width={800}
          height={600}
          className="h-auto w-56 shrink-0 sm:w-72"
        />
        <h1
          id={FINISH_HEADING_ID}
          tabIndex={-1}
          className="text-3xl font-bold text-foreground outline-none sm:text-4xl"
        >
          All done!
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Every answer is in. Your Holland Code is ready.
        </p>
        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            onClick={seeResults}
            disabled={submitting}
            className="h-13 rounded-full bg-stage-results px-8 font-heading text-lg font-semibold text-stage-results-foreground hover:bg-stage-results/85"
          >
            See my results
          </Button>
          <Button
            variant="ghost"
            size="lg"
            disabled={submitting}
            onClick={() => {
              setFinishing(false);
              setDirection(-1);
              setIndex(LAST_INDEX);
            }}
            className="rounded-full"
          >
            <ArrowLeft className="size-4" />
            Review my answers
          </Button>
        </div>
      </BackgroundLines>
    );
  }

  return (
    <div className="relative isolate flex flex-1 flex-col overflow-hidden bg-stage-assessment-soft">
      <FocusBackground />
      {/* Hexi keeps the student company through the 42 statements, parked in
          the dead space under the question column. Same <img> reasoning as the
          finish screen: the file animates itself and respects reduced motion.
          Below lg the column runs the full width and there is no dead space
          left, so it is not rendered rather than squeezed. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- see the finish
          screen above: the optimizer cannot serve SVG without
          dangerouslyAllowSVG, and this one has to keep its animation. */}
      <img
        src="/hexi.svg"
        alt=""
        aria-hidden
        width={800}
        height={600}
        className="pointer-events-none absolute bottom-0 left-0 -z-10 hidden h-auto w-56 select-none lg:block xl:w-72 print:hidden"
      />
      <RapidAnswerDialog open={isBlocked} onAcknowledge={acknowledge} />
      {/* One column below lg, navigator on top; from lg the navigator sits
          beside the question. It is z-10 so the question area's widened clip
          box (below) can never sit over it and swallow its clicks. */}
      <div className="mx-auto grid w-full max-w-2xl flex-1 grid-cols-1 grid-rows-[auto_1fr] gap-6 px-4 py-8 lg:max-w-5xl lg:grid-cols-[minmax(0,1fr)_19rem] lg:grid-rows-1 lg:gap-x-12">
        <QuestionNavigator
          questions={questions}
          answers={answers}
          currentIndex={index}
          flagOpen={flagOpen}
          disabled={isBlocked}
          onJump={moveTo}
          onFinish={requestFinish}
          className="relative z-10 lg:col-start-2 lg:row-start-1 lg:self-start"
        />

        <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
          {resumed && !flagOpen && index === firstUnanswered && (
            <p className="rounded-2xl bg-card px-4 py-3 text-sm font-medium text-foreground/80">
              Welcome back! You are continuing right where you left off.
            </p>
          )}
          {allAnswered && !finishing && (
            <p className="rounded-2xl bg-card px-4 py-3 text-sm font-medium text-foreground/80">
              All {QUESTIONS.length} statements answered! Review your answers
              using the question grid, then tap{" "}
              <strong className="font-semibold">Finish assessment</strong> when
              ready.
            </p>
          )}

          {/* Question card. The x-clip keeps the slide transition from causing
              horizontal scroll; -mx-24/px-24 moves the clip edge out 96px so the
              answer cards' glow fades out fully instead of ending in a hard
              vertical edge (the runner root's overflow-hidden still contains
              it). The slack must stay ahead of the glow's reach in
              BackgroundGradient: -inset-1 plus blur-2xl carries roughly 64px.
              Negative margin and padding cancel, so content width is unchanged. */}
          <div className="relative -mx-24 flex flex-1 flex-col justify-center overflow-x-clip px-24">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.div
                key={question.id}
                custom={direction}
                initial={{ opacity: 0, x: direction * 48 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -48 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col gap-6"
              >
                {/* Focus target after each advance (tabIndex -1: programmatic
                    focus only). It also names the answer group below. */}
                <h1
                  id={statementId(question.id)}
                  tabIndex={-1}
                  className="min-h-20 text-2xl font-bold text-foreground outline-none sm:text-3xl"
                >
                  {question.text}
                </h1>

                {/* Arrow keys move the selection inside the group; flag them so
                    the resulting value change selects without advancing. */}
                <div
                  onKeyDownCapture={(event) => {
                    if (event.key.startsWith("Arrow")) {
                      arrowNavigating.current = true;
                      queueMicrotask(() => {
                        arrowNavigating.current = false;
                      });
                    }
                  }}
                >
                  <RadioGroup
                    key={question.id}
                    aria-labelledby={statementId(question.id)}
                    value={currentAnswer ?? null}
                    onValueChange={(value) => handleChoice(value as number)}
                    className="grid grid-cols-2 gap-3"
                  >
                    {ANSWER_OPTIONS.map((option) => (
                      // Gradient border at rest; glows and pans on hover,
                      // keyboard focus, or selection. The opaque card inside
                      // hides the gradient except for the 3px ring.
                      <BackgroundGradient
                        key={option.value}
                        // The lift rides on the container so the 3px frame,
                        // the glow and the card travel as one piece; lifting
                        // the card alone would slide it inside its own frame.
                        // Transform only, and motion-safe, so a phone that
                        // never hovers loses nothing.
                        containerClassName="rounded-3xl transition-transform duration-150 motion-safe:hover:-translate-y-0.5"
                        className="h-full"
                      >
                        <RadioCard
                          value={option.value}
                          // Re-tapping (or Space on) the chosen answer advances.
                          onClick={() => {
                            if (currentAnswer === option.value) {
                              handleChoice(option.value);
                            }
                          }}
          // Keeps the shared RadioCard border rather than the inset ring it
          // used to need: with the gradient frame gone there is nothing for an
          // outline to fight, so rest/hover/checked borders come from one
          // place. --highlight-soft is a pale fill in BOTH themes, so the
          // checked card sets its own ink and everything inside follows it.
                          className="relative h-full min-h-28 w-full flex-col justify-center gap-2 rounded-3xl bg-card text-stage-assessment-strong data-checked:bg-highlight-soft data-checked:text-highlight-soft-foreground"
                        >
                          <RadioCardIndicator className="sr-only" />
                          {/* Non-color cue for the selected card. */}
                          <CheckIcon
                            aria-hidden
                            className="absolute top-3 right-3 size-5 opacity-0 transition-opacity duration-150 in-data-checked:opacity-100"
                          />
                          {/* The word carries the card: body face at display
                              size, tight tracking, with the shortcut shown
                              quietly beneath it on pointer-sized screens. */}
                          <span className="font-sans text-4xl leading-none font-extrabold tracking-tight text-foreground in-data-checked:text-highlight-soft-foreground sm:text-5xl">
                            {option.label}
                          </span>
                          {/* The hint darkens with the card, so the hover
                              carries a text-contrast change too and is not
                              only a tint and an outline. */}
                          {/* On the checked card the ink drops to 75% rather
                              than switching to a muted token: the muted greys
                              are mixed for the page, not for a yellow fill,
                              and a transparency of the ink stays on the fill's
                              own hue (7.03:1). */}
                          <span className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 group-hover:text-foreground in-data-checked:text-highlight-soft-foreground/75 sm:flex">
                            press
                            <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-xs font-bold text-foreground transition-colors duration-150 group-hover:border-current in-data-checked:border-highlight-soft-foreground/30 in-data-checked:bg-highlight-soft-foreground/10 in-data-checked:text-highlight-soft-foreground">
                              {option.label[0]!.toUpperCase()}
                            </kbd>
                          </span>
                        </RadioCard>
                      </BackgroundGradient>
                    ))}
                  </RadioGroup>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex min-h-11 items-center justify-between gap-3 pb-2">
            <Button
              variant="ghost"
              size="lg"
              onClick={goBack}
              disabled={index === 0}
              className={cn("h-11 rounded-full px-4", index === 0 && "invisible")}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {currentAnswered &&
            !advancePending &&
            !isBlocked &&
            index < LAST_INDEX ? (
              <Button
                variant="outline"
                size="lg"
                onClick={goForward}
                className="h-11 rounded-full bg-card px-5"
              >
                Next
                <ArrowRight className="size-4" />
              </Button>
            ) : !currentAnswered ? (
              <p className="text-right text-sm text-muted-foreground">
                Tap an answer to continue
                <span className="hidden sm:inline">, or press Y or N</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
