// Copyright (c) 2026 EdTech. All rights reserved.

import { describe, expect, it } from "vitest";

import {
  adminHref,
  manilaToday,
  PRESETS,
  parsePeriod,
  periodKey,
  periodLabel,
  periodPhrase,
  withinPeriod,
  type Period,
} from "./periods";
import type { SavedResult } from "./repository";

const NOW = Date.parse("2026-11-22T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

const savedAt = (createdAt: string): SavedResult => ({
  resultsId: createdAt,
  code: ["R", "I", "A"],
  scores: { realistic: 1, investigative: 1, artistic: 1, social: 0, enterprising: 0, conventional: 0 },
  maxScore: 7,
  gradeLevel: "11",
  strand: null,
  age: 17,
  takenOn: createdAt.slice(0, 10),
  createdAt,
});
const savedDaysAgo = (days: number) => savedAt(new Date(NOW - days * DAY).toISOString());

describe("parsePeriod", () => {
  it("knows each preset and treats anything else as all time", () => {
    for (const preset of PRESETS) {
      expect(parsePeriod({ period: preset.id })).toEqual({ kind: "preset", preset });
    }
    for (const other of [undefined, null, "", "7d", "12m", ["1y"], "1Y"]) {
      expect(parsePeriod({ period: other })).toBeNull();
    }
  });

  it("reads a custom range, swapping reversed ends and dropping bad dates", () => {
    expect(parsePeriod({ period: "custom", from: "2026-01-01", to: "2026-11-25" })).toEqual({
      kind: "custom",
      from: "2026-01-01",
      to: "2026-11-25",
    });
    expect(parsePeriod({ period: "custom", from: "2026-11-25", to: "2026-01-01" })).toEqual({
      kind: "custom",
      from: "2026-01-01",
      to: "2026-11-25",
    });
    expect(parsePeriod({ period: "custom", from: "2026-02-30", to: "2026-03-01" })).toEqual({
      kind: "custom",
      from: null,
      to: "2026-03-01",
    });
    expect(parsePeriod({ period: "custom", from: "yesterday", to: ["2026-01-01"] })).toBeNull();
    expect(parsePeriod({ period: "custom" })).toBeNull();
  });
});

describe("withinPeriod", () => {
  it("keeps everything for all time", () => {
    const results = [0, 400, 4000].map(savedDaysAgo);
    expect(withinPeriod(results, null, NOW)).toHaveLength(3);
  });

  it("keeps results saved within a preset's last N days, the boundary included", () => {
    const results = [0, 30, 31, 365, 366, 1096, 1097, 3652, 3653].map(savedDaysAgo);
    const kept = (id: string) =>
      withinPeriod(results, parsePeriod({ period: id }), NOW).map((r) => r.resultsId);
    const ids = (...days: number[]) => days.map((days) => savedDaysAgo(days).resultsId);
    expect(kept("30d")).toEqual(ids(0, 30));
    expect(kept("1y")).toEqual(ids(0, 30, 31, 365));
    expect(kept("3y")).toEqual(ids(0, 30, 31, 365, 366, 1096));
    expect(kept("10y")).toEqual(ids(0, 30, 31, 365, 366, 1096, 1097, 3652));
  });

  it("keeps whole Philippine days for a custom range, both ends included", () => {
    const results = [
      "2026-01-31T15:59:59.000Z", // 31 Jan, 23:59 in Manila
      "2026-01-31T16:00:00.000Z", // 1 Feb, 00:00 in Manila
      "2026-02-28T15:59:59.000Z", // 28 Feb, 23:59 in Manila
      "2026-02-28T16:00:00.000Z", // 1 Mar, 00:00 in Manila
    ].map(savedAt);
    const kept = (period: Period | null) => withinPeriod(results, period, NOW).map((r) => r.resultsId);
    expect(kept(parsePeriod({ period: "custom", from: "2026-02-01", to: "2026-02-28" }))).toEqual([
      "2026-01-31T16:00:00.000Z",
      "2026-02-28T15:59:59.000Z",
    ]);
    expect(kept(parsePeriod({ period: "custom", from: "2026-03-01" }))).toEqual([
      "2026-02-28T16:00:00.000Z",
    ]);
    expect(kept(parsePeriod({ period: "custom", to: "2026-01-31" }))).toEqual([
      "2026-01-31T15:59:59.000Z",
    ]);
  });

  it("never changes the list it was given", () => {
    const results = [0, 400].map(savedDaysAgo);
    const copy = [...results];
    withinPeriod(results, parsePeriod({ period: "1y" }), NOW);
    expect(results).toEqual(copy);
  });
});

describe("period names and links", () => {
  const custom = parsePeriod({ period: "custom", from: "2026-01-01", to: "2026-11-25" });
  const preset = parsePeriod({ period: "30d" });

  it("names a period for headings and sentences", () => {
    expect(periodLabel(preset!)).toBe("Last 30 days");
    expect(periodPhrase(preset!)).toBe("in the last 30 days");
    expect(periodLabel(custom!)).toBe("1 Jan 2026 to 25 Nov 2026");
    expect(periodPhrase(custom!)).toBe("from 1 Jan 2026 to 25 Nov 2026");
    expect(periodPhrase(parsePeriod({ period: "custom", from: "2026-03-05" })!)).toBe("since 5 Mar 2026");
  });

  it("builds keys and links that parse back to the same period", () => {
    expect(periodKey(null)).toBe("all");
    expect(periodKey(preset)).toBe("30d");
    expect(periodKey(custom)).toBe("2026-01-01-to-2026-11-25");
    expect(adminHref(null, null)).toBe("/admin");
    expect(adminHref("11", preset)).toBe("/admin?grade=11&period=30d");
    const href = adminHref("12", custom, "/admin/export");
    expect(href).toBe("/admin/export?grade=12&period=custom&from=2026-01-01&to=2026-11-25");
    const params = new URL(href, "http://x").searchParams;
    expect(
      parsePeriod({ period: params.get("period"), from: params.get("from"), to: params.get("to") }),
    ).toEqual(custom);
  });

  it("gives today's date in the Philippines", () => {
    expect(manilaToday(Date.parse("2026-11-24T16:00:00.000Z"))).toBe("2026-11-25");
    expect(manilaToday(Date.parse("2026-11-24T15:59:59.000Z"))).toBe("2026-11-24");
  });
});
