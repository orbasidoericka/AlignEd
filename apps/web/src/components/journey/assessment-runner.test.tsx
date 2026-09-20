import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QUESTIONS } from "@/lib/riasec/questions";
import { useAssessmentStore } from "@/store/useAssessmentStore";

import {
  ADVANCE_DELAY_MS,
  AssessmentRunner,
  INPUT_GUARD_MS,
} from "./assessment-runner";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
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
    playSound.mockClear();
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
    fireEvent.click(screen.getByRole("button", { name: /Finish/ }));
    expect(
      screen.getByRole("heading", { level: 1, name: "All done!" }),
    ).toBeInTheDocument();
  });

  it("ignores taps that land right after a statement appears", () => {
    render(<AssessmentRunner />);
    fireEvent.click(radio(0, /Yes/));
    expect(useAssessmentStore.getState().answers[QUESTIONS[0]!.id]).toBeUndefined();

    wait(INPUT_GUARD_MS + 10);
    fireEvent.click(radio(0, /Yes/));
    expect(useAssessmentStore.getState().answers[QUESTIONS[0]!.id]?.value).toBe(1);
  });

  it("answers with the Y and N keys", () => {
    render(<AssessmentRunner />);
    wait(INPUT_GUARD_MS + 10);
    fireEvent.keyDown(document, { key: "n" });
    expect(useAssessmentStore.getState().answers[QUESTIONS[0]!.id]?.value).toBe(0);
    wait(ADVANCE_DELAY_MS + 10);
    expect(statement(1)).toBeInTheDocument();
  });

  it("stays on the statement when the rapid-answer pause opens", () => {
    render(<AssessmentRunner />);
    // Three answers, each past the input guard but well under 2 seconds.
    for (let i = 0; i < 2; i++) {
      wait(INPUT_GUARD_MS + 10);
      fireEvent.keyDown(document, { key: "y" });
      wait(ADVANCE_DELAY_MS + 10);
    }
    expect(statement(2)).toBeInTheDocument();

    wait(INPUT_GUARD_MS + 10);
    fireEvent.keyDown(document, { key: "y" });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    wait(ADVANCE_DELAY_MS * 4);
    // The modal hides the page from the accessibility tree, so query by text.
    expect(screen.getByText(QUESTIONS[2]!.text)).toBeInTheDocument();
    expect(screen.queryByText(QUESTIONS[3]!.text)).toBeNull();
    expect(useAssessmentStore.getState().answers[QUESTIONS[2]!.id]?.value).toBe(1);
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

  it("celebrates the answer that finishes the quiz, once", () => {
    answerFirst(QUESTIONS.length - 1);
    render(<AssessmentRunner />);

    wait(INPUT_GUARD_MS + 10);
    fireEvent.keyDown(document, { key: "y" });
    expect(playSound).toHaveBeenCalledWith("yes");

    wait(ADVANCE_DELAY_MS + 10);
    expect(screen.getByText("All done!")).toBeInTheDocument();
    expect(playSound.mock.calls.filter(([n]) => n === "celebration")).toHaveLength(1);

    // Review my answers, then Finish: a re-entry, not an achievement.
    playSound.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /Review my answers/ }));
    wait(INPUT_GUARD_MS + 10);
    fireEvent.click(screen.getByRole("button", { name: /Finish/ }));
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
