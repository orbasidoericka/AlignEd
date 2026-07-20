"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { QUESTIONS } from "@/lib/riasec/questions";
import type { GradeLevel, Strand } from "@/lib/riasec/types";

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

export interface ProfileState {
  gradeLevel: GradeLevel | null;
  strand: Strand | null;
  school: string;
}

interface AssessmentState {
  currentStep: number;
  totalQuestions: number;
  answers: Record<string, AssessmentAnswer>;
  scores: RiasecScores;
  profile: ProfileState;
  lastUpdated: string | null;
}

interface AssessmentActions {
  setTotalQuestions: (total: number) => void;
  setCurrentStep: (step: number) => void;
  setAnswer: (questionId: string, answer: AssessmentAnswer) => void;
  setProfile: (patch: Partial<ProfileState>) => void;
  resetAnswers: () => void;
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

const emptyProfile: ProfileState = {
  gradeLevel: null,
  strand: null,
  school: "",
};

// Persist locally so quiz progress survives refresh before syncing.
export const useAssessmentStore = create<AssessmentStore>()(
  persist(
    (set) => ({
      currentStep: 0,
      totalQuestions: 0,
      answers: {},
      scores: { ...emptyScores },
      profile: { ...emptyProfile },
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
      setProfile: (patch) =>
        set((state) => ({
          profile: { ...state.profile, ...patch },
          lastUpdated: new Date().toISOString(),
        })),
      // Retake keeps the profile (PRD FR-3.6): only answers and scores clear.
      resetAnswers: () =>
        set({
          currentStep: 0,
          answers: {},
          scores: { ...emptyScores },
          lastUpdated: new Date().toISOString(),
        }),
      reset: () =>
        set({
          currentStep: 0,
          totalQuestions: 0,
          answers: {},
          scores: { ...emptyScores },
          profile: { ...emptyProfile },
          lastUpdated: null,
        }),
    }),
    {
      name: "aligned.assessment.v1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        totalQuestions: state.totalQuestions,
        answers: state.answers,
        scores: state.scores,
        profile: state.profile,
        lastUpdated: state.lastUpdated,
      }),
      migrate: (persisted, version) => {
        // v1 payloads predate the profile step; inject an empty profile.
        if (version < 2) {
          return {
            ...(persisted as Omit<AssessmentState, "profile">),
            profile: { ...emptyProfile },
          };
        }
        return persisted as AssessmentState;
      },
    },
  ),
);

export const selectIsProfileComplete = (state: {
  profile: ProfileState;
}): boolean =>
  state.profile.gradeLevel !== null && state.profile.strand !== null;

export const selectIsAssessmentComplete = (state: {
  answers: Record<string, AssessmentAnswer>;
}): boolean => Object.keys(state.answers).length >= QUESTIONS.length;
