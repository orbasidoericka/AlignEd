"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import {
  isValidQuestionOrder,
  QUESTIONS,
  shuffleQuestionIds,
  type QuestionLanguage,
} from "@/lib/riasec/questions";
import { STRAND_OTHER } from "@/lib/riasec/types";
import type { GradeLevel, ShsStrand } from "@/lib/riasec/types";

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
  strand: ShsStrand | null;
  // The strand a student types when they pick "Others". Device only: the
  // server is only ever told "Others".
  strandOther: string;
  age: string;
  school: string;
  // Data Privacy Act consent, given on the profile step. Part of the profile
  // so reset() clears it and a new student on a shared device is asked again.
  privacyAccepted: boolean;
}

interface AssessmentState {
  currentStep: number;
  totalQuestions: number;
  answers: Record<string, AssessmentAnswer>;
  scores: RiasecScores;
  // The statements' presentation order for this session, as question ids.
  // Persisted so a refresh or resume keeps the same order (and so the
  // navigator's numbering stays stable); answers stay keyed by id, so a
  // reshuffle never loses or misattributes one. Empty until the first visit
  // seeds it via ensureQuestionOrder.
  questionOrder: string[];
  // Language the statements are shown in. Presentation only: answers and
  // scoring are keyed by question id, so switching mid-quiz changes nothing
  // already recorded.
  language: QuestionLanguage;
  profile: ProfileState;
  lastUpdated: string | null;
  // When the last question was first answered (ISO). Unlike lastUpdated it
  // does not move on later edits; the results PDF prints its date.
  completedAt: string | null;
  // The saved-results ID (ALGN-XXXX-XXXX) once these results are saved to
  // the server, so they are saved only once. Cleared with the answers.
  resultsId: string | null;
}

interface AssessmentActions {
  setTotalQuestions: (total: number) => void;
  setCurrentStep: (step: number) => void;
  setAnswer: (questionId: string, answer: AssessmentAnswer) => void;
  clearAnswer: (questionId: string) => void;
  // Seeds a random order on first use (or when the persisted one is stale),
  // and leaves a valid one untouched so a resumed session keeps its order.
  ensureQuestionOrder: () => void;
  setLanguage: (language: QuestionLanguage) => void;
  setProfile: (patch: Partial<ProfileState>) => void;
  setResultsId: (resultsId: string | null) => void;
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
  strand: null,
  strandOther: "",
  age: "",
  school: "",
  privacyAccepted: false,
};

// On the server there is no localStorage, and handing persist an undefined
// storage makes it skip attaching its api — leaving store.persist undefined
// and crashing anything that reads it while rendering (the journey guard).
// An inert storage keeps that api present; the client rehydrates for real.
const noopStorage: StateStorage = {
  getItem: () => null,
  removeItem: () => {},
  setItem: () => {},
};

// persist serializes the whole state and writes it synchronously on every
// set: each keystroke on the profile and each answer tap paid for a full
// JSON.stringify plus a blocking localStorage write. Writes are coalesced
// instead: the latest value lands after a short pause, and at once when the
// tab is hidden or closed. Removal is never delayed, so "Start over" and the
// 30-minute expiry still leave nothing behind immediately. Reads see the
// pending value, so nothing in this tab can observe a stale save.
export const STORAGE_WRITE_DELAY_MS = 250;

function coalescedStorage(target: Storage): StateStorage {
  const pending = new Map<string, string>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    for (const [key, value] of pending) {
      try {
        target.setItem(key, value);
      } catch (error) {
        // Quota or private-mode failure: the in-memory store stays correct
        // for this tab, as it did when persist wrote synchronously.
        console.warn("Could not save the session to this device:", error);
      }
    }
    pending.clear();
  };

  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });

  return {
    getItem: (key) => pending.get(key) ?? target.getItem(key),
    setItem: (key, value) => {
      pending.set(key, value);
      timer ??= setTimeout(flush, STORAGE_WRITE_DELAY_MS);
    },
    removeItem: (key) => {
      pending.delete(key);
      // Nothing left to save: drop the timer too, so the next write starts
      // its own pause instead of riding the cleared one's.
      if (pending.size === 0 && timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      target.removeItem(key);
    },
  };
}

let clientStorage: StateStorage | null = null;

function ssrSafeStorage(): StateStorage {
  if (typeof window === "undefined") return noopStorage;
  clientStorage ??= coalescedStorage(window.localStorage);
  return clientStorage;
}

const STORAGE_KEY = "aligned.assessment.v1";

// A saved session is temporary: these are shared and school devices, so an
// abandoned quiz must not be sitting there for the next student to resume.
// Kept short (30 minutes) so a walk-away never leaves a previous student's
// profile, answers, or results on the device for whoever sits down next.
export const SESSION_TTL_MS = 30 * 60 * 1000;

/**
 * Whether a saved session is too old to restore. `null` is the fresh-store
 * value, so it is never expired. An unparseable stamp is: the TTL promises
 * nothing outlives 30 minutes, and a clock that cannot be read is one that
 * promise cannot be kept with.
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

/**
 * Milliseconds a saved session has left before the TTL wipes it. `null` when
 * there is no session to count down. An unreadable stamp has nothing left,
 * matching isSessionExpired.
 */
export function sessionRemainingMs(
  lastUpdated: string | null,
  now: number = Date.now(),
): number | null {
  if (lastUpdated === null) return null;
  const savedAt = new Date(lastUpdated).getTime();
  if (Number.isNaN(savedAt)) return 0;
  return Math.max(0, SESSION_TTL_MS - (now - savedAt));
}

