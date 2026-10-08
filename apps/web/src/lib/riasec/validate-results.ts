// Copyright (c) 2026 EdTech. All rights reserved.

import { TRAIT_META, TRAIT_ORDER } from "@/lib/riasec/scoring";
import {
  AGE_MAX,
  AGE_MIN,
  GRADE_LEVELS,
  type GradeLevel,
  type RiasecLetter,
} from "@/lib/riasec/types";
import type { RiasecScores } from "@/store/useAssessmentStore";

// Server-side checks for results a browser sends (to email them or to save
// them): letters, whole numbers, a grade and a date, nothing free-form, so
// a route can never be made to store or mail arbitrary text.

export interface ScoredResults {
  gradeLevel: GradeLevel | null;
  code: [RiasecLetter, RiasecLetter, RiasecLetter];
  scores: RiasecScores;
  maxScore: number;
  // The student's local calendar date when they finished, "YYYY-MM-DD".
  takenOn: string;
}

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

const LETTERS = TRAIT_ORDER.map((trait) => TRAIT_META[trait].letter);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// The student's age as a whole number in the profile's range, null when
// not given, or undefined when it is not a valid age.
export function parseAge(value: unknown): number | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  const age = typeof value === "string" ? Number(value) : value;
  return typeof age === "number" &&
    Number.isInteger(age) &&
    age >= AGE_MIN &&
    age <= AGE_MAX
    ? age
    : undefined;
}

// "YYYY-MM-DD" to a local Date at midnight, or null if not a real date.
export function parseTakenOn(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number];
  const date = new Date(year, month - 1, day);
  const real =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return real && year >= 2020 && year <= 2100 ? date : null;
}

export function validateScoredResults(
  results: unknown,
): Checked<ScoredResults> {
  if (!isRecord(results)) return { ok: false, error: "Missing results." };

  const gradeLevel = results.gradeLevel ?? null;
  if (gradeLevel !== null && !GRADE_LEVELS.includes(gradeLevel as GradeLevel)) {
    return { ok: false, error: "Invalid grade level." };
  }

  const takenOn = typeof results.takenOn === "string" ? results.takenOn : "";
  if (!parseTakenOn(takenOn)) {
    return { ok: false, error: "Invalid assessment date." };
  }

  const maxScore = results.maxScore;
  if (
    typeof maxScore !== "number" ||
    !Number.isInteger(maxScore) ||
    maxScore < 1 ||
    maxScore > 100
  ) {
    return { ok: false, error: "Invalid maximum score." };
  }

  const code = results.code;
  if (
    !Array.isArray(code) ||
    code.length !== 3 ||
    !code.every((letter) => LETTERS.includes(letter as RiasecLetter)) ||
    new Set(code).size !== 3
  ) {
    return { ok: false, error: "Invalid Holland Code." };
  }

  const rawScores = results.scores;
  if (!isRecord(rawScores)) return { ok: false, error: "Missing scores." };
  const scores = {} as RiasecScores;
  for (const trait of TRAIT_ORDER) {
    const score = rawScores[trait];
    if (
      typeof score !== "number" ||
      !Number.isInteger(score) ||
      score < 0 ||
      score > maxScore
    ) {
      return { ok: false, error: `Invalid ${trait} score.` };
    }
    scores[trait] = score;
  }

  return {
    ok: true,
    value: {
      gradeLevel: gradeLevel as GradeLevel | null,
      code: code as [RiasecLetter, RiasecLetter, RiasecLetter],
      scores,
      maxScore,
      takenOn,
    },
  };
}
