import { beforeEach, describe, expect, it } from "vitest";

import { QUESTIONS } from "@/lib/riasec/questions";
import {
  selectIsAssessmentComplete,
  selectIsProfileComplete,
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

  it("setProfile patches fields without clobbering the rest", () => {
    const { setProfile } = useAssessmentStore.getState();
    setProfile({ nickname: "MARI-EL" });
    setProfile({ gradeLevel: "11" });
    setProfile({ school: "San Fernando NHS" });

    const { profile } = useAssessmentStore.getState();
    expect(profile).toEqual({
      nickname: "MARI-EL",
      gradeLevel: "11",
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
      school: "",
    });
  });

  it("selectIsProfileComplete requires a nickname and a grade level", () => {
    expect(selectIsProfileComplete(useAssessmentStore.getState())).toBe(false);
    useAssessmentStore.getState().setProfile({ gradeLevel: "11" });
    expect(selectIsProfileComplete(useAssessmentStore.getState())).toBe(false);
    useAssessmentStore.getState().setProfile({ nickname: "MARI-EL" });
    expect(selectIsProfileComplete(useAssessmentStore.getState())).toBe(true);
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
      school: "San Fernando NHS",
    });
  });
});
