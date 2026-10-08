import { describe, expect, it } from "vitest";

import type { SavedResult } from "./repository";
import { summarize } from "./summary";

const NOW = new Date("2026-10-08T12:00:00Z").getTime();

function result(
  code: string,
  gradeLevel: SavedResult["gradeLevel"],
  createdAt: string,
  age: number | null = 16,
): SavedResult {
  return {
    resultsId: "ALGN-7KQ2-MX9P",
    code: code.split("") as SavedResult["code"],
    scores: {
      realistic: 1,
      investigative: 1,
      artistic: 1,
      social: 1,
      enterprising: 1,
      conventional: 1,
    },
    maxScore: 7,
    gradeLevel,
    age,
    takenOn: createdAt.slice(0, 10),
    createdAt,
  };
}

describe("summarize", () => {
  const summary = summarize(
    [
      result("IRA", "11", "2026-10-01T00:00:00Z", 16),
      result("IRA", "12", "2026-10-02T00:00:00Z", 17),
      result("SEC", "12", "2026-01-01T00:00:00Z", 17),
      result("ASE", null, "2026-09-20T00:00:00Z", null),
    ],
    NOW,
  );

  it("counts everything and the last 30 days", () => {
    expect(summary.count).toBe(4);
    expect(summary.last30Days).toBe(3);
  });

  it("counts strongest letters in R-I-A-S-E-C order, zeros included", () => {
    expect(summary.byTopLetter).toEqual([
      { letter: "R", count: 0 },
      { letter: "I", count: 2 },
      { letter: "A", count: 1 },
      { letter: "S", count: 1 },
      { letter: "E", count: 0 },
      { letter: "C", count: 0 },
    ]);
  });

  it("ranks codes by count, then alphabetically", () => {
    expect(summary.topCodes).toEqual([
      { code: "I-R-A", count: 2 },
      { code: "A-S-E", count: 1 },
      { code: "S-E-C", count: 1 },
    ]);
  });

  it("counts students per age, youngest first, and averages known ages", () => {
    expect(summary.byAge).toEqual([
      { age: 16, count: 1 },
      { age: 17, count: 2 },
    ]);
    expect(summary.ageNotGiven).toBe(1);
    expect(summary.averageAge).toBe(16.7);
    expect(summarize([], NOW).averageAge).toBeNull();
  });

  it("counts grades, and missing grades only when there are some", () => {
    expect(summary.byGrade).toEqual([
      { grade: "11", count: 1 },
      { grade: "12", count: 2 },
      { grade: "Not given", count: 1 },
    ]);
    expect(summarize([], NOW).byGrade.map((row) => row.grade)).toEqual([
      "11",
      "12",
    ]);
  });
});
