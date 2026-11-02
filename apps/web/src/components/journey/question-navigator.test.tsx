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
  render(
    <QuestionNavigator
      questions={QUESTIONS}
      answers={{}}
      currentIndex={0}
      flagOpen={false}
      onJump={onJump}
      {...props}
    />,
  );
  return { onJump };
}

const cell = (n: number) =>
  screen.getByRole("button", { name: new RegExp(`^Question ${n},`) });

describe("QuestionNavigator", () => {
  it("hosts the language pill and reports changes", () => {
    const onLanguageChange = vi.fn();
    renderNavigator({ language: "en", onLanguageChange });
    const region = screen.getByRole("region", {
      name: "Assessment progress and questions",
    });
    const group = within(region).getByRole("group", {
      name: "Statement language",
    });
    expect(within(group).getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(within(group).getByRole("button", { name: "Filipino" }));
    expect(onLanguageChange).toHaveBeenCalledWith("fil");
  });

  it("omits the language pill when no language props are given", () => {
    renderNavigator();
    expect(
      screen.queryByRole("group", { name: "Statement language" }),
    ).not.toBeInTheDocument();
  });

  it("renders one numbered cell per statement, in order", () => {
    renderNavigator();
    const nav = screen.getByRole("navigation", { name: "Question navigator" });
    const buttons = within(nav).getAllByRole("button");
    expect(buttons).toHaveLength(QUESTIONS.length);
    expect(buttons.map((b) => b.textContent)).toEqual(
      QUESTIONS.map((_, i) => String(i + 1)),
    );
  });

  it("shows count, percent and a progress bar above the grid", () => {
    renderNavigator({ answers: answered(1, 2, 3), currentIndex: 2 });
    const bar = screen.getByRole("progressbar", {
      name: "Assessment progress",
    });
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).toHaveAttribute(
      "aria-valuetext",
      `3 of ${QUESTIONS.length} statements answered`,
    );
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(
      screen.getByText(`Question 3 of ${QUESTIONS.length}`),
    ).toBeInTheDocument();
    expect(screen.getByText("9 to go")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Question navigator" });
    expect(
      bar.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("never lowers progress when the student goes back", () => {
    const { rerender } = render(
      <QuestionNavigator
        questions={QUESTIONS}
        answers={answered(1, 2, 3, 4)}
        currentIndex={3}
        flagOpen={false}
        onJump={vi.fn()}
      />,
    );
    rerender(
      <QuestionNavigator
        questions={QUESTIONS}
        answers={answered(1, 2, 3, 4)}
        currentIndex={0}
        flagOpen={false}
        onJump={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("progressbar", { name: "Assessment progress" }),
    ).toHaveAttribute("aria-valuenow", "4");
  });

  it("cuts the bar into chunks of seven with decorative notches", () => {
    const questions = Array.from({ length: 42 }, (_, i) => ({ id: `q${i + 1}` }));
    renderNavigator({ questions, answers: answered(...Array.from({ length: 14 }, (_, i) => i + 1)) });
    const notches = Array.from(
      document.querySelectorAll<HTMLElement>("[data-milestone]"),
    );
    expect(notches.map((n) => n.dataset.milestone)).toEqual([
      "7",
      "14",
      "21",
      "28",
      "35",
    ]);
    expect(notches.every((n) => n.getAttribute("aria-hidden") === "true")).toBe(
      true,
    );
    expect(notches.map((n) => n.hasAttribute("data-passed"))).toEqual([
      true,
      true,
      false,
      false,
      false,
    ]);
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

  it("leaves Finish to the runner", () => {
    renderNavigator({
      answers: answered(...QUESTIONS.map((_, i) => i + 1)),
    });
    expect(
      screen.queryByRole("button", { name: "Finish assessment" }),
    ).toBeNull();
  });

  it("disables every control while the quiz is paused", () => {
    const { onJump } = renderNavigator({ disabled: true });
    expect(cell(1)).toBeDisabled();
    fireEvent.click(cell(5));
    expect(onJump).not.toHaveBeenCalled();
  });

  it("folds the grid behind a toggle, closed by default at every width", () => {
    renderNavigator();
    const toggle = screen.getByRole("button", { name: "All questions" });
    const region = document.getElementById(
      toggle.getAttribute("aria-controls") ?? "",
    );
    expect(region).toContainElement(
      screen.getByRole("navigation", { name: "Question navigator" }),
    );
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(region).toHaveClass("hidden");
    expect(region).not.toHaveClass("lg:flex");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(region).toHaveClass("flex");
    expect(region).not.toHaveClass("hidden");

    // Choosing a statement folds it away again so the question is in view.
    fireEvent.click(cell(2));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the grid when a finish attempt leaves statements open", () => {
    renderNavigator({ answers: answered(1), flagOpen: true });
    expect(screen.getByRole("button", { name: "All questions" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("disables the toggle while the quiz is paused", () => {
    renderNavigator({ disabled: true });
    expect(screen.getByRole("button", { name: "All questions" })).toBeDisabled();
  });
});
