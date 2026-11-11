// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckIcon } from "lucide-react";

import { BackgroundGradient } from "@/components/aceternity/background-gradient";
import { FinishDialog } from "@/components/journey/finish-dialog";
import { MilestoneCheer } from "@/components/journey/milestone-cheer";
import {
  dismissRapidAnswerToast,
  RapidAnswerDialog,
  showRapidAnswerToast,
} from "@/components/journey/rapid-answer-warnings";
import {
  QuestionGridToggle,
  QuestionNavigator,
} from "@/components/journey/question-navigator";
import { HexagonPattern } from "@/components/magic/hexagon-pattern";
import { Button } from "@/components/ui/button";
import {
  RadioCard,
  RadioCardIndicator,
  RadioGroup,
} from "@/components/ui/radio-group";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useRapidAnswerGuard } from "@/hooks/use-rapid-answer-guard";
import { playSound } from "@/lib/sound/sound-manager";
import {
  ANSWER_OPTIONS,
  answerLabel,
  orderQuestions,
  QUESTIONS,
  questionText,
} from "@/lib/riasec/questions";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

export const ADVANCE_DELAY_MS = 280;
// Taps landing this soon after a statement appears are ignored: on slow
// phones a double tap would otherwise answer the next statement unseen.
export const INPUT_GUARD_MS = 350;

const LAST_INDEX = QUESTIONS.length - 1;
const statementId = (questionId: string) => `statement-${questionId}`;

// Keyboard shortcuts: first letter of each answer label, only for the language
// showing (Y / N in English, O / H in Filipino).
const SHORTCUTS_EN = new Map(
  ANSWER_OPTIONS.map((option) => [option.label[0]!.toLowerCase(), option.value] as const),
);
const SHORTCUTS_FIL = new Map(
  ANSWER_OPTIONS.map((option) => [option.labelFil[0]!.toLowerCase(), option.value] as const),
);

// Each answer has its own sound, keyed off the answer's value (1 = agree), so
// relabelling or translating the cards can never leave the audio pointing at
// the wrong choice.
const ANSWER_SOUNDS = new Map<number, "yes" | "no">(
  ANSWER_OPTIONS.map((option) => [option.value, option.value === 1 ? "yes" : "no"]),
);

// Yes is green and No is red on hover and when chosen. The card's own ink
// (text-answer-*) drives its currentColor border and hover wash; the chosen
// fill is a soft tint, and the glow is a single quiet tone, so neither shouts.
const ANSWER_TONE = {
  1: {
    card: "text-answer-yes data-checked:bg-answer-yes-soft data-checked:text-answer-yes-soft-foreground",
    label:
      "group-hover:text-answer-yes in-data-checked:text-answer-yes-soft-foreground",
    hint: "in-data-checked:text-answer-yes-soft-foreground/75",
    kbd: "in-data-checked:border-answer-yes-soft-foreground/30 in-data-checked:bg-answer-yes-soft-foreground/10 in-data-checked:text-answer-yes-soft-foreground",
    glow: "bg-answer-yes/30",
  },
  0: {
    card: "text-answer-no data-checked:bg-answer-no-soft data-checked:text-answer-no-soft-foreground",
    label:
      "group-hover:text-answer-no in-data-checked:text-answer-no-soft-foreground",
    hint: "in-data-checked:text-answer-no-soft-foreground/75",
    kbd: "in-data-checked:border-answer-no-soft-foreground/30 in-data-checked:bg-answer-no-soft-foreground/10 in-data-checked:text-answer-no-soft-foreground",
    glow: "bg-answer-no/30",
  },
} as const;

function playAnswerSound(value: number) {
  const name = ANSWER_SOUNDS.get(value);
  if (name) playSound(name);
}

// The four cells, in the order they brighten: top-left first (the only one a
// phone sees), then the two right-margin cells and the second top-left cell
// that balance Hexi on wide screens. All rows 0-3, inside the top-fade mask.
const LIT_CELL_ORDER: [col: number, row: number][] = [
  [0, 0],
  [17, 1],
  [5, 1],
  [19, 3],
];

// The quiz's answer counts at which the next cell lights: the first answer,
// then a quarter, half and three quarters of the 42 statements.
export const LIT_CELL_THRESHOLDS = [1, 11, 21, 32] as const;

