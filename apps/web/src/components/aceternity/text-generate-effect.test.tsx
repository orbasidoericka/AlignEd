import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const reduced = vi.hoisted(() => ({ value: false }));
const animateSpy = vi.hoisted(() =>
  vi.fn<(...args: unknown[]) => { stop: () => void }>(() => ({
    stop: vi.fn(),
  })),
);

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useReducedMotion: () => reduced.value,
    useAnimate: () => [{ current: null }, animateSpy],
  };
});

import { staggerStep, TextGenerateEffect } from "./text-generate-effect";

const TEXT = "Answer 42 quick statements, then see your code.";

describe("staggerStep", () => {
  it("keeps the source's 0.2s a word when no budget is given", () => {
    expect(staggerStep(25, 0.5)).toBe(0.2);
  });

  it("finishes the last word exactly at the budget", () => {
    const words = 25;
    const duration = 0.5;
    const step = staggerStep(words, duration, 1.8);
    expect((words - 1) * step + duration).toBeCloseTo(1.8, 10);
  });

  it("stays inside the budget however long the sentence gets", () => {
    for (const words of [2, 10, 25, 80]) {
      const step = staggerStep(words, 0.5, 1.8);
      expect((words - 1) * step + 0.5).toBeLessThanOrEqual(1.8 + 1e-9);
    }
  });

  it("never goes negative when the budget is shorter than one word", () => {
    expect(staggerStep(10, 0.5, 0.2)).toBe(0);
  });

  it("has no gap to space for a single word", () => {
    expect(staggerStep(1, 0.5, 1.8)).toBe(0);
  });
});

describe("TextGenerateEffect", () => {
  afterEach(() => {
    reduced.value = false;
    animateSpy.mockClear();
  });

  // Opacity-0 text is still in the accessibility tree and still real text.
  it("renders the whole sentence as real text", () => {
    const { container } = render(<TextGenerateEffect words={TEXT} />);
    expect(container.textContent?.trim()).toBe(TEXT);
  });

  it("renders a paragraph, so it can stand in for one", () => {
    const { container } = render(<TextGenerateEffect words={TEXT} />);
    expect(container.firstElementChild?.tagName).toBe("P");
  });

  it("lets the caller override the default type utilities", () => {
    const { container } = render(
      <TextGenerateEffect words={TEXT} className="text-lg font-normal" />,
    );
    const cls = container.firstElementChild?.className ?? "";
    expect(cls).toContain("text-lg");
    expect(cls).not.toContain("text-2xl");
    expect(cls).toContain("font-normal");
    expect(cls).not.toContain("font-bold");
  });

  it("animates every word span to fully visible", () => {
    render(<TextGenerateEffect words={TEXT} totalDuration={1.8} />);
    expect(animateSpy).toHaveBeenCalledTimes(1);
    const [selector, target, options] = animateSpy.mock.calls[0] as [
      string,
      { opacity: number },
      { duration: number },
    ];
    expect(selector).toBe("span");
    expect(target.opacity).toBe(1);
    expect(options.duration).toBe(0.5);
  });

  it("shows every word at once under reduced motion", () => {
    reduced.value = true;
    render(<TextGenerateEffect words={TEXT} totalDuration={1.8} />);
    const options = animateSpy.mock.calls[0]?.[2] as {
      duration: number;
      delay?: unknown;
    };
    expect(options.duration).toBe(0);
    expect(options.delay).toBeUndefined();
  });
});
