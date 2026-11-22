// Copyright (c) 2026 EdTech. All rights reserved.

import { describe, expect, it } from "vitest";

import { PERIODS, parsePeriod, withinPeriod } from "./periods";
import type { SavedResult } from "./repository";

const NOW = Date.parse("2026-11-22T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

const savedDaysAgo = (days: number): SavedResult => ({
  resultsId: `ALGN-${String(days).padStart(4, "0")}-TEST`,
  code: ["R", "I", "A"],
  scores: { realistic: 1, investigative: 1, artistic: 1, social: 0, enterprising: 0, conventional: 0 },
  maxScore: 7,
  gradeLevel: "11",
  strand: null,
  age: 17,
  takenOn: new Date(NOW - days * DAY).toISOString().slice(0, 10),
  createdAt: new Date(NOW - days * DAY).toISOString(),
});

describe("parsePeriod", () => {
  it("knows each preset and treats anything else as all time", () => {
    for (const period of PERIODS) expect(parsePeriod(period.id)).toBe(period);
    for (const other of [undefined, null, "", "1y", "30", ["30d"], "30D"]) {
      expect(parsePeriod(other)).toBeNull();
    }
  });
});

describe("withinPeriod", () => {
  const results = [0, 6, 7, 8, 29, 30, 31, 90, 91, 92, 181, 182, 183, 300].map(savedDaysAgo);
  const kept = (id: string | null) =>
    withinPeriod(results, parsePeriod(id), NOW).map((result) => result.resultsId);
  const ids = (...days: number[]) => days.map((days) => savedDaysAgo(days).resultsId);

  it("keeps everything for all time", () => {
    expect(withinPeriod(results, null, NOW)).toHaveLength(results.length);
  });

  it("keeps results saved within the last N days, the boundary included", () => {
    expect(kept("7d")).toEqual(ids(0, 6, 7));
    expect(kept("30d")).toEqual(ids(0, 6, 7, 8, 29, 30));
    expect(kept("3m")).toEqual(ids(0, 6, 7, 8, 29, 30, 31, 90, 91));
    expect(kept("6m")).toEqual(ids(0, 6, 7, 8, 29, 30, 31, 90, 91, 92, 181, 182));
  });

  it("never changes the list it was given", () => {
    const copy = [...results];
    withinPeriod(results, parsePeriod("7d"), NOW);
    expect(results).toEqual(copy);
  });
});