// Focus Mode texture: static, faint hexagon grid with four cells that start
// as part of the texture and brighten one by one as the student's answers
// pass each progress band (Design Vision's constellation, expressed through
// the one allowed texture). Faded out before the answer cards so nothing
// competes with the question. Memoized: it repaints at the four band
// crossings, not on all 42 answers.
const FocusBackground = memo(function FocusBackground({
  litCells,
}: {
  litCells: number;
}) {
  return (
    <HexagonPattern
      radius={48}
      gap={6}
      hexagons={LIT_CELL_ORDER.map(([col, row], i) => [
        col,
        row,
        cn(
          "motion-safe:transition-[fill] motion-safe:duration-700 motion-safe:ease-out",
          i < litCells
            ? "fill-stage-assessment/40"
            : "fill-stage-assessment/15",
        ),
      ])}
      // Two mask layers (union): the top ellipse clears out before the answer
      // cards, and a faint band rises from the bottom edge so the lower half
      // of the viewport is not a dead flat colour. No reading text sits there.
      className="-z-10 stroke-stage-assessment-strong/30 mask-[radial-gradient(ellipse_at_top,white,transparent_75%),linear-gradient(to_top,rgb(255_255_255/0.45),transparent_28%)] print:hidden dark:stroke-stage-assessment-strong/15"
    />
  );
});

