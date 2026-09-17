import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  evaluateRapidAnswer,
  RAPID_ANSWER_THRESHOLD_MS,
  useRapidAnswerGuard,
} from "./use-rapid-answer-guard";

describe("evaluateRapidAnswer", () => {
  it("ignores answers at or above the threshold", () => {
    expect(evaluateRapidAnswer(1, RAPID_ANSWER_THRESHOLD_MS)).toEqual({
      count: 1,
      event: "none",
    });
  });

  it("warns on strikes one and two, blocks on three", () => {
    expect(evaluateRapidAnswer(0, 500).event).toBe("warn");
    expect(evaluateRapidAnswer(1, 500).event).toBe("warn");
    expect(evaluateRapidAnswer(2, 500)).toEqual({ count: 3, event: "block" });
  });
});

// Controllable clock, stable across renders as the hook requires.
function createClock() {
  let time = 0;
  return {
    now: () => time,
    advance: (ms: number) => {
      time += ms;
    },
  };
}

function setup() {
  const clock = createClock();
  const hook = renderHook(
    ({ questionKey }) => useRapidAnswerGuard({ questionKey, now: clock.now }),
    { initialProps: { questionKey: "q1" } },
  );
  // Show the next statement, then wait `ms` before answering it.
  const answerAfter = (key: string, ms: number, isRevision = false) => {
    hook.rerender({ questionKey: key });
    clock.advance(ms);
    let event = "none";
    act(() => {
      event = hook.result.current.recordAnswer({ isRevision });
    });
    return event;
  };
  return { clock, hook, answerAfter };
}

describe("useRapidAnswerGuard", () => {
  it("counts rapid answers and blocks on the third", () => {
    const { hook, answerAfter } = setup();

    expect(answerAfter("q1", 800)).toBe("warn");
    expect(hook.result.current.rapidAnswerCount).toBe(1);
    expect(answerAfter("q2", 3000)).toBe("none");
    expect(answerAfter("q3", 1200)).toBe("warn");
    expect(answerAfter("q4", 400)).toBe("block");
    expect(hook.result.current.rapidAnswerCount).toBe(3);
    expect(hook.result.current.isBlocked).toBe(true);
  });

  it("measures from when the statement appears, not from mount", () => {
    const { clock, hook, answerAfter } = setup();
    clock.advance(10_000);
    expect(answerAfter("q2", 500)).toBe("warn");
    expect(hook.result.current.rapidAnswerCount).toBe(1);
  });

  it("never counts revisions or a second tap on the same statement", () => {
    const { hook, answerAfter } = setup();
    expect(answerAfter("q1", 300, true)).toBe("none");

    expect(answerAfter("q2", 300)).toBe("warn");
    let second = "none";
    act(() => {
      second = hook.result.current.recordAnswer();
    });
    expect(second).toBe("none");
    expect(hook.result.current.rapidAnswerCount).toBe(1);
  });

  it("ignores answers while blocked and resets on acknowledge", () => {
    const { clock, hook, answerAfter } = setup();
    answerAfter("q1", 100);
    answerAfter("q2", 100);
    answerAfter("q3", 100);
    expect(answerAfter("q4", 100)).toBe("none");
    expect(hook.result.current.rapidAnswerCount).toBe(3);

    act(() => hook.result.current.acknowledge());
    expect(hook.result.current.isBlocked).toBe(false);
    expect(hook.result.current.rapidAnswerCount).toBe(0);

    // Timer restarts at acknowledge: a slow read of the same statement is fine.
    clock.advance(2500);
    let event = "none";
    act(() => {
      event = hook.result.current.recordAnswer();
    });
    expect(event).toBe("none");
  });
});
