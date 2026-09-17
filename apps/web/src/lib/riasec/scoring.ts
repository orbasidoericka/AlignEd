// Copyright (c) 2026 EdTech. All rights reserved.

import type { RiasecQuestion } from "./questions";
import type { RiasecLetter, RiasecTrait } from "./types";
import type { RiasecScores } from "@/store/useAssessmentStore";

// Fixed trait order doubles as the deterministic tie-breaker (PRD FR-4.2).
export const TRAIT_ORDER: readonly RiasecTrait[] = [
  "realistic",
  "investigative",
  "artistic",
  "social",
  "enterprising",
  "conventional",
];

// Short friendly labels. Descriptions of each letter come from the official
// sheet in career-pathways.ts.
export interface TraitMeta {
  letter: RiasecLetter;
  label: string;
}

export const TRAIT_META: Record<RiasecTrait, TraitMeta> = {
  realistic: { letter: "R", label: "The Builder" },
  investigative: { letter: "I", label: "The Thinker" },
  artistic: { letter: "A", label: "The Creator" },
  social: { letter: "S", label: "The Helper" },
  enterprising: { letter: "E", label: "The Mover" },
  conventional: { letter: "C", label: "The Organizer" },
};

export type HollandCode = readonly [RiasecLetter, RiasecLetter, RiasecLetter];

// Top three traits by score, ties broken by TRAIT_ORDER (R→I→A→S→E→C), so the
// same answer set always yields the same code (PRD FR-4.1, FR-4.2).
export function computeHollandCode(scores: RiasecScores): HollandCode {
  const ranked = [...TRAIT_ORDER].sort((a, b) => {
    const diff = scores[b] - scores[a];
    if (diff !== 0) return diff;
    return TRAIT_ORDER.indexOf(a) - TRAIT_ORDER.indexOf(b);
  });
  const [first, second, third] = ranked;
  if (!first || !second || !third) {
    throw new Error("TRAIT_ORDER must contain all six traits");
  }
  return [
    TRAIT_META[first].letter,
    TRAIT_META[second].letter,
    TRAIT_META[third].letter,
  ];
}

export function formatHollandCode(code: readonly RiasecLetter[]): string {
  return code.join("-");
}

export function traitForLetter(letter: RiasecLetter): RiasecTrait {
  const trait = TRAIT_ORDER.find((t) => TRAIT_META[t].letter === letter);
  if (!trait) throw new Error(`Unknown RIASEC letter: ${letter}`);
  return trait;
}

// Highest possible per-trait score for a bank, used to normalize the radar
// chart. Answers are binary, so the ceiling is one point per item.
export function maxScorePerTrait(questions: readonly RiasecQuestion[]): number {
  const counts = new Map<RiasecTrait, number>();
  for (const q of questions) {
    counts.set(q.trait, (counts.get(q.trait) ?? 0) + 1);
  }
  return Math.max(...counts.values(), 0);
}
