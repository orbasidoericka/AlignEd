"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type RiasecTrait =
  | "realistic"
  | "investigative"
  | "artistic"
  | "social"
  | "enterprising"
  | "conventional";

export type RiasecScores = Record<RiasecTrait, number>;

export interface AssessmentAnswer {
  trait: RiasecTrait;
  value: number;
}

interface AssessmentState {
  currentStep: number;
  totalQuestions: number;
  answers: Record<string, AssessmentAnswer>;
  scores: RiasecScores;
  lastUpdated: string | null;
}

interface AssessmentActions {
  setTotalQuestions: (total: number) => void;
  setCurrentStep: (step: number) => void;
  setAnswer: (questionId: string, answer: AssessmentAnswer) => void;
  reset: () => void;
}

type AssessmentStore = AssessmentState & AssessmentActions;

const emptyScores: RiasecScores = {
  realistic: 0,
  investigative: 0,
  artistic: 0,
  social: 0,
  enterprising: 0,
  conventional: 0,
};

// Persist locally so quiz progress survives refresh before syncing.
export const useAssessmentStore = create<AssessmentStore>()(
  persist(
    (set) => ({
      currentStep: 0,
      totalQuestions: 0,
      answers: {},
      scores: { ...emptyScores },
      lastUpdated: null,
      setTotalQuestions: (total) => set({ totalQuestions: total }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setAnswer: (questionId, answer) =>
        set((state) => {
          const previous = state.answers[questionId];
          const scores = { ...state.scores };

          if (previous) {
            scores[previous.trait] = Math.max(
              0,
              scores[previous.trait] - previous.value,
            );
          }

          scores[answer.trait] = scores[answer.trait] + answer.value;

          return {
            answers: { ...state.answers, [questionId]: answer },
            scores,
            lastUpdated: new Date().toISOString(),
          };
        }),
      reset: () =>
        set({
          currentStep: 0,
          totalQuestions: 0,
          answers: {},
          scores: { ...emptyScores },
          lastUpdated: null,
        }),
    }),
    {
      name: "aligned.assessment.v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        totalQuestions: state.totalQuestions,
        answers: state.answers,
        scores: state.scores,
        lastUpdated: state.lastUpdated,
      }),
    },
  ),
);
