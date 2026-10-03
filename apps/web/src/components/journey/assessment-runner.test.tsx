import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RAPID_ANSWER_THRESHOLD_MS } from "@/hooks/use-rapid-answer-guard";
import { QUESTIONS } from "@/lib/riasec/questions";
import { useAssessmentStore } from "@/store/useAssessmentStore";

import {
  ADVANCE_DELAY_MS,
  AssessmentRunner,
  INPUT_GUARD_MS,
} from "./assessment-runner";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

// The manager itself is covered in lib/sound; here we only care which sound
// each interaction asks for.
const playSound = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sound/sound-manager", () => ({ playSound }));

function answerFirst(count: number, value = 1) {
  const { setAnswer } = useAssessmentStore.getState();
  for (const question of QUESTIONS.slice(0, count)) {
    setAnswer(question.id, { trait: question.trait, value });
  }
}

// Navigator cell for statement number n (1-based, as shown on screen).
const cell = (n: number) =>
  screen.getByRole("button", { name: new RegExp(`^Question ${n},`) });

const statement = (i: number) =>
  screen.getByRole("heading", { level: 1, name: QUESTIONS[i]!.text });

// Let the input guard lapse, then let the auto-advance fire.
function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

// jsdom never finishes the exit slide, so the previous statement can linger;
// always target the group named by the current statement.
function radio(questionIndex: number, name: RegExp) {
  const group = screen.getByRole("radiogroup", {
    name: QUESTIONS[questionIndex]!.text,
  });
  const match = Array.from(group.querySelectorAll("[role='radio']")).find(
    (el) => name.test(el.textContent ?? ""),
  );
  if (!match) throw new Error(`radio ${name} not found`);
  return match as HTMLElement;
}

