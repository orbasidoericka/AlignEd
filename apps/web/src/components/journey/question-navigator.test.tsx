import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AssessmentAnswer } from "@/store/useAssessmentStore";

import { QuestionGridToggle, QuestionNavigator } from "./question-navigator";

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
      panelId="grid-panel"
      onHide={vi.fn()}
      gridOpen={false}
      {...props}
    />,
  );
  return { onJump };
}

const cell = (n: number) =>
  screen.getByRole("button", { name: new RegExp(`^Question ${n},`) });

describe("QuestionNavigator", () => {
  // The language pill lives in the runner now, above the statement.
  it("does not host the language pill", () => {
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
    // One count and one percent: no step label, no "n to go".
    expect(screen.queryByText(/Step \d of \d/)).toBeNull();
    expect(screen.queryByText(/to go|All answered/)).toBeNull();
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
        panelId="grid-panel"
        onHide={vi.fn()}
        gridOpen={false}
      />,
    );
    rerender(
      <QuestionNavigator
        questions={QUESTIONS}
        answers={answered(1, 2, 3, 4)}
        currentIndex={0}
        flagOpen={false}
        onJump={vi.fn()}
        panelId="grid-panel"
        onHide={vi.fn()}
        gridOpen={false}
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

  // The runner owns show/hide; the panel starts hidden and follows it.
  it("shows the numbers panel only while the runner says it is open", () => {
    const panel = () => screen.getByRole("region", { name: "All questions" });
    const mount = (gridOpen: boolean) =>
      render(
        <QuestionNavigator
          questions={QUESTIONS}
          answers={{}}
          currentIndex={0}
          flagOpen={false}
          onJump={vi.fn()}
          panelId="grid-panel"
          onHide={vi.fn()}
          gridOpen={gridOpen}
        />,
      );

    const closed = mount(false);
    expect(panel()).toHaveAttribute("id", "grid-panel");
    expect(panel()).toHaveClass("hidden");
    expect(panel()).not.toHaveClass("flex");
    expect(panel()).not.toHaveClass("lg:flex"); // hidden at every width
    expect(panel()).toContainElement(
      screen.getByRole("navigation", { name: "Question navigator" }),
    );
    closed.unmount();

    mount(true);
    expect(panel()).toHaveClass("flex");
    expect(panel()).not.toHaveClass("hidden");
  });

  it("carries no toggle of its own: that lives beside the language switch", () => {
    renderNavigator();
    expect(screen.queryByRole("button", { name: "All questions" })).toBeNull();
  });

  // On a phone the open panel sits above the statement, a screen away from the
  // toggle, so it can be closed from inside.
  it("can be hidden from inside the panel", () => {
    const onHide = vi.fn();
    renderNavigator({ onHide });
    const hide = screen.getByRole("button", { name: "Hide question numbers" });
    expect(hide).toHaveAttribute("aria-controls", "grid-panel");
    fireEvent.click(hide);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("disables the Hide button while the quiz is paused", () => {
    renderNavigator({ disabled: true });
    expect(
      screen.getByRole("button", { name: "Hide question numbers" }),
    ).toBeDisabled();
  });
});

describe("QuestionGridToggle", () => {
  it("is an icon-only button named All questions that reports its state", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <QuestionGridToggle open={false} onToggle={onToggle} controls="grid-panel" />,
    );
    const toggle = screen.getByRole("button", { name: "All questions" });
    expect(toggle.textContent).toBe(""); // icon only, no visible text
    expect(toggle).toHaveAttribute("aria-controls", "grid-panel");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(<QuestionGridToggle open onToggle={onToggle} controls="grid-panel" />);
    expect(screen.getByRole("button", { name: "All questions" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("is disabled while the quiz is paused", () => {
    render(
      <QuestionGridToggle open onToggle={vi.fn()} controls="grid-panel" disabled />,
    );
    expect(screen.getByRole("button", { name: "All questions" })).toBeDisabled();
  });
});