// A marker in sessionStorage, which the browser drops when the tab (or the
// browser session) ends while localStorage lives on. A finished session that
// arrives without the marker was left behind by a closed tab, so it is wiped:
// the next student on a shared device must not land on someone's results.
// An unfinished quiz keeps resuming (PRD E4).
export const TAB_MARKER_KEY = "aligned.tab";

function readTabMarker(): boolean {
  // Fail safe: where sessionStorage cannot be read, the 30-minute TTL is the
  // only wipe, so never wipe on a guess.
  try {
    if (typeof window === "undefined") return true;
    return window.sessionStorage.getItem(TAB_MARKER_KEY) !== null;
  } catch {
    return true;
  }
}

function setTabMarker(): void {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(TAB_MARKER_KEY, "1");
  } catch {
    // Silent: the TTL still applies.
  }
}

export function isOrphanedFinishedSession(
  completedAt: string | null,
  markerPresent: boolean,
): boolean {
  return completedAt !== null && !markerPresent;
}

// Persist locally so quiz progress survives refresh before syncing.
export const useAssessmentStore = create<AssessmentStore>()(
  persist(
    (set) => ({
      currentStep: 0,
      totalQuestions: 0,
      answers: {},
      scores: { ...emptyScores },
      questionOrder: [],
      language: "en",
      profile: { ...emptyProfile },
      lastUpdated: null,
      completedAt: null,
      resultsId: null,
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
      // Discards a single answer (e.g. after a rapid-answer block) so the
      // student must think it through again. Scores unwind the same way
      // setAnswer's revision path does, just without a new value going in.
      clearAnswer: (questionId) =>
        set((state) => {
          const existing = state.answers[questionId];
          if (!existing) return state;

          const scores = { ...state.scores };
          scores[existing.trait] = Math.max(
            0,
            scores[existing.trait] - existing.value,
          );

          const answers = { ...state.answers };
          delete answers[questionId];
          const finished = Object.keys(answers).length >= QUESTIONS.length;
          return {
            answers,
            scores,
            lastUpdated: new Date().toISOString(),
            completedAt: finished ? state.completedAt : null,
          };
        }),
      // Only seeds when the stored order can't be trusted, so a resumed
      // session keeps the order (and numbering) the student already saw.
      ensureQuestionOrder: () =>
        set((state) => {
          if (isValidQuestionOrder(state.questionOrder)) return state;
          return {
            questionOrder: shuffleQuestionIds(),
            lastUpdated: new Date().toISOString(),
          };
        }),
      setLanguage: (language) =>
        set({ language, lastUpdated: new Date().toISOString() }),
      setProfile: (patch) =>
        set((state) => ({
          profile: { ...state.profile, ...patch },
          lastUpdated: new Date().toISOString(),
        })),
      setResultsId: (resultsId) => set({ resultsId }),
      // Retake keeps the profile (PRD FR-3.6): only answers and scores clear.
      // A fresh order too, so the statements come back in a new sequence.
      resetAnswers: () =>
        set({
          currentStep: 0,
          answers: {},
          scores: { ...emptyScores },
          questionOrder: shuffleQuestionIds(),
          lastUpdated: new Date().toISOString(),
          completedAt: null,
          resultsId: null,
        }),
      reset: () =>
        set({
          currentStep: 0,
          totalQuestions: 0,
          answers: {},
          scores: { ...emptyScores },
          questionOrder: [],
          language: "en",
          profile: { ...emptyProfile },
          lastUpdated: null,
          completedAt: null,
          resultsId: null,
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 9,
      storage: createJSONStorage(() => ssrSafeStorage()),
      // 30-minute TTL. zustand calls this after `merge` has set the rehydrated state
      // but *before* it flips `hasHydrated`, so JourneyGuard — which gates on
      // onFinishHydration — never observes an expired session and no stale
      // results can paint.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const orphaned = isOrphanedFinishedSession(
          state.completedAt,
          readTabMarker(),
        );
        // Every load marks its tab, so finishing the quiz later in this tab
        // survives a refresh.
        setTabMarker();
        if (!orphaned && !isSessionExpired(state.lastUpdated)) return;
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
        questionOrder: state.questionOrder,
        language: state.language,
        profile: state.profile,
        lastUpdated: state.lastUpdated,
        completedAt: state.completedAt,
        resultsId: state.resultsId,
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
        const withNickname =
          version < 4
            ? {
                ...withQuiz,
                profile: { ...emptyProfile, ...withQuiz.profile },
              }
            : withQuiz;

        // v5 introduced the per-session question order. Older blobs have none;
        // merge leaves questionOrder empty and ensureQuestionOrder seeds it on
        // the next visit, so no explicit field is injected here.

        // v6 added age, v7 the privacy consent, and v8 the SHS strand.
        // merge's spread over emptyProfile fills these for older blobs, so
        // an older session simply has to complete the new profile choice.
        // v9 added the statement language; merge keeps the "en" default.
        // strandOther (the typed "Others" strand) needed no bump: merge's
        // spread over emptyProfile gives older blobs an empty string.
        return withNickname;
      },
    },
  ),
);

// Also gates the /assessment route through JourneyGuard, so a student cannot
// reach the quiz by URL without having agreed to the privacy notice.
export const selectIsProfileComplete = (state: {
  profile: ProfileState;
}): boolean =>
  state.profile.nickname.length > 0 &&
  state.profile.gradeLevel !== null &&
  state.profile.strand !== null &&
  (state.profile.strand !== STRAND_OTHER ||
    state.profile.strandOther.trim() !== "") &&
  state.profile.age !== "" &&
  state.profile.privacyAccepted;

export const selectIsAssessmentComplete = (state: {
  answers: Record<string, AssessmentAnswer>;
}): boolean => Object.keys(state.answers).length >= QUESTIONS.length;
