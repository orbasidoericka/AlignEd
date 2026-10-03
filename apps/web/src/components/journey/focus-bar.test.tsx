import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QUESTIONS } from "@/lib/riasec/questions";
import { useAssessmentStore } from "@/store/useAssessmentStore";

import { FocusBar } from "./focus-bar";

const push = vi.hoisted(() => vi.fn());
const pathname = vi.hoisted(() => ({ current: "/assessment" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname.current,
}));

describe("FocusBar start over", () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset();
    push.mockClear();
    pathname.current = "/assessment";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function seedSession() {
    const { setProfile, setAnswer, ensureQuestionOrder } =
      useAssessmentStore.getState();
    setProfile({ nickname: "MARI", gradeLevel: "12" });
    setAnswer(QUESTIONS[0]!.id, { trait: QUESTIONS[0]!.trait, value: 1 });
    ensureQuestionOrder();
  }

  it("confirming wipes profile, answers and order, then routes to the start", () => {
    seedSession();
    render(<FocusBar />);

    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Start over" }));

    const state = useAssessmentStore.getState();
    expect(state.answers).toEqual({});
    expect(state.profile.nickname).toBe("");
    expect(state.profile.gradeLevel).toBeNull();
    expect(state.questionOrder).toEqual([]);
    expect(push).toHaveBeenCalledExactlyOnceWith("/assessment/profile");
  });

  it("keeping progress leaves the session untouched", () => {
    seedSession();
    render(<FocusBar />);

    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Keep my progress" }),
    );

    const state = useAssessmentStore.getState();
    expect(state.profile.nickname).toBe("MARI");
    expect(Object.keys(state.answers)).toHaveLength(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("is absent on Profile Setup, present on the quiz", () => {
    pathname.current = "/assessment/profile";
    const { rerender } = render(<FocusBar />);
    expect(
      screen.queryByRole("button", { name: "Start over" }),
    ).toBeNull();

    pathname.current = "/assessment";
    rerender(<FocusBar />);
    expect(
      screen.getByRole("button", { name: "Start over" }),
    ).toBeInTheDocument();
  });
});
