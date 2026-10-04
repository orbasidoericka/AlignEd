// Copyright (c) 2026 EdTech. All rights reserved.

import { describe, expect, it } from "vitest";

import { QUESTIONS } from "./questions";
import {
  computeHollandCode,
  formatHollandCode,
  maxScorePerTrait,
  TRAIT_META,
  TRAIT_ORDER,
} from "./scoring";
import type { RiasecScores } from "@/store/useAssessmentStore";

function scores(partial: Partial<RiasecScores>): RiasecScores {
  return {
    realistic: 0,
    investigative: 0,
    artistic: 0,
    social: 0,
    enterprising: 0,
    conventional: 0,
    ...partial,
  };
}

describe("computeHollandCode", () => {
  it("returns the three highest-scoring traits in descending order", () => {
    const code = computeHollandCode(
      scores({ investigative: 15, social: 12, artistic: 9, realistic: 3 }),
    );
    expect(code).toEqual(["I", "S", "A"]);
  });

  it("breaks ties by fixed R→I→A→S→E→C order", () => {
    const code = computeHollandCode(
      scores({ social: 10, enterprising: 10, conventional: 10, artistic: 10 }),
    );
    expect(code).toEqual(["A", "S", "E"]);
  });

  // A student who answers "no" to all 42 items lands here: every trait 0.
  it("resolves a flat profile to R-I-A (PRD E2)", () => {
    expect(computeHollandCode(scores({}))).toEqual(["R", "I", "A"]);
  });

  it("handles a maxed-out trait at the binary ceiling", () => {
    const code = computeHollandCode(
      scores({ realistic: 7, conventional: 6, social: 5, artistic: 5 }),
    );
    expect(code).toEqual(["R", "C", "A"]);
  });

  it("is deterministic: same scores always yield the same code", () => {
    const input = scores({ realistic: 8, investigative: 8, conventional: 8 });
    expect(computeHollandCode(input)).toEqual(computeHollandCode(input));
  });

  it("breaks an R/E tie in canonical order, yielding RES", () => {
    const code = computeHollandCode(
      scores({
        realistic: 7,
        investigative: 4,
        artistic: 3,
        social: 6,
        enterprising: 7,
        conventional: 2,
      }),
    );
    expect(code).toEqual(["R", "E", "S"]);
  });

  it("breaks an adjacent tie, yielding IAS", () => {
    const code = computeHollandCode(
      scores({
        realistic: 5,
        investigative: 8,
        artistic: 8,
        social: 6,
        enterprising: 4,
        conventional: 3,
      }),
    );
    expect(code).toEqual(["I", "A", "S"]);
  });

  it("breaks two separate ties spanning the top three, yielding RIA", () => {
    const code = computeHollandCode(
      scores({
        realistic: 9,
        investigative: 9,
        artistic: 7,
        social: 7,
        enterprising: 6,
        conventional: 6,
      }),
    );
    expect(code).toEqual(["R", "I", "A"]);
  });

  it("breaks a tie across the third-place boundary by canonical order", () => {
    // A, S, E, C all tie at 4 for the third slot; A wins on R→I→A→S→E→C.
    const code = computeHollandCode(
      scores({
        realistic: 9,
        investigative: 8,
        artistic: 4,
        social: 4,
        enterprising: 4,
        conventional: 4,
      }),
    );
    expect(code).toEqual(["R", "I", "A"]);
  });

  it("ignores object insertion order", () => {
    const base: RiasecScores = {
      realistic: 7,
      investigative: 4,
      artistic: 3,
      social: 6,
      enterprising: 7,
      conventional: 2,
    };
    const reordered: RiasecScores = {
      conventional: 2,
      enterprising: 7,
      social: 6,
      artistic: 3,
      investigative: 4,
      realistic: 7,
    };
    expect(computeHollandCode(reordered)).toEqual(computeHollandCode(base));
    expect(computeHollandCode(reordered)).toEqual(["R", "E", "S"]);
  });

  it("returns exactly three letters", () => {
    expect(computeHollandCode(scores({}))).toHaveLength(3);
  });
});

describe("formatHollandCode", () => {
  it("joins letters with hyphens", () => {
    expect(formatHollandCode(["I", "S", "A"])).toBe("I-S-A");
  });
});

describe("trait metadata", () => {
  it("maps each trait to a unique letter", () => {
    const letters = TRAIT_ORDER.map((trait) => TRAIT_META[trait].letter);
    expect(new Set(letters).size).toBe(6);
    expect(letters).toEqual(["R", "I", "A", "S", "E", "C"]);
  });
});

describe("maxScorePerTrait", () => {
  it("computes the ceiling for the bank (7 binary items per trait)", () => {
    expect(maxScorePerTrait(QUESTIONS)).toBe(7);
  });
});

describe("question bank", () => {
  it("holds the 42 statements of the printed instrument", () => {
    expect(QUESTIONS).toHaveLength(42);
  });

  it("is balanced with the same number of items per trait", () => {
    const counts = new Map<string, number>();
    for (const q of QUESTIONS) {
      counts.set(q.trait, (counts.get(q.trait) ?? 0) + 1);
    }
    expect([...counts.values()]).toEqual([7, 7, 7, 7, 7, 7]);
  });

  it("has unique question ids", () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });
});
