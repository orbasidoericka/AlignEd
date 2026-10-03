import { beforeEach, describe, expect, it, vi } from "vitest";

import { QUESTIONS } from "@/lib/riasec/questions";
import {
  isSessionExpired,
  selectIsAssessmentComplete,
  selectIsProfileComplete,
  SESSION_TTL_MS,
  useAssessmentStore,
} from "./useAssessmentStore";

describe("useAssessmentStore", () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset();
  });

  it("tallies yes answers into trait scores", () => {
    const { setAnswer } = useAssessmentStore.getState();
    setAnswer("q1", { trait: "artistic", value: 1 });
    setAnswer("q2", { trait: "artistic", value: 1 });
    setAnswer("q3", { trait: "realistic", value: 1 });
    setAnswer("q4", { trait: "realistic", value: 0 });

    const { scores } = useAssessmentStore.getState();
    expect(scores.artistic).toBe(2);
    expect(scores.realistic).toBe(1);
    expect(scores.social).toBe(0);
  });

  it("counts a no answer as answered without scoring it", () => {
    const { setAnswer } = useAssessmentStore.getState();
    setAnswer("q1", { trait: "social", value: 0 });

    const { scores, answers } = useAssessmentStore.getState();
    expect(scores.social).toBe(0);
    expect(answers.q1).toEqual({ trait: "social", value: 0 });
    expect(Object.keys(answers)).toHaveLength(1);
  });

  it("subtracts the previous value when a question is re-answered", () => {
    const { setAnswer } = useAssessmentStore.getState();
    setAnswer("q1", { trait: "artistic", value: 1 });
    setAnswer("q1", { trait: "social", value: 1 });

    const { scores, answers } = useAssessmentStore.getState();
    expect(scores.artistic).toBe(0);
    expect(scores.social).toBe(1);
    expect(answers.q1).toEqual({ trait: "social", value: 1 });
  });

  it("changing yes to no on the same question decrements the trait", () => {
    const { setAnswer } = useAssessmentStore.getState();
    setAnswer("q1", { trait: "enterprising", value: 1 });
    setAnswer("q1", { trait: "enterprising", value: 0 });

    expect(useAssessmentStore.getState().scores.enterprising).toBe(0);
  });

  it("never lets a score go negative", () => {
    const { setAnswer } = useAssessmentStore.getState();
    setAnswer("q1", { trait: "conventional", value: 1 });
    // Corrupted/legacy state could make the subtraction overshoot; the store
    // clamps at zero instead of going negative.
    useAssessmentStore.setState((state) => ({
      scores: { ...state.scores, conventional: 0 },
    }));
    setAnswer("q1", { trait: "investigative", value: 1 });

    const { scores } = useAssessmentStore.getState();
    expect(scores.conventional).toBe(0);
    expect(scores.investigative).toBe(1);
  });

  it("clearAnswer discards a single answer and unwinds its score", () => {
    const { setAnswer, clearAnswer } = useAssessmentStore.getState();
    setAnswer("q1", { trait: "artistic", value: 1 });
    setAnswer("q2", { trait: "realistic", value: 1 });

    clearAnswer("q1");

    const { answers, scores } = useAssessmentStore.getState();
    expect(answers.q1).toBeUndefined();
    expect(answers.q2).toEqual({ trait: "realistic", value: 1 });
    expect(scores.artistic).toBe(0);
    expect(scores.realistic).toBe(1);
  });

  it("clearAnswer on an unanswered question is a no-op", () => {
    const { setAnswer, clearAnswer } = useAssessmentStore.getState();
    setAnswer("q1", { trait: "artistic", value: 1 });

    clearAnswer("does-not-exist");

    const { answers, scores } = useAssessmentStore.getState();
    expect(Object.keys(answers)).toHaveLength(1);
    expect(scores.artistic).toBe(1);
  });

  it("clearAnswer drops completedAt when it un-finishes the quiz", () => {
    const { setAnswer, clearAnswer } = useAssessmentStore.getState();
    for (const question of QUESTIONS) {
      setAnswer(question.id, { trait: question.trait, value: 1 });
    }
    expect(useAssessmentStore.getState().completedAt).not.toBeNull();

    clearAnswer(QUESTIONS[0]!.id);

    expect(useAssessmentStore.getState().completedAt).toBeNull();
  });

  it("reset returns the store to its initial state", () => {
    const { setAnswer, setCurrentStep, setTotalQuestions } =
      useAssessmentStore.getState();
    setTotalQuestions(30);
    setCurrentStep(7);
    setAnswer("q1", { trait: "social", value: 1 });

    useAssessmentStore.getState().reset();

    const state = useAssessmentStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.totalQuestions).toBe(0);
    expect(state.answers).toEqual({});
    expect(state.scores.social).toBe(0);
    expect(state.lastUpdated).toBeNull();
  });

  it("stamps completedAt once, when the last question is answered", () => {
    vi.useFakeTimers();
    try {
      const { setAnswer } = useAssessmentStore.getState();
      vi.setSystemTime(new Date("2026-09-30T08:00:00Z"));
      for (const question of QUESTIONS.slice(0, -1)) {
        setAnswer(question.id, { trait: question.trait, value: 1 });
      }
      expect(useAssessmentStore.getState().completedAt).toBeNull();

      const last = QUESTIONS[QUESTIONS.length - 1]!;
      setAnswer(last.id, { trait: last.trait, value: 1 });
      expect(useAssessmentStore.getState().completedAt).toBe(
        "2026-09-30T08:00:00.000Z",
      );

      // Changing an answer later moves lastUpdated but not completedAt, so
      // the PDF password stays the same.
      vi.setSystemTime(new Date("2026-10-05T08:00:00Z"));
      setAnswer(last.id, { trait: last.trait, value: 0 });
      const state = useAssessmentStore.getState();
      expect(state.completedAt).toBe("2026-09-30T08:00:00.000Z");
      expect(state.lastUpdated).toBe("2026-10-05T08:00:00.000Z");
    } finally {
      vi.useRealTimers();
    }
  });

  it("ensureQuestionOrder seeds a full permutation and then leaves it", () => {
    const { ensureQuestionOrder } = useAssessmentStore.getState();
    expect(useAssessmentStore.getState().questionOrder).toEqual([]);

    ensureQuestionOrder();
    const order = useAssessmentStore.getState().questionOrder;
    const ids = QUESTIONS.map((q) => q.id);
    // A permutation: every id once, nothing invented.
    expect([...order].sort()).toEqual([...ids].sort());

    // A valid order is left untouched (a resumed session keeps its sequence).
    ensureQuestionOrder();
    expect(useAssessmentStore.getState().questionOrder).toBe(order);
  });

  it("ensureQuestionOrder rebuilds an order that no longer fits the bank", () => {
    useAssessmentStore.setState({ questionOrder: ["q1", "q1", "ghost"] });
    useAssessmentStore.getState().ensureQuestionOrder();
    const order = useAssessmentStore.getState().questionOrder;
    expect(order).toHaveLength(QUESTIONS.length);
    expect(new Set(order).size).toBe(QUESTIONS.length);
  });

  it("resetAnswers reshuffles so a retake comes back in a new order", () => {
    const ids = QUESTIONS.map((q) => q.id);
    useAssessmentStore.setState({ questionOrder: ids });

    useAssessmentStore.getState().resetAnswers();
    const order = useAssessmentStore.getState().questionOrder;
    // Still a full permutation, just reseeded.
    expect([...order].sort()).toEqual([...ids].sort());
    expect(order).toHaveLength(QUESTIONS.length);
  });

  it("reset clears the question order back to empty", () => {
    useAssessmentStore.setState({ questionOrder: QUESTIONS.map((q) => q.id) });
    useAssessmentStore.getState().reset();
    expect(useAssessmentStore.getState().questionOrder).toEqual([]);
  });

  it("clears completedAt on a retake", () => {
    const { setAnswer } = useAssessmentStore.getState();
    for (const question of QUESTIONS) {
      setAnswer(question.id, { trait: question.trait, value: 1 });
    }
    expect(useAssessmentStore.getState().completedAt).not.toBeNull();

    useAssessmentStore.getState().resetAnswers();
    expect(useAssessmentStore.getState().completedAt).toBeNull();
  });

  it("setProfile patches fields without clobbering the rest", () => {
    const { setProfile } = useAssessmentStore.getState();
    setProfile({ nickname: "MARI-EL" });
    setProfile({ gradeLevel: "11" });
    setProfile({ school: "San Fernando NHS" });

    const { profile } = useAssessmentStore.getState();
    expect(profile).toEqual({
      nickname: "MARI-EL",
      gradeLevel: "11",
      age: "",
      privacyAccepted: false,
      school: "San Fernando NHS",
    });
  });

  it("resetAnswers clears the quiz but keeps the profile (PRD FR-3.6)", () => {
    const { setProfile, setAnswer, setCurrentStep } =
      useAssessmentStore.getState();
    setProfile({ gradeLevel: "12" });
    setAnswer("q1", { trait: "social", value: 1 });
    setCurrentStep(4);

    useAssessmentStore.getState().resetAnswers();

    const state = useAssessmentStore.getState();
    expect(state.answers).toEqual({});
    expect(state.scores.social).toBe(0);
    expect(state.currentStep).toBe(0);
    expect(state.profile.gradeLevel).toBe("12");
  });

  it("full reset clears the profile too", () => {
    useAssessmentStore
      .getState()
      .setProfile({ nickname: "MARI-EL", gradeLevel: "11" });
    useAssessmentStore.getState().reset();
    expect(useAssessmentStore.getState().profile).toEqual({
      nickname: "",
      gradeLevel: null,
      age: "",
      privacyAccepted: false,
      school: "",
    });
  });

  it("selectIsProfileComplete requires nickname, grade, age, and consent", () => {
    expect(selectIsProfileComplete(useAssessmentStore.getState())).toBe(false);
    useAssessmentStore.getState().setProfile({ gradeLevel: "11" });
    expect(selectIsProfileComplete(useAssessmentStore.getState())).toBe(false);
    useAssessmentStore.getState().setProfile({ nickname: "MARI-EL" });
    expect(selectIsProfileComplete(useAssessmentStore.getState())).toBe(false);
    useAssessmentStore.getState().setProfile({ age: "17" });
    // Everything filled in, but the privacy notice has not been agreed to.
    expect(selectIsProfileComplete(useAssessmentStore.getState())).toBe(false);
    useAssessmentStore.getState().setProfile({ privacyAccepted: true });
    expect(selectIsProfileComplete(useAssessmentStore.getState())).toBe(true);
  });

  it("withdrawing privacy consent blocks the assessment again", () => {
    useAssessmentStore.getState().setProfile({
      nickname: "MARI-EL",
      gradeLevel: "11",
      age: "17",
      privacyAccepted: true,
    });
    expect(selectIsProfileComplete(useAssessmentStore.getState())).toBe(true);
    useAssessmentStore.getState().setProfile({ privacyAccepted: false });
    expect(selectIsProfileComplete(useAssessmentStore.getState())).toBe(false);
  });

  it("selectIsAssessmentComplete requires every question answered", () => {
    const { setAnswer } = useAssessmentStore.getState();
    for (const question of QUESTIONS.slice(0, -1)) {
      setAnswer(question.id, { trait: question.trait, value: 1 });
    }
    expect(selectIsAssessmentComplete(useAssessmentStore.getState())).toBe(false);

    const last = QUESTIONS.at(-1);
    if (!last) throw new Error("question bank is empty");
    // A "no" on the final item still completes the assessment.
    setAnswer(last.id, { trait: last.trait, value: 0 });
    expect(selectIsAssessmentComplete(useAssessmentStore.getState())).toBe(true);
  });

  it("migrates v1 persisted payloads by injecting an empty profile", () => {
    const migrate = useAssessmentStore.persist.getOptions().migrate;
    expect(migrate).toBeDefined();
    const v1Payload = {
      currentStep: 3,
      totalQuestions: 18,
      answers: { r1: { trait: "social", value: 4 } },
      scores: {
        realistic: 0,
        investigative: 0,
        artistic: 0,
        social: 4,
        enterprising: 0,
        conventional: 0,
      },
      lastUpdated: "2026-01-01T00:00:00.000Z",
    };
    const migrated = migrate!(v1Payload, 1) as {
      profile: unknown;
      currentStep: number;
    };
    expect(migrated.profile).toEqual({
      nickname: "",
      gradeLevel: null,
      age: "",
      privacyAccepted: false,
      school: "",
    });
    expect(migrated.currentStep).toBe(0);
  });

  it("merge fills in profile keys missing from a stored payload", () => {
    const merge = useAssessmentStore.persist.getOptions().merge;
    expect(merge).toBeDefined();
    const current = useAssessmentStore.getState();
    const merged = merge!(
      { profile: { gradeLevel: "9", school: "" }, currentStep: 2 },
      current,
    ) as { profile: { nickname: string; gradeLevel: string } };

    expect(merged.profile.nickname).toBe("");
    expect(merged.profile.gradeLevel).toBe("9");
  });

  it("backfills an empty nickname onto pre-v4 profiles", () => {
    const migrate = useAssessmentStore.persist.getOptions().migrate;
    expect(migrate).toBeDefined();
    const v3Payload = {
      currentStep: 0,
      totalQuestions: 42,
      answers: {},
      scores: {
        realistic: 0,
        investigative: 0,
        artistic: 0,
        social: 0,
        enterprising: 0,
        conventional: 0,
      },
      profile: { gradeLevel: "12", school: "San Fernando NHS" },
      lastUpdated: "2026-01-01T00:00:00.000Z",
    };
    const migrated = migrate!(v3Payload, 3) as { profile: unknown };

    expect(migrated.profile).toEqual({
      nickname: "",
      gradeLevel: "12",
      age: "",
      privacyAccepted: false,
      school: "San Fernando NHS",
    });
  });

  it("drops pre-v3 Likert answers but keeps the profile", () => {
    const migrate = useAssessmentStore.persist.getOptions().migrate;
    expect(migrate).toBeDefined();
    const v2Payload = {
      currentStep: 12,
      totalQuestions: 18,
      answers: {
        r1: { trait: "realistic", value: 5 },
        a2: { trait: "artistic", value: 3 },
      },
      scores: {
        realistic: 5,
        investigative: 0,
        artistic: 3,
        social: 0,
        enterprising: 0,
        conventional: 0,
      },
      profile: { gradeLevel: "10", school: "San Fernando NHS" },
      lastUpdated: "2026-01-01T00:00:00.000Z",
    };
    const migrated = migrate!(v2Payload, 2) as {
      profile: unknown;
      answers: Record<string, unknown>;
      scores: Record<string, number>;
      currentStep: number;
    };

    expect(migrated.answers).toEqual({});
    expect(migrated.scores).toEqual({
      realistic: 0,
      investigative: 0,
      artistic: 0,
      social: 0,
      enterprising: 0,
      conventional: 0,
    });
    expect(migrated.currentStep).toBe(0);
    expect(migrated.profile).toEqual({
      nickname: "",
      gradeLevel: "10",
      age: "",
      privacyAccepted: false,
      school: "San Fernando NHS",
    });
  });

  it("stamps lastUpdated when the student moves through the quiz", () => {
    const { setCurrentStep, setTotalQuestions } = useAssessmentStore.getState();
    expect(useAssessmentStore.getState().lastUpdated).toBeNull();

    setCurrentStep(3);
    expect(useAssessmentStore.getState().lastUpdated).not.toBeNull();

    useAssessmentStore.getState().reset();
    setTotalQuestions(42);
    expect(useAssessmentStore.getState().lastUpdated).not.toBeNull();
  });
});