// The control in the bottom-right corner: move on from an answered statement,
// leave an unanswered one for later, or — on the only statement still open —
// the nudge to answer it.
type ForwardControl = "next" | "skip" | "hint" | "none";

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
  const language = useAssessmentStore((state) => state.language);

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
  // Whether the finish pop-up is open. It opens by itself when the last open
  // statement is answered, and a fully answered quiz (e.g. reopened after
  // finishing) resumes with it open instead of stranding the student on the
  // last statement.
  const [finishing, setFinishing] = useState(() =>
    questions.every((q) => q.id in answers),
  );
  // Set once the student leaves the finish pop-up to look over their answers
  // (button, Escape or outside click). It is what brings the "Finish
  // assessment" button onto the page: until then the pop-up is the only way
  // forward, so the button never flashes in behind it.
  const [reviewing, setReviewing] = useState(false);
  // Armed when the student arrives already finished, so reopening a completed
  // quiz is silent.
  const celebrated = useRef(questions.every((q) => q.id in answers));
  // Holds the forward control's state through a pending advance, so answering
  // does not flash a different control (or none) for the 280ms before the next
  // statement arrives. Null whenever no advance is in flight.
  const [lockedControl, setLockedControl] = useState<ForwardControl | null>(
    null,
  );
  // Set by a finish attempt that found gaps: the navigator then marks every
  // open statement and explains why the quiz can't finish yet.
  const [flagOpen, setFlagOpen] = useState(false);
  // Show or hide the question numbers. Hidden from the start, at every width:
  // the student opens them with the toggle beside the language switch, and a
  // failed finish opens them too.
  const [gridOpen, setGridOpen] = useState(false);
  const isLarge = useMediaQuery("(min-width: 64rem)");
  const gridPanelId = useId();
  // Latched on "See my results" so a double tap can't navigate twice.
  const [submitting, setSubmitting] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef(0);
  const arrowNavigating = useRef(false);
  const skipInitialFocus = useRef(true);

  const question = questions[index];
  const allAnswered = questions.every((q) => q.id in answers);
  const answeredCount = useMemo(
    () => questions.reduce((n, q) => (q.id in answers ? n + 1 : n), 0),
    [questions, answers],
  );
  // How many backdrop cells have earned their light. Held at its high-water
  // mark (render-phase state adjustment): the rapid-answer guard clearing an
  // answer can dip the count back under a threshold, and a cell going dark
  // again would read as punishment.
  const litDerived = LIT_CELL_THRESHOLDS.filter(
    (at) => answeredCount >= at,
  ).length;
  const [litCells, setLitCells] = useState(litDerived);
  if (litDerived > litCells) setLitCells(litDerived);
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

  const cancelAdvance = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    setLockedControl(null);
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
    // The notice names the open numbers, so show them beside it.
    setGridOpen(true);
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

  // Next statement in order (Next, re-tap, revisions), or the finish pop-up
  // after the last one when nothing is left open.
  const goForward = () => {
    if (index < LAST_INDEX) {
      moveTo(index + 1);
      return;
    }
    const latest = useAssessmentStore.getState().answers;
    if (questions.every((q) => q.id in latest)) {
      requestFinish();
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
      // That answer completed the quiz: open the finish pop-up.
      requestFinish();
    }
  };

  // Skip leaves the statement open for later: the next open one ahead,
  // wrapping to the earliest. -1 when this is the only one left.
  const skipTarget = (() => {
    const isOpen = (q: (typeof questions)[number]) => !(q.id in answers);
    const ahead = questions.findIndex((q, i) => i > index && isOpen(q));
    if (ahead !== -1) return ahead;
    return questions.findIndex((q, i) => i < index && isOpen(q));
  })();

  const control: ForwardControl = currentAnswered
    ? !isBlocked && index < LAST_INDEX
      ? "next"
      : "none"
    : skipTarget !== -1
      ? "skip"
      : "hint";
  // What the corner actually renders: the control this statement calls for,
  // or the one it had when the advance started.
  const shownControl = lockedControl ?? control;

  const scheduleAdvance = (advance: () => void = goForward) => {
    cancelAdvance();
    // `control` is this render's value, so it predates the answer that
    // triggered the advance — exactly the one to hold on screen.
    setLockedControl(control);
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
      const value = (language === "fil" ? SHORTCUTS_FIL : SHORTCUTS_EN).get(
        event.key.toLowerCase(),
      );
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
  }, [showFinish, language]);

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
      setGridOpen(true);
      moveTo(firstOpen);
      return;
    }
    setSubmitting(true);
    router.push("/results");
  };

  return (
    // overflow-clip, not -hidden: it clips the glows and Hexi the same way but
    // is not a scroll container, so the question panel can stay sticky.
    <div className="relative isolate flex flex-1 flex-col overflow-clip bg-stage-assessment-soft">
      <FocusBackground litCells={litCells} />
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
        className="pointer-events-none absolute bottom-0 left-0 -z-10 hidden h-auto w-72 select-none lg:block xl:w-96 print:hidden"
      />
      <RapidAnswerDialog open={isBlocked} onAcknowledge={acknowledge} />
      <FinishDialog
        open={showFinish}
        submitting={submitting}
        onSeeResults={seeResults}
        onReview={() => {
          setFinishing(false);
          setReviewing(true);
        }}
      />
      {/* Progress strip above the question at every width, in the one centred
          column. Below lg the numbers panel, when shown, sits under the strip.
          From 1328px it docks in the margin to the right of that column, top
          level with the strip, so opening it moves nothing: the strip and
          question stay exactly where they were. Between lg and 1328px there is
          no room in the margin, so the column makes way and slides left. The
          toggle sits beside the bar itself (QuestionNavigator's gridToggle
          slot) and shows or hides the panel. Strip and panel are z-10 so the
          question area's widened clip box (below) can never sit over them
          and swallow their clicks. */}
      <div
        data-grid={gridOpen ? "open" : "closed"}
        className="relative mx-auto grid w-full max-w-2xl grid-cols-1 gap-8 px-4 pt-16 pb-10 sm:pt-20 lg:max-w-5xl lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-x-12 lg:data-[grid=closed]:max-w-2xl lg:data-[grid=closed]:grid-cols-1 min-[1328px]:data-[grid=open]:max-w-2xl min-[1328px]:data-[grid=open]:grid-cols-1"
      >
        <QuestionNavigator
          questions={questions}
          answers={answers}
          currentIndex={index}
          flagOpen={flagOpen}
          disabled={isBlocked}
          onJump={(target) => {
            moveTo(target);
            // Below lg the panel covers the statement: fold it away once a
            // number is chosen. Docked beside the statement, it stays.
            if (!isLarge) setGridOpen(false);
          }}
          panelId={gridPanelId}
          onHide={() => setGridOpen(false)}
          gridOpen={gridOpen}
          progressClassName="relative z-10 lg:col-start-1 lg:row-start-1"
          panelClassName="relative z-10 lg:max-[1327px]:col-start-2 lg:max-[1327px]:row-span-2 lg:max-[1327px]:row-start-1 lg:max-[1327px]:self-start min-[1328px]:absolute min-[1328px]:top-20 min-[1328px]:left-[calc(100%+0.5rem)] min-[1328px]:w-76"
          gridToggle={
            <QuestionGridToggle
              open={gridOpen}
              onToggle={() => setGridOpen(!gridOpen)}
              controls={gridPanelId}
              disabled={isBlocked}
            />
          }
          cheerSlot={
            <MilestoneCheer
              answeredCount={answeredCount}
              language={language}
              suppressed={flagOpen && !allAnswered}
            />
          }
        />

        <div className="flex min-w-0 flex-col gap-5 lg:col-start-1 lg:row-start-2">
          {allAnswered && reviewing && !finishing && (
            <p className="rounded-2xl bg-card px-4 py-3 text-sm font-medium text-foreground/80">
              All {QUESTIONS.length} statements answered! Change any answer you
              like, then tap{" "}
              <strong className="font-semibold">Finish assessment</strong> below
              when ready.
            </p>
          )}

          {/* Question card, flowing directly under the progress strip rather
              than centred in the viewport, so the two read as one compact
              block. The x-clip keeps the slide transition from causing
              horizontal scroll; -mx-24/px-24 moves the clip edge out 96px so
              the answer cards' glow fades out fully instead of ending in a
              hard vertical edge (the runner root's overflow-hidden still
              contains it). The slack must stay ahead of the glow's reach in
              BackgroundGradient: -inset-1 plus blur-2xl carries roughly 64px.
              Negative margin and padding cancel, so content width is
              unchanged. */}
          <div className="relative -mx-24 flex flex-col overflow-x-clip px-24">
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
                  lang={language === "fil" ? "fil" : undefined}
                  className="mt-4 min-h-20 text-2xl font-bold text-foreground outline-none sm:text-3xl"
                >
                  {questionText(question, language)}
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
                        glowClassName={ANSWER_TONE[option.value].glow}
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
                          className={cn(
                            "relative h-full min-h-28 w-full flex-col justify-center gap-2 rounded-3xl bg-card shadow-bento",
                            ANSWER_TONE[option.value].card,
                          )}
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
                          <span
                            className={cn(
                              "font-sans text-4xl leading-none font-extrabold tracking-tight text-foreground transition-colors duration-150 sm:text-5xl",
                              ANSWER_TONE[option.value].label,
                            )}
                          >
                            {answerLabel(option, language)}
                          </span>
                          {/* The hint darkens with the card, so the hover
                              carries a text-contrast change too and is not
                              only a tint and an outline. */}
                          {/* On the checked card the ink drops to 75% rather
                              than switching to a muted token: the muted greys
                              are mixed for the page, not for a yellow fill,
                              and a transparency of the ink stays on the fill's
                              own hue (7.03:1). */}
                          <span
                            className={cn(
                              "hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 group-hover:text-foreground sm:flex",
                              ANSWER_TONE[option.value].hint,
                            )}
                          >
                            press
                            <kbd
                              className={cn(
                                "rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-xs font-bold text-foreground transition-colors duration-150 group-hover:border-current",
                                ANSWER_TONE[option.value].kbd,
                              )}
                            >
                              {answerLabel(option, language)[0]!.toUpperCase()}
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
            {shownControl === "next" ? (
              <Button
                variant="outline"
                size="lg"
                onClick={goForward}
                className="h-11 rounded-full bg-card px-5"
              >
                Next
                <ArrowRight className="size-4" />
              </Button>
            ) : shownControl === "skip" ? (
              <Button
                variant="ghost"
                size="lg"
                // The locked control outlives the skip target it was computed
                // from, so re-read it on the click.
                onClick={() => {
                  if (skipTarget !== -1) moveTo(skipTarget);
                }}
                disabled={isBlocked}
                className="h-11 rounded-full px-4"
              >
                Skip for now
                <ArrowRight className="size-4" />
              </Button>
            ) : shownControl === "hint" ? (
              <p className="text-right text-sm text-muted-foreground">
                Tap an answer to continue
                <span className="hidden sm:inline">
                  {language === "fil" ? ", or press O or H" : ", or press Y or N"}
                </span>
              </p>
            ) : null}
          </div>

          {allAnswered && reviewing && (
            <Button
              size="lg"
              onClick={seeResults}
              disabled={isBlocked || submitting}
              className="h-13 w-full rounded-full bg-stage-results font-heading text-lg font-semibold text-stage-results-foreground hover:bg-stage-results/85"
            >
              Finish assessment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
