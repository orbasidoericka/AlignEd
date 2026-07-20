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

  it("tallies answers into trait scores", () => {
    const { setAnswer } = useAssessmentStore.getState();
    setAnswer("q1", { trait: "artistic", value: 4 });
    setAnswer("q2", { trait: "artistic", value: 3 });
    setAnswer("q3", { trait: "realistic", value: 5 });

    const { scores } = useAssessmentStore.getState();
    expect(scores.artistic).toBe(7);
    expect(scores.realistic).toBe(5);
    expect(scores.social).toBe(0);
  });

  it("subtracts the previous value when a question is re-answered", () => {
    const { setAnswer } = useAssessmentStore.getState();
    setAnswer("q1", { trait: "artistic", value: 4 });
    setAnswer("q1", { trait: "social", value: 2 });

    const { scores, answers } = useAssessmentStore.getState();
    expect(scores.artistic).toBe(0);
    expect(scores.social).toBe(2);
    expect(answers.q1).toEqual({ trait: "social", value: 2 });
  });

  it("re-answering the same trait replaces rather than accumulates", () => {
    const { setAnswer } = useAssessmentStore.getState();
    setAnswer("q1", { trait: "enterprising", value: 5 });
    setAnswer("q1", { trait: "enterprising", value: 1 });

    expect(useAssessmentStore.getState().scores.enterprising).toBe(1);
  });

  it("never lets a score go negative", () => {
    const { setAnswer } = useAssessmentStore.getState();
    setAnswer("q1", { trait: "conventional", value: 3 });
    // Corrupted/legacy state could make the subtraction overshoot; the store
    // clamps at zero instead of going negative.
    useAssessmentStore.setState((state) => ({
      scores: { ...state.scores, conventional: 1 },
    }));
    setAnswer("q1", { trait: "investigative", value: 2 });

    const { scores } = useAssessmentStore.getState();
    expect(scores.conventional).toBe(0);
    expect(scores.investigative).toBe(2);
  });

  it("reset returns the store to its initial state", () => {
    const { setAnswer, setCurrentStep, setTotalQuestions } =
      useAssessmentStore.getState();
    setTotalQuestions(30);
    setCurrentStep(7);
    setAnswer("q1", { trait: "social", value: 5 });

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
    setProfile({ gradeLevel: "11" });
    setProfile({ strand: "STEM" });
    setProfile({ school: "San Fernando NHS" });

    const { profile } = useAssessmentStore.getState();
    expect(profile).toEqual({
      gradeLevel: "11",
      strand: "STEM",
      school: "San Fernando NHS",
    });
  });

  it("resetAnswers clears the quiz but keeps the profile (PRD FR-3.6)", () => {
    const { setProfile, setAnswer, setCurrentStep } =
      useAssessmentStore.getState();
    setProfile({ gradeLevel: "12", strand: "HUMSS" });
    setAnswer("q1", { trait: "social", value: 5 });
    setCurrentStep(4);

    useAssessmentStore.getState().resetAnswers();

    const state = useAssessmentStore.getState();
    expect(state.answers).toEqual({});
    expect(state.scores.social).toBe(0);
    expect(state.currentStep).toBe(0);
    expect(state.profile.gradeLevel).toBe("12");
    expect(state.profile.strand).toBe("HUMSS");
  });

  it("full reset clears the profile too", () => {
    useAssessmentStore.getState().setProfile({ gradeLevel: "11", strand: "ABM" });
    useAssessmentStore.getState().reset();
    expect(useAssessmentStore.getState().profile).toEqual({
      gradeLevel: null,
      strand: null,
      school: "",
    });
  });

  it("selectIsProfileComplete requires grade level and strand", () => {
    expect(selectIsProfileComplete(useAssessmentStore.getState())).toBe(false);
    useAssessmentStore.getState().setProfile({ gradeLevel: "11" });
    expect(selectIsProfileComplete(useAssessmentStore.getState())).toBe(false);
    useAssessmentStore.getState().setProfile({ strand: "TVL" });
    expect(selectIsProfileComplete(useAssessmentStore.getState())).toBe(true);
  });

  it("selectIsAssessmentComplete requires every question answered", () => {
    const { setAnswer } = useAssessmentStore.getState();
    for (const question of QUESTIONS.slice(0, -1)) {
      setAnswer(question.id, { trait: question.trait, value: 3 });
    }
    expect(selectIsAssessmentComplete(useAssessmentStore.getState())).toBe(false);

    const last = QUESTIONS.at(-1);
    if (!last) throw new Error("question bank is empty");
    setAnswer(last.id, { trait: last.trait, value: 3 });
    expect(selectIsAssessmentComplete(useAssessmentStore.getState())).toBe(true);
  });

  it("migrates v1 persisted payloads by injecting an empty profile", () => {
    const migrate = useAssessmentStore.persist.getOptions().migrate;
    expect(migrate).toBeDefined();
    const v1Payload = {
      currentStep: 3,
      totalQuestions: 18,
      answers: { q1: { trait: "social", value: 4 } },
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
      gradeLevel: null,
      strand: null,
      school: "",
    });
    expect(migrated.currentStep).toBe(3);
  });
});
