import { beforeEach, describe, expect, it } from "vitest";

import { useAssessmentStore } from "./useAssessmentStore";

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
});
