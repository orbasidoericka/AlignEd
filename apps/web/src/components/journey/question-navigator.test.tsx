import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AssessmentAnswer } from "@/store/useAssessmentStore";

import { QuestionNavigator } from "./question-navigator";

const QUESTIONS = Array.from({ length: 12 }, (_, i) => ({ id: `q${i + 1}` }));

function answered(...numbers: number[]): Record<string, AssessmentAnswer> {
  return Object.fromEntries(
    numbers.map((n) => [`q${n}`, { trait: "social", value: 1 }]),
  );
}

function renderNavigator(
  props: Partial<React.ComponentProps<typeof QuestionNavigator>> = {},
) {
  const onJump = vi.fn();
  const onFinish = vi.fn();
  render(
    <QuestionNavigator
      questions={QUESTIONS}
      answers={{}}
      currentIndex={0}
      flagOpen={false}
      onJump={onJump}
      onFinish={onFinish}
      {...props}
    />,
  );
  return { onJump, onFinish };
}

const cell = (n: number) =>
  screen.getByRole("button", { name: new RegExp(`^Question ${n},`) });

describe("QuestionNavigator", () => {
  it("renders one numbered cell per statement, in order", () => {
    renderNavigator();
    const nav = screen.getByRole("navigation", { name: "Question navigator" });
    const buttons = within(nav).getAllByRole("button");
    expect(buttons).toHaveLength(QUESTIONS.length);
    expect(buttons.map((b) => b.textContent)).toEqual(
      QUESTIONS.map((_, i) => String(i + 1)),
    );
  });

  it("keeps the progress gauge at the top of the card", () => {
    renderNavigator({ answers: answered(1, 2, 3) });
    const gauge = screen.getByRole("progressbar", {
      name: "Assessment progress",
    });
    expect(gauge).toHaveAttribute("aria-valuenow", "3");
    expect(gauge).toHaveAttribute(
      "aria-valuetext",
      `3 of ${QUESTIONS.length} statements answered`,
    );
    const nav = screen.getByRole("navigation", { name: "Question navigator" });
    expect(
      gauge.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("9 to go")).toBeInTheDocument();
  });

  it("tells current, answered and unanswered apart without relying on color", () => {
    renderNavigator({ answers: answered(1, 2), currentIndex: 1 });

    expect(cell(1)).toHaveAccessibleName("Question 1, answered");
    expect(cell(1)).toHaveAttribute("data-state", "answered");
    expect(cell(1)).toHaveClass("border-success-strong"); // non-color cue
    expect(cell(1)).not.toHaveAttribute("aria-current");

    expect(cell(2)).toHaveAttribute("aria-current", "step");
    expect(cell(2)).toHaveAttribute("data-state", "answered");

    expect(cell(3)).toHaveAccessibleName("Question 3, not answered");
    expect(cell(3)).toHaveAttribute("data-state", "open");
    expect(cell(3)).not.toHaveClass("border-success-strong");
  });

  it("jumps to any cell, answered ones included", () => {
    const { onJump } = renderNavigator({ answers: answered(4) });
    fireEvent.click(cell(4));
    fireEvent.click(cell(9));
    expect(onJump.mock.calls).toEqual([[3], [8]]);
  });

  it("is one tab stop, with arrows, Home and End moving focus", () => {
    const { onJump } = renderNavigator({ currentIndex: 2 });
    const nav = screen.getByRole("navigation", { name: "Question navigator" });
    const tabbable = within(nav)
      .getAllByRole("button")
      .filter((b) => b.tabIndex === 0);
    expect(tabbable).toEqual([cell(3)]);

    cell(3).focus();
    fireEvent.keyDown(cell(3), { key: "ArrowRight" });
    expect(cell(4)).toHaveFocus();
    fireEvent.keyDown(cell(4), { key: "ArrowLeft" });
    expect(cell(3)).toHaveFocus();
    fireEvent.keyDown(cell(3), { key: "End" });
    expect(cell(QUESTIONS.length)).toHaveFocus();
    fireEvent.keyDown(cell(QUESTIONS.length), { key: "Home" });
    expect(cell(1)).toHaveFocus();
    // Moving focus alone never changes the statement.
    expect(onJump).not.toHaveBeenCalled();
  });

  it("explains which statements are open after a failed finish", () => {
    renderNavigator({
      answers: answered(...QUESTIONS.map((_, i) => i + 1).filter((n) => n !== 3 && n !== 7)),
      flagOpen: true,
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Answer every statement to finish. Still open: 3 and 7.",
    );
    expect(cell(3)).toHaveAccessibleName("Question 3, not answered");
    expect(cell(3)).toHaveAttribute("data-state", "open");
    expect(screen.queryByText(/needs an answer/i)).toBeNull();
  });

  it("names only the first gap when many are open", () => {
    renderNavigator({ answers: answered(1), flagOpen: true });
    expect(screen.getByRole("status")).toHaveTextContent(
      "11 are still open, starting with number 2.",
    );
  });

  it("keeps the status region empty until a finish attempt fails", () => {
    renderNavigator({ answers: answered(1) });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("offers Finish whatever the state, and reports the click", () => {
    const { onFinish } = renderNavigator();
    fireEvent.click(screen.getByRole("button", { name: "Finish assessment" }));
    expect(onFinish).toHaveBeenCalledOnce();
  });

  it("disables every control while the quiz is paused", () => {
    const { onJump } = renderNavigator({ disabled: true });
    expect(cell(1)).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Finish assessment" }),
    ).toBeDisabled();
    fireEvent.click(cell(5));
    expect(onJump).not.toHaveBeenCalled();
  });

  it("folds the grid behind a toggle on small screens", () => {
    renderNavigator();
    const toggle = screen.getByRole("button", { name: "All questions" });
    const region = document.getElementById(
      toggle.getAttribute("aria-controls") ?? "",
    );
    expect(region).toContainElement(
      screen.getByRole("navigation", { name: "Question navigator" }),
    );
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(region).toHaveClass("hidden", "lg:flex");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(region).toHaveClass("flex");
    expect(region).not.toHaveClass("hidden");

    // Choosing a statement folds it away again so the question is in view.
    fireEvent.click(cell(2));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
