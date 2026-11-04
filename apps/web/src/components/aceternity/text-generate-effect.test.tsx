import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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

  // Visible without JavaScript: no word starts hidden in the markup, the
  // fade is a CSS animation behind motion-safe: (reduced motion skips it).
  it("never hides a word in the markup, and fades it only behind motion-safe", () => {
    const { container } = render(<TextGenerateEffect words={TEXT} />);
    const spans = container.querySelectorAll("span");
    expect(spans).toHaveLength(TEXT.split(" ").length);
    for (const span of spans) {
      expect(span.className).toBe("motion-safe:animate-word-in");
      expect(span.getAttribute("style")).not.toMatch(/opacity|blur/);
    }
  });

  it("staggers the words to finish inside the budget", () => {
    const { container } = render(
      <TextGenerateEffect words={TEXT} totalDuration={1.8} />,
    );
    const spans = [...container.querySelectorAll("span")];
    const delays = spans.map((s) =>
      parseInt(s.style.getPropertyValue("--word-delay"), 10),
    );
    expect(delays[0]).toBe(0);
    expect(delays.at(-1)).toBe(1300); // 1.8s budget minus the 0.5s fade
    expect(spans[0]!.style.getPropertyValue("--word-duration")).toBe("500ms");
  });
});
