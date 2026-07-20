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

  it("resolves a flat profile to R-I-A (PRD E2)", () => {
    expect(computeHollandCode(scores({}))).toEqual(["R", "I", "A"]);
  });

  it("is deterministic: same scores always yield the same code", () => {
    const input = scores({ realistic: 8, investigative: 8, conventional: 8 });
    expect(computeHollandCode(input)).toEqual(computeHollandCode(input));
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
  it("computes the ceiling for the mock bank (3 questions × 5 points)", () => {
    expect(maxScorePerTrait(QUESTIONS)).toBe(15);
  });
});

describe("question bank", () => {
  it("is balanced with the same number of items per trait", () => {
    const counts = new Map<string, number>();
    for (const q of QUESTIONS) {
      counts.set(q.trait, (counts.get(q.trait) ?? 0) + 1);
    }
    expect([...counts.values()]).toEqual([3, 3, 3, 3, 3, 3]);
  });

  it("has unique question ids", () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });
});
