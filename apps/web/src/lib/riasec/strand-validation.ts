// Copyright (c) 2026 EdTech. All rights reserved.

// Canonical strand-validation module (PRD FR-5). The mapping table and
// verdict thresholds live here and only here; UI never hard-codes them.

import type { GradeLevel, RiasecLetter, Strand } from "./types";

export type StrandVerdict =
  | "aligned"
  | "partially-aligned"
  | "misaligned"
  | "aligned-flexible";

// Strand → Holland letters matrix (PRD FR-5). GAS is exploratory by design
// and maps to no fixed letters (FR-5.3).
export const STRAND_LETTER_MAP: Record<
  Exclude<Strand, "GAS">,
  readonly [RiasecLetter, RiasecLetter]
> = {
  STEM: ["I", "R"],
  ABM: ["E", "C"],
  HUMSS: ["S", "A"],
  TVL: ["R", "C"],
  "Arts & Design": ["A", "R"],
  Sports: ["R", "S"],
};

export interface StrandValidationResult {
  verdict: StrandVerdict;
  sharedLetters: RiasecLetter[];
  strandLetters: readonly RiasecLetter[];
}

// Overlap rule (PRD FR-5): 2 shared letters → aligned, 1 → partially
// aligned, 0 → misaligned. GAS always returns aligned-flexible.
export function validateStrand(
  strand: Strand,
  code: readonly RiasecLetter[],
): StrandValidationResult {
  if (strand === "GAS") {
    return { verdict: "aligned-flexible", sharedLetters: [], strandLetters: [] };
  }
  const strandLetters = STRAND_LETTER_MAP[strand];
  const sharedLetters = strandLetters.filter((letter) => code.includes(letter));
  const verdict: StrandVerdict =
    sharedLetters.length >= 2
      ? "aligned"
      : sharedLetters.length === 1
        ? "partially-aligned"
        : "misaligned";
  return { verdict, sharedLetters, strandLetters };
}

export interface VerdictCopy {
  title: string;
  insight: string;
}

// Insight copy is always constructive (PRD FR-5.2): a misaligned verdict is
// framed as new information, never as a wrong choice, and Grade 11 students
// are reminded the shift window is still open.
export function verdictCopy(
  result: StrandValidationResult,
  gradeLevel: GradeLevel,
): VerdictCopy {
  const shiftNote =
    gradeLevel === "11"
      ? " You are in Grade 11, which means there is still time to shift strands if you decide this new information matters to you."
      : "";

  switch (result.verdict) {
    case "aligned":
      return {
        title: "Aligned",
        insight:
          "Your strand and your interest profile point in the same direction. That is a strong signal: the subjects you are studying now are already building toward paths that fit who you are.",
      };
    case "partially-aligned":
      return {
        title: "Partially Aligned",
        insight:
          "Your strand shares real common ground with your interests, and it also revealed sides of you that reach beyond it. Use that overlap as your anchor, and explore programs that let both sides grow." +
        shiftNote,
      };
    case "misaligned":
      return {
        title: "Misaligned",
        insight:
          "This is not a wrong answer; it is new information. Your measured interests point somewhere different from your current strand, and knowing that now puts you ahead of most students. Look closely at the careers and programs below that match your code." +
          shiftNote,
      };
    case "aligned-flexible":
      return {
        title: "Aligned, Flexible",
        insight:
          "GAS was designed for explorers, and your results now give you the direction it was meant to help you find. Your code below is your compass: use it to choose the college path that fits you best.",
      };
  }
}