describe("AssessmentRunner hardening", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "performance", "queueMicrotask"],
    });
    useAssessmentStore.getState().reset();
    // Pin the printed order so index-based assertions are deterministic;
    // the shuffle itself is covered in the store's own tests.
    useAssessmentStore.setState({ questionOrder: QUESTIONS.map((q) => q.id) });
    playSound.mockClear();
    push.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("names the answer group with the statement", () => {
    render(<AssessmentRunner />);
    expect(
      screen.getByRole("radiogroup", { name: QUESTIONS[0]!.text }),
    ).toBeInTheDocument();
  });

  it("lets a revisited statement move forward by re-tapping or Next", () => {
    answerFirst(3);
    render(<AssessmentRunner />);
    expect(statement(3)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(statement(2)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/ })).toBeInTheDocument();

    // Re-tapping the answer already given advances.
    wait(INPUT_GUARD_MS + 10);
    fireEvent.click(radio(2, /Yes/));
    wait(ADVANCE_DELAY_MS + 10);
    expect(statement(3)).toBeInTheDocument();

    // Next works too.
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(statement(3)).toBeInTheDocument();
  });

  it("opens on the finish view when every statement is already answered", () => {
    answerFirst(QUESTIONS.length);
    render(<AssessmentRunner />);
    expect(
      screen.getByRole("heading", { level: 1, name: "All done!" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Review my answers/ }));
    expect(statement(QUESTIONS.length - 1)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finish assessment" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "All done!" }),
    ).toBeInTheDocument();
  });

  it("ignores taps that land right after a statement appears", () => {
    render(<AssessmentRunner />);
    fireEvent.click(radio(0, /Yes/));
    expect(useAssessmentStore.getState().answers[QUESTIONS[0]!.id]).toBeUndefined();

    // Clear of both the input guard and the rapid-answer threshold.
    wait(RAPID_ANSWER_THRESHOLD_MS + 10);
    fireEvent.click(radio(0, /Yes/));
    expect(useAssessmentStore.getState().answers[QUESTIONS[0]!.id]?.value).toBe(1);
  });

  it("answers with the Y and N keys", () => {
    render(<AssessmentRunner />);
    wait(RAPID_ANSWER_THRESHOLD_MS + 10);
    fireEvent.keyDown(document, { key: "n" });
    expect(useAssessmentStore.getState().answers[QUESTIONS[0]!.id]?.value).toBe(0);
    wait(ADVANCE_DELAY_MS + 10);
    expect(statement(1)).toBeInTheDocument();
  });

  it("clears the answer and blocks advancing on every rapid-answer warning", () => {
    render(<AssessmentRunner />);

    // Strike 1 on Q0: warn only, but still clears the rushed answer and
    // holds the student here instead of letting it carry to Q1.
    wait(INPUT_GUARD_MS + 10);
    fireEvent.keyDown(document, { key: "y" });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(useAssessmentStore.getState().answers[QUESTIONS[0]!.id]).toBeUndefined();
    wait(ADVANCE_DELAY_MS + 10);
    expect(statement(0)).toBeInTheDocument();

    // The rapid-answer guard only measures once per statement view, so this
    // deliberate re-answer is recorded as a normal, non-rapid answer.
    fireEvent.keyDown(document, { key: "y" });
    wait(ADVANCE_DELAY_MS + 10);
    expect(statement(1)).toBeInTheDocument();

    // Strike 2 on Q1: same treatment as strike 1.
    wait(INPUT_GUARD_MS + 10);
    fireEvent.keyDown(document, { key: "y" });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(useAssessmentStore.getState().answers[QUESTIONS[1]!.id]).toBeUndefined();
    wait(ADVANCE_DELAY_MS + 10);
    expect(statement(1)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "y" });
    wait(ADVANCE_DELAY_MS + 10);
    expect(statement(2)).toBeInTheDocument();

    // Strike 3 on Q2: the final warning blocks and clears exactly the same.
    wait(INPUT_GUARD_MS + 10);
    fireEvent.keyDown(document, { key: "y" });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    wait(ADVANCE_DELAY_MS * 4);
    // The open modal hides the page from the accessibility tree, so query by
    // text. No advance happens: still the statement that triggered the block.
    expect(screen.getByText(QUESTIONS[2]!.text)).toBeInTheDocument();
    expect(useAssessmentStore.getState().answers[QUESTIONS[2]!.id]).toBeUndefined();
    expect(useAssessmentStore.getState().currentStep).toBe(2);
  });

  it("requires re-answering the cleared statement after the final warning is acknowledged", () => {
    render(<AssessmentRunner />);

    // Reach Q2 via two warn-clear-reanswer cycles (strikes 1 and 2).
    for (let i = 0; i < 2; i++) {
      wait(INPUT_GUARD_MS + 10);
      fireEvent.keyDown(document, { key: "y" });
      wait(ADVANCE_DELAY_MS + 10);
      fireEvent.keyDown(document, { key: "y" });
      wait(ADVANCE_DELAY_MS + 10);
    }
    expect(statement(2)).toBeInTheDocument();

    wait(INPUT_GUARD_MS + 10);
    fireEvent.keyDown(document, { key: "y" }); // strike 3: block

    fireEvent.click(screen.getByRole("button", { name: /Answer Carefully/ }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(statement(2)).toBeInTheDocument();
    expect(useAssessmentStore.getState().answers[QUESTIONS[2]!.id]).toBeUndefined();

    // Answering well clear of the rapid-answer threshold this time.
    wait(RAPID_ANSWER_THRESHOLD_MS + 10);
    fireEvent.keyDown(document, { key: "y" });
    expect(useAssessmentStore.getState().answers[QUESTIONS[2]!.id]?.value).toBe(1);
    wait(ADVANCE_DELAY_MS + 10);
    expect(statement(3)).toBeInTheDocument();
  });

  it("sounds the answer that was chosen, and stays silent when guarded", () => {
    render(<AssessmentRunner />);

    // Inside the input guard nothing is recorded, so nothing should sound.
    fireEvent.click(radio(0, /Yes/));
    expect(playSound).not.toHaveBeenCalled();

    wait(INPUT_GUARD_MS + 10);
    fireEvent.click(radio(0, /Yes/));
    expect(playSound).toHaveBeenCalledExactlyOnceWith("yes");

    playSound.mockClear();
    wait(ADVANCE_DELAY_MS + 10);
    wait(INPUT_GUARD_MS + 10);
    fireEvent.keyDown(document, { key: "n" });
    expect(playSound).toHaveBeenCalledExactlyOnceWith("no");
  });

  it("celebrates when Finish assessment is clicked, once", () => {
    answerFirst(QUESTIONS.length - 1);
    render(<AssessmentRunner />);

    wait(RAPID_ANSWER_THRESHOLD_MS + 10);
    fireEvent.keyDown(document, { key: "y" });
    expect(playSound).toHaveBeenCalledWith("yes");

    // Answering the last statement does not auto-finish.
    wait(ADVANCE_DELAY_MS + 10);
    expect(screen.queryByText("All done!")).toBeNull();
    expect(playSound).not.toHaveBeenCalledWith("celebration");

    // Finishing via the navigator triggers the celebration.
    fireEvent.click(screen.getByRole("button", { name: "Finish assessment" }));
    expect(screen.getByText("All done!")).toBeInTheDocument();
    expect(playSound.mock.calls.filter(([n]) => n === "celebration")).toHaveLength(1);

    // Review then re-finish: no second celebration.
    playSound.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /Review my answers/ }));
    fireEvent.click(screen.getByRole("button", { name: "Finish assessment" }));
    expect(screen.getByText("All done!")).toBeInTheDocument();
    expect(playSound).not.toHaveBeenCalledWith("celebration");
  });

  it("stays silent when a finished quiz is merely reopened", () => {
    answerFirst(QUESTIONS.length);
    render(<AssessmentRunner />);

    expect(screen.getByText("All done!")).toBeInTheDocument();
    expect(playSound).not.toHaveBeenCalled();
  });
});