describe("isSessionExpired", () => {
  const now = new Date("2026-10-01T12:00:00Z").getTime();
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("treats a fresh store as live, not expired", () => {
    expect(isSessionExpired(null, now)).toBe(false);
  });

  it("expires a stamp it cannot read, because the age cannot be proven", () => {
    expect(isSessionExpired("not-a-date", now)).toBe(true);
  });

  it("keeps a session younger than the TTL", () => {
    expect(isSessionExpired(ago(29 * 60 * 1000), now)).toBe(false);
  });

  it("keeps a session exactly at the TTL", () => {
    expect(isSessionExpired(ago(SESSION_TTL_MS), now)).toBe(false);
  });

  it("expires a session past the TTL", () => {
    expect(isSessionExpired(ago(31 * 60 * 1000), now)).toBe(true);
  });
});

// The TTL runs on rehydration, so these drive persist directly rather than
// calling actions: a stale blob is what a returning student actually arrives
// with.
describe("session expiry on rehydration", () => {
  const STORAGE_KEY = "aligned.assessment.v1";
  const NOW = new Date("2026-10-01T12:00:00Z");

  const writeSession = (lastUpdated: string) => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 4,
        state: {
          currentStep: 7,
          totalQuestions: 42,
          answers: { q1: { trait: "social", value: 1 } },
          scores: {
            realistic: 0,
            investigative: 0,
            artistic: 0,
            social: 1,
            enterprising: 0,
            conventional: 0,
          },
          profile: {
            nickname: "MARI-EL",
            gradeLevel: "12",
            school: "San Fernando NHS",
          },
          lastUpdated,
          completedAt: null,
        },
      }),
    );
  };

  beforeEach(() => {
    useAssessmentStore.getState().reset();
    window.localStorage.removeItem(STORAGE_KEY);
  });

  it("wipes a session older than 30 minutes and clears its storage key", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(NOW);
      writeSession(new Date(NOW.getTime() - 31 * 60 * 1000).toISOString());

      useAssessmentStore.persist.rehydrate();

      const state = useAssessmentStore.getState();
      expect(state.answers).toEqual({});
      expect(state.scores.social).toBe(0);
      expect(state.currentStep).toBe(0);
      expect(state.profile.nickname).toBe("");
      expect(state.lastUpdated).toBeNull();
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("restores a session from ten minutes ago untouched", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(NOW);
      const lastUpdated = new Date(NOW.getTime() - 10 * 60 * 1000).toISOString();
      writeSession(lastUpdated);

      useAssessmentStore.persist.rehydrate();

      const state = useAssessmentStore.getState();
      // Proves the blob shape is right, so "wiped" in the test above cannot be
      // a false pass from a payload persist never understood.
      expect(state.answers.q1).toEqual({ trait: "social", value: 1 });
      expect(state.profile.nickname).toBe("MARI-EL");
      expect(state.currentStep).toBe(7);
      expect(state.lastUpdated).toBe(lastUpdated);
      expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
