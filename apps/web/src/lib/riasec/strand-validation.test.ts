// Copyright (c) 2026 EdTech. All rights reserved.

import { describe, expect, it } from "vitest";

import { STRANDS } from "./types";
import {
  STRAND_LETTER_MAP,
  validateStrand,
  verdictCopy,
} from "./strand-validation";
import type { RiasecLetter } from "./types";

const NON_GAS_STRANDS = STRANDS.filter((s) => s !== "GAS");

// Builds a code guaranteed to share exactly `shared` letters with the strand
// mapping, filling the rest with letters outside the mapping.
function codeSharing(
  strandLetters: readonly RiasecLetter[],
  shared: number,
): RiasecLetter[] {
  const all: RiasecLetter[] = ["R", "I", "A", "S", "E", "C"];
  const outside = all.filter((l) => !strandLetters.includes(l));
  return [...strandLetters.slice(0, shared), ...outside].slice(0, 3);
}

describe("validateStrand verdict matrix (all strands × overlap counts)", () => {
  for (const strand of NON_GAS_STRANDS) {
    const letters = STRAND_LETTER_MAP[strand as keyof typeof STRAND_LETTER_MAP];

    it(`${strand}: 2 shared letters → aligned`, () => {
      const result = validateStrand(strand, codeSharing(letters, 2));
      expect(result.verdict).toBe("aligned");
      expect(result.sharedLetters).toHaveLength(2);
    });

    it(`${strand}: 1 shared letter → partially-aligned`, () => {
      const result = validateStrand(strand, codeSharing(letters, 1));
      expect(result.verdict).toBe("partially-aligned");
      expect(result.sharedLetters).toHaveLength(1);
    });

    it(`${strand}: 0 shared letters → misaligned`, () => {
      const result = validateStrand(strand, codeSharing(letters, 0));
      expect(result.verdict).toBe("misaligned");
      expect(result.sharedLetters).toHaveLength(0);
    });
  }
});

describe("GAS special case (PRD FR-5.3)", () => {
  it("always returns aligned-flexible regardless of code", () => {
    const codes: RiasecLetter[][] = [
      ["R", "I", "A"],
      ["S", "E", "C"],
      ["I", "S", "A"],
    ];
    for (const code of codes) {
      expect(validateStrand("GAS", code).verdict).toBe("aligned-flexible");
    }
  });
});

describe("verdictCopy (PRD FR-5.2)", () => {
  it("misaligned copy is constructive and never blames the student", () => {
    const result = validateStrand("STEM", ["S", "E", "A"]);
    const copy = verdictCopy(result, "12");
    expect(copy.insight).not.toMatch(/chose wrong|wrong choice|mistake/i);
    expect(copy.insight).toMatch(/new information/i);
  });

  it("mentions the shift window for Grade 11 misaligned students", () => {
    const result = validateStrand("STEM", ["S", "E", "A"]);
    expect(verdictCopy(result, "11").insight).toMatch(/shift/i);
    expect(verdictCopy(result, "12").insight).not.toMatch(/shift strands/i);
  });

  it("gives GAS students direction-framing copy", () => {
    const result = validateStrand("GAS", ["R", "I", "A"]);
    const copy = verdictCopy(result, "11");
    expect(copy.title).toMatch(/flexible/i);
    expect(copy.insight).toMatch(/direction|compass/i);
  });
});