describe("AssessmentRunner question navigator", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "performance", "queueMicrotask"],
    });
    useAssessmentStore.getState().reset();
    // Pin the printed order so index-based assertions are deterministic;
    // the shuffle itself is covered in the store's own tests.
    useAssessmentStore.setState({ questionOrder: QUESTIONS.map((q) => q.id) });
    playSound.mockClear();
    push.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Every statement answered except the given 0-based indexes.
  function answerAllExcept(...open: number[]) {
    const { setAnswer } = useAssessmentStore.getState();
    QUESTIONS.forEach((question, i) => {
      if (!open.includes(i)) {
        setAnswer(question.id, { trait: question.trait, value: 1 });
      }
    });
  }

  it("lists every statement and jumps straight to the one chosen", () => {
    render(<AssessmentRunner />);
    const nav = screen.getByRole("navigation", { name: "Question navigator" });
    expect(nav.querySelectorAll("button")).toHaveLength(QUESTIONS.length);
    expect(cell(1)).toHaveAttribute("aria-current", "step");

    fireEvent.click(cell(10));
    expect(statement(9)).toBeInTheDocument();
    expect(cell(10)).toHaveAttribute("aria-current", "step");
    expect(cell(1)).not.toHaveAttribute("aria-current");
    expect(screen.getByText(`Question 10 of ${QUESTIONS.length}`)).toBeInTheDocument();
  });

  it("keeps every answer while jumping between statements", () => {
    answerFirst(3);
    render(<AssessmentRunner />);
    expect(statement(3)).toBeInTheDocument();

    fireEvent.click(cell(2));
    expect(statement(1)).toBeInTheDocument();
    expect(radio(1, /Yes/)).toHaveAttribute("aria-checked", "true");

    fireEvent.click(cell(30));
    expect(statement(29)).toBeInTheDocument();
    fireEvent.click(cell(1));
    expect(radio(0, /Yes/)).toHaveAttribute("aria-checked", "true");

    expect(Object.keys(useAssessmentStore.getState().answers)).toHaveLength(3);
    for (const n of [1, 2, 3]) {
      expect(cell(n)).toHaveAccessibleName(`Question ${n}, answered`);
    }
  });

  it("marks a statement answered the moment its answer is chosen", () => {
    render(<AssessmentRunner />);
    expect(cell(1)).toHaveAccessibleName("Question 1, not answered");
    expect(cell(1)).toHaveAttribute("data-state", "open");

    wait(RAPID_ANSWER_THRESHOLD_MS + 10);
    fireEvent.keyDown(document, { key: "y" });
    expect(cell(1)).toHaveAccessibleName("Question 1, answered");
    expect(cell(1)).toHaveAttribute("data-state", "answered");
    // Still current until the advance lands.
    expect(cell(1)).toHaveAttribute("aria-current", "step");
    expect(cell(2)).toHaveAccessibleName("Question 2, not answered");

    wait(ADVANCE_DELAY_MS + 10);
    expect(cell(2)).toHaveAttribute("aria-current", "step");
    expect(cell(1)).toHaveAttribute("data-state", "answered");
  });

  it("refuses to finish with gaps, explains, and goes to the first one", () => {
    answerAllExcept(4, 11);
    render(<AssessmentRunner />);
    fireEvent.click(cell(QUESTIONS.length));
    expect(statement(QUESTIONS.length - 1)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Finish assessment" }));

    expect(screen.queryByText("All done!")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Answer every statement to finish. Still open: 5 and 12.",
    );
    expect(statement(4)).toBeInTheDocument();
    expect(statement(4)).toHaveFocus();
    expect(cell(5)).toHaveAccessibleName("Question 5, not answered");
    expect(cell(12)).toHaveAccessibleName("Question 12, not answered");
    expect(cell(1)).toHaveAccessibleName("Question 1, answered");
    // Nothing already answered was touched.
    expect(Object.keys(useAssessmentStore.getState().answers)).toHaveLength(
      QUESTIONS.length - 2,
    );
  });

  it("finishes only once every gap is answered, and submits once", () => {
    answerAllExcept(4, 11);
    render(<AssessmentRunner />);
    fireEvent.click(screen.getByRole("button", { name: "Finish assessment" }));
    expect(statement(4)).toBeInTheDocument();

    // A fresh answer skips the statements that already have one.
    wait(RAPID_ANSWER_THRESHOLD_MS + 10);
    fireEvent.keyDown(document, { key: "y" });
    wait(ADVANCE_DELAY_MS + 10);
    expect(statement(11)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Still open: 12.");

    wait(RAPID_ANSWER_THRESHOLD_MS + 10);
    fireEvent.keyDown(document, { key: "n" });
    wait(ADVANCE_DELAY_MS + 10);
    // Answering the last gap does not auto-finish; review notice appears.
    expect(screen.queryByText("All done!")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Finish assessment" }));
    expect(screen.getByText("All done!")).toBeInTheDocument();

    const results = screen.getByRole("button", { name: "See my results" });
    fireEvent.click(results);
    fireEvent.click(results);
    expect(push).toHaveBeenCalledExactlyOnceWith("/results");
    expect(results).toBeDisabled();
  });

  it("disables the navigator while the rapid-answer pause is open", () => {
    render(<AssessmentRunner />);
    for (let i = 0; i < 2; i++) {
      wait(INPUT_GUARD_MS + 10);
      fireEvent.keyDown(document, { key: "y" });
      wait(ADVANCE_DELAY_MS + 10);
      fireEvent.keyDown(document, { key: "y" });
      wait(ADVANCE_DELAY_MS + 10);
    }
    wait(INPUT_GUARD_MS + 10);
    fireEvent.keyDown(document, { key: "y" }); // strike 3: block
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    // The modal hides the page from the accessibility tree.
    const nav = screen.getByRole("navigation", {
      name: "Question navigator",
      hidden: true,
    });
    for (const button of nav.querySelectorAll("button")) {
      expect(button).toBeDisabled();
    }
  });
});
