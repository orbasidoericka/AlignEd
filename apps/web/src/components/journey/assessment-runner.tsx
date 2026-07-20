// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  RadioCard,
  RadioCardIndicator,
  RadioGroup,
} from "@/components/ui/radio-group";
import { LIKERT_OPTIONS, QUESTIONS } from "@/lib/riasec/questions";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

const ADVANCE_DELAY_MS = 280;

// RIASEC quiz runner (PRD FR-3): one question in focus, answers persist on
// every change, resume at first unanswered. Stage accent: calming blue.
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
    return index === -1 ? QUESTIONS.length - 1 : index;
    // Resume position only matters on mount; answers churn afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(firstUnanswered);
  const [direction, setDirection] = useState(1);
  const [finishing, setFinishing] = useState(false);
  const [resumed] = useState(
    () => Object.keys(answers).length > 0 && firstUnanswered > 0,
  );
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const question = QUESTIONS[index];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount >= QUESTIONS.length;
  const progressValue = Math.round((answeredCount / QUESTIONS.length) * 100);

  // Unreachable: index always stays inside the bank's bounds.
  if (!question) return null;

  const handleSelect = (value: number) => {
    setAnswer(question.id, { trait: question.trait, value });

    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      if (index < QUESTIONS.length - 1) {
        setDirection(1);
        setIndex((i) => i + 1);
      } else {
        setFinishing(true);
      }
    }, ADVANCE_DELAY_MS);
  };

  const goBack = () => {
    if (index === 0) return;
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setDirection(-1);
    setIndex((i) => i - 1);
  };

  if (finishing && allAnswered) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-stage-assessment-soft px-4 py-16 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-stage-assessment text-stage-assessment-foreground">
          <PartyPopper className="size-10" aria-hidden />
        </span>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          All done!
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Every answer is in. Your Holland Code and strand verdict are ready.
        </p>
        <Button
          size="lg"
          onClick={() => router.push("/results")}
          className="h-13 rounded-full bg-stage-results px-8 font-heading text-lg font-semibold text-stage-results-foreground hover:bg-stage-results/85"
        >
          See my results
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-stage-assessment-soft">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        {/* Progress (PRD FR-3.3) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <p className="font-heading text-sm font-bold text-stage-assessment-strong">
              Step 2 of 3
            </p>
            <p
              className="text-sm font-semibold text-muted-foreground"
              aria-live="polite"
            >
              Question {index + 1} of {QUESTIONS.length}
            </p>
          </div>
          <Progress
            value={progressValue}
            aria-label={`${progressValue} percent answered`}
            indicatorClassName="bg-stage-assessment"
          />
        </div>

        {resumed && index === firstUnanswered && (
          <p className="rounded-2xl bg-card px-4 py-3 text-sm font-medium text-foreground/80">
            Welcome back! You are continuing right where you left off.
          </p>
        )}

        {/* Question card */}
        <div className="relative flex flex-1 flex-col justify-center overflow-x-clip">
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
              <h1 className="min-h-20 text-2xl font-bold text-foreground sm:text-3xl">
                {question.text}
              </h1>

              <RadioGroup
                key={question.id}
                aria-label="How much is this like you?"
                value={answers[question.id]?.value ?? null}
                onValueChange={(value) => handleSelect(value as number)}
                className="flex flex-col gap-2.5"
              >
                {LIKERT_OPTIONS.map((option) => (
                  <RadioCard
                    key={option.value}
                    value={option.value}
                    className="text-stage-assessment-strong data-checked:bg-stage-assessment/12"
                  >
                    <span className="text-xl" aria-hidden>
                      {option.emoji}
                    </span>
                    <span className="flex-1 font-semibold text-foreground">
                      {option.label}
                    </span>
                    <RadioCardIndicator />
                  </RadioCard>
                ))}
              </RadioGroup>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between pb-2">
          <Button
            variant="ghost"
            size="lg"
            onClick={goBack}
            disabled={index === 0}
            className={cn("rounded-full", index === 0 && "invisible")}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <p className="text-sm text-muted-foreground">
            Tap an answer to continue
          </p>
        </div>
      </div>
    </div>
  );
}
