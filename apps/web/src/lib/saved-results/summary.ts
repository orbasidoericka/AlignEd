// Copyright (c) 2026 EdTech. All rights reserved.

import { TRAIT_META, TRAIT_ORDER } from "@/lib/riasec/scoring";
import { GRADE_LEVELS, type RiasecLetter } from "@/lib/riasec/types";

import type { SavedResult } from "./repository";

// Totals for the admin page, from the saved rows it loaded.

export interface ResultsSummary {
  count: number;
  last30Days: number;
  // How many students have each letter as their strongest, in R-I-A-S-E-C order.
  byTopLetter: { letter: RiasecLetter; count: number }[];
  // Most common full codes, most frequent first.
  topCodes: { code: string; count: number }[];
  byGrade: { grade: string; count: number }[];
  // Students per age, youngest first; only ages someone actually has.
  byAge: { age: number; count: number }[];
  // Rows saved without an age (before ages were saved).
  ageNotGiven: number;
  // Mean age to one decimal, or null when no row has an age.
  averageAge: number | null;
}

const DAY = 24 * 60 * 60 * 1000;

export function summarize(
  results: readonly SavedResult[],
  now = Date.now(),
  topCodeCount = 10,
): ResultsSummary {
  const topLetters = new Map<RiasecLetter, number>();
  const codes = new Map<string, number>();
  const grades = new Map<string, number>();
  const ages = new Map<number, number>();
  let ageNotGiven = 0;
  let last30Days = 0;

  for (const result of results) {
    const [first] = result.code;
    topLetters.set(first, (topLetters.get(first) ?? 0) + 1);
    const code = result.code.join("-");
    codes.set(code, (codes.get(code) ?? 0) + 1);
    const grade = result.gradeLevel ?? "Not given";
    grades.set(grade, (grades.get(grade) ?? 0) + 1);
    if (result.age === null) ageNotGiven++;
    else ages.set(result.age, (ages.get(result.age) ?? 0) + 1);
    if (now - new Date(result.createdAt).getTime() <= 30 * DAY) last30Days++;
  }

  const byAge = [...ages]
    .map(([age, count]) => ({ age, count }))
    .sort((a, b) => a.age - b.age);
  const withAge = results.length - ageNotGiven;
  const ageTotal = byAge.reduce((sum, row) => sum + row.age * row.count, 0);

  return {
    count: results.length,
    last30Days,
    byTopLetter: TRAIT_ORDER.map((trait) => {
      const letter = TRAIT_META[trait].letter;
      return { letter, count: topLetters.get(letter) ?? 0 };
    }),
    topCodes: [...codes]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
      .slice(0, topCodeCount),
    byGrade: [...GRADE_LEVELS, "Not given"]
      .map((grade) => ({ grade, count: grades.get(grade) ?? 0 }))
      .filter((row) => row.grade !== "Not given" || row.count > 0),
    byAge,
    ageNotGiven,
    averageAge: withAge ? Math.round((ageTotal / withAge) * 10) / 10 : null,
  };
}
