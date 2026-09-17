// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckIcon, PartyPopper } from "lucide-react";

import { BackgroundGradient } from "@/components/aceternity/background-gradient";
import { BackgroundLines } from "@/components/aceternity/background-lines";
import { AnimatedCircularProgressBar } from "@/components/magic/animated-circular-progress-bar";
import {
  dismissRapidAnswerToast,
  RapidAnswerDialog,
  showRapidAnswerToast,
} from "@/components/journey/rapid-answer-warnings";
import { HexagonPattern } from "@/components/magic/hexagon-pattern";
import { Button } from "@/components/ui/button";
import {
  RadioCard,
  RadioCardIndicator,
  RadioGroup,
} from "@/components/ui/radio-group";
import { useRapidAnswerGuard } from "@/hooks/use-rapid-answer-guard";
import { ANSWER_OPTIONS, QUESTIONS } from "@/lib/riasec/questions";
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
  const setTotalQuestions = useAssessmentStore(
    (state) => state.setTotalQuestions,
  );
  const setCurrentStep = useAssessmentStore((state) => state.setCurrentStep);

  const firstUnanswered = useMemo(() => {
    const index = QUESTIONS.findIndex((q) => !(q.id in answers));
    return index === -1 ? LAST_INDEX : index;
    // Resume position only matters on mount; answers churn afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(firstUnanswered);
  const [direction, setDirection] = useState(1);
  // A fully answered quiz (e.g. reopened after finishing) resumes on the
  // finish view instead of stranding the student on the last statement.
  const [finishing, setFinishing] = useState(() =>
    QUESTIONS.every((q) => q.id in answers),
  );
  const [resumed] = useState(
    () => Object.keys(answers).length > 0 && firstUnanswered > 0,
  );
  const [advancePending, setAdvancePending] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef(0);
  const arrowNavigating = useRef(false);
  const skipInitialFocus = useRef(true);

  const question = QUESTIONS[index];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount >= QUESTIONS.length;
  const remaining = QUESTIONS.length - answeredCount;
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

  // Next statement, or the first one still unanswered after the last, or the
  // finish view once every statement has an answer.
  const goForward = () => {
    cancelAdvance();
    if (index < LAST_INDEX) {
      setDirection(1);
      setIndex(index + 1);
      return;
    }
    const latest = useAssessmentStore.getState().answers;
    const unanswered = QUESTIONS.findIndex((q) => !(q.id in latest));
    if (unanswered === -1) {
      setFinishing(true);
    } else {
      setDirection(-1);
      setIndex(unanswered);
    }
  };

  const scheduleAdvance = () => {
    cancelAdvance();
    setAdvancePending(true);
    advanceTimer.current = setTimeout(goForward, ADVANCE_DELAY_MS);
  };

  const inputLocked = () =>
    performance.now() - shownAt.current < INPUT_GUARD_MS;

  const handleChoice = (value: number) => {
    if (!question || isBlocked || inputLocked()) return;

    // Re-choosing the answer already given confirms it and moves on. Base UI
    // fires no value change for an already-checked radio, so without this a
    // revisited statement had no way forward.
    if (currentAnswer === value) {
      if (!arrowNavigating.current) scheduleAdvance();
      return;
    }

    const isRevision = currentAnswered;
    setAnswer(question.id, { trait: question.trait, value });

    // Arrow keys move the selection; they should not commit and advance.
    if (arrowNavigating.current) return;

    const rapidEvent = recordAnswer({ isRevision });
    if (rapidEvent === "warn") showRapidAnswerToast();
    if (rapidEvent === "block") {
      dismissRapidAnswerToast();
      // Stay on this statement until the student acknowledges the pause.
      cancelAdvance();
      return;
    }
    scheduleAdvance();
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
    cancelAdvance();
    setDirection(-1);
    setIndex(index - 1);
  };

  if (showFinish) {
    return (
      // Celebration: palette streaks burst from behind the message.
      <BackgroundLines className="flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden bg-stage-assessment-soft px-4 py-16 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-stage-assessment text-stage-assessment-foreground shadow-bento">
          <PartyPopper className="size-10" aria-hidden />
        </span>
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
            onClick={() => router.push("/results")}
            className="h-13 rounded-full bg-stage-results px-8 font-heading text-lg font-semibold text-stage-results-foreground hover:bg-stage-results/85"
          >
            See my results
          </Button>
          <Button
            variant="ghost"
            size="lg"
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

  const nextLabel = index === LAST_INDEX ? "Finish" : "Next";

  return (
    <div className="relative isolate flex flex-1 flex-col overflow-hidden bg-stage-assessment-soft">
      <FocusBackground />
      <RapidAnswerDialog open={isBlocked} onAcknowledge={acknowledge} />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        {/* Progress (PRD FR-3.3): the circular gauge is the primary tracker.
            Solid card backing keeps it legible over the hexagon glow. */}
        <div className="flex items-center gap-4 rounded-3xl bg-card/80 p-3 pr-5 shadow-bento ring-1 ring-border">
          <AnimatedCircularProgressBar
            value={answeredCount}
            max={QUESTIONS.length}
            gaugePrimaryColor="var(--stage-assessment-strong)"
            gaugeSecondaryColor="color-mix(in oklab, var(--stage-assessment) 30%, transparent)"
            label="Assessment progress"
            valueText={`${answeredCount} of ${QUESTIONS.length} statements answered`}
            className="size-18 shrink-0 font-heading text-lg font-bold text-stage-assessment-strong sm:size-20 sm:text-xl"
          />
          <div className="flex min-w-0 flex-col">
            <p className="font-heading text-sm font-bold text-stage-assessment-strong">
              Step 2 of 3
            </p>
            <p
              className="font-heading text-lg font-bold text-foreground"
              aria-live="polite"
            >
              Question {index + 1} of {QUESTIONS.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {remaining === 0 ? "All answered" : `${remaining} to go`}
            </p>
          </div>
        </div>

        {resumed && index === firstUnanswered && (
          <p className="rounded-2xl bg-card px-4 py-3 text-sm font-medium text-foreground/80">
            Welcome back! You are continuing right where you left off.
          </p>
        )}

        {/* Question card. The x-clip keeps the slide transition from causing
            horizontal scroll; -mx-10/px-10 moves the clip edge out 40px so the
            answer cards' blur-xl glow fades out fully instead of ending in a
            hard edge (the runner root's overflow-hidden still contains it). */}
        <div className="relative -mx-10 flex flex-1 flex-col justify-center overflow-x-clip px-10">
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
                      containerClassName="rounded-3xl"
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
                        className="relative h-full min-h-28 w-full flex-col justify-center gap-2 rounded-[21px] border-0 bg-card text-stage-assessment-strong data-checked:bg-accent"
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
                        <span className="font-sans text-4xl leading-none font-extrabold tracking-tight text-foreground sm:text-5xl">
                          {option.label}
                        </span>
                        <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
                          press
                          <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-xs font-bold text-foreground">
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
          {currentAnswered && !advancePending && !isBlocked ? (
            // A revisited (or just-paused) statement keeps its answer; this is
            // the explicit way forward besides re-tapping the chosen card.
            <Button
              variant="outline"
              size="lg"
              onClick={goForward}
              className="h-11 rounded-full bg-card px-5"
            >
              {nextLabel}
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <p className="text-right text-sm text-muted-foreground">
              Tap an answer to continue
              <span className="hidden sm:inline">, or press Y or N</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
