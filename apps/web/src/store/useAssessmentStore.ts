"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { QUESTIONS } from "@/lib/riasec/questions";
import type { GradeLevel } from "@/lib/riasec/types";

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
  nickname: string;
  gradeLevel: GradeLevel | null;
  school: string;
}

interface AssessmentState {
  currentStep: number;
  totalQuestions: number;
  answers: Record<string, AssessmentAnswer>;
  scores: RiasecScores;
  profile: ProfileState;
  lastUpdated: string | null;
  // When the last question was first answered (ISO). Unlike lastUpdated it
  // does not move on later edits; the results PDF password uses its date.
  completedAt: string | null;
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
  nickname: "",
  gradeLevel: null,
  school: "",
};

// On the server there is no localStorage, and handing persist an undefined
// storage makes it skip attaching its api — leaving store.persist undefined
// and crashing anything that reads it while rendering (the journey guard).
// An inert storage keeps that api present; the client rehydrates for real.
const noopStorage: Storage = {
  length: 0,
  clear: () => {},
  getItem: () => null,
  key: () => null,
  removeItem: () => {},
  setItem: () => {},
};

function ssrSafeStorage(): Storage {
  return typeof window === "undefined" ? noopStorage : window.localStorage;
}

const STORAGE_KEY = "aligned.assessment.v1";

// A saved session is temporary: these are shared and school devices, so an
// abandoned quiz must not be sitting there for the next student to resume.
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Whether a saved session is too old to restore. `null` is the fresh-store
 * value, so it is never expired. An unparseable stamp is: the TTL promises
 * nothing outlives a day, and a clock that cannot be read is one that promise
 * cannot be kept with.
 */
export function isSessionExpired(
  lastUpdated: string | null,
  now: number = Date.now(),
): boolean {
  if (lastUpdated === null) return false;
  const savedAt = new Date(lastUpdated).getTime();
  if (Number.isNaN(savedAt)) return true;
  return now - savedAt > SESSION_TTL_MS;
}

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
      completedAt: null,
      setTotalQuestions: (total) =>
        set({ totalQuestions: total, lastUpdated: new Date().toISOString() }),
      setCurrentStep: (step) =>
        set({ currentStep: step, lastUpdated: new Date().toISOString() }),
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

          const answers = { ...state.answers, [questionId]: answer };
          const now = new Date().toISOString();
          const finished =
            Object.keys(answers).length >= QUESTIONS.length;
          return {
            answers,
            scores,
            lastUpdated: now,
            completedAt: state.completedAt ?? (finished ? now : null),
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
          completedAt: null,
        }),
      reset: () =>
        set({
          currentStep: 0,
          totalQuestions: 0,
          answers: {},
          scores: { ...emptyScores },
          profile: { ...emptyProfile },
          lastUpdated: null,
          completedAt: null,
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 4,
      storage: createJSONStorage(() => ssrSafeStorage()),
      // 24h TTL. zustand calls this after `merge` has set the rehydrated state
      // but *before* it flips `hasHydrated`, so JourneyGuard — which gates on
      // onFinishHydration — never observes an expired session and no stale
      // results can paint.
      onRehydrateStorage: () => (state) => {
        if (!state || !isSessionExpired(state.lastUpdated)) return;
        // `state.reset()` rather than reaching for the exported store: with
        // localStorage every step of rehydration is synchronous, so this runs
        // inside the create() call below, while that const is still in its
        // TDZ. Same reason the key goes through ssrSafeStorage() instead of
        // useAssessmentStore.persist.clearStorage().
        state.reset();
        // reset() persists a fresh default blob on its way through; drop the
        // key outright so an abandoned session leaves nothing behind at all.
        ssrSafeStorage().removeItem(STORAGE_KEY);
      },
      // The default merge is shallow, so a stored profile would replace the
      // current one wholesale and any field added later would read undefined.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AssessmentState>;
        return {
          ...current,
          ...saved,
          profile: { ...emptyProfile, ...saved.profile },
        };
      },
      partialize: (state) => ({
        currentStep: state.currentStep,
        totalQuestions: state.totalQuestions,
        answers: state.answers,
        scores: state.scores,
        profile: state.profile,
        lastUpdated: state.lastUpdated,
        completedAt: state.completedAt,
      }),
      migrate: (persisted, version) => {
        // v1 payloads predate the profile step; inject an empty profile.
        const withProfile =
          version < 2
            ? {
                ...(persisted as Omit<AssessmentState, "profile">),
                profile: { ...emptyProfile },
              }
            : (persisted as AssessmentState);

        // Answers before v3 are Likert-scored against a retired question bank:
        // the ids no longer exist and the totals are on the wrong scale. Keep
        // the profile, drop the quiz.
        const withQuiz =
          version < 3
            ? {
                ...withProfile,
                currentStep: 0,
                answers: {},
                scores: { ...emptyScores },
              }
            : withProfile;

        // v4 introduced the nickname; older profiles have no such key.
        if (version < 4) {
          return {
            ...withQuiz,
            profile: { ...emptyProfile, ...withQuiz.profile },
          };
        }
        return withQuiz;
      },
    },
  ),
);

export const selectIsProfileComplete = (state: {
  profile: ProfileState;
}): boolean =>
  state.profile.nickname.length > 0 && state.profile.gradeLevel !== null;

export const selectIsAssessmentComplete = (state: {
  answers: Record<string, AssessmentAnswer>;
}): boolean => Object.keys(state.answers).length >= QUESTIONS.length;
