// Copyright (c) 2026 EdTech. All rights reserved.

import type { SavedResult } from "./repository";

// The admin page's period filter (PRD FR-10.1): ?period=7d|30d|3m|6m|1y, absent
// for all time. A result is in a period when it was saved (createdAt) within
// that many days of now, the same measure as the "Last 30 days" card. Saved
// results are deleted after one year, so "all time" and "1 year" mostly
// match; 1 year is there so the team can pick a year on purpose.

export const PERIODS = [
  { id: "7d", label: "Last 7 days", short: "7 days", days: 7 },
  { id: "30d", label: "Last 30 days", short: "30 days", days: 30 },
  { id: "3m", label: "Last 3 months", short: "3 months", days: 91 },
  { id: "6m", label: "Last 6 months", short: "6 months", days: 182 },
  { id: "1y", label: "Last 12 months", short: "1 year", days: 365 },
] as const;

export type Period = (typeof PERIODS)[number];
export type PeriodId = Period["id"];

const DAY = 24 * 60 * 60 * 1000;

// Null (all time) for anything that is not a known period.
export function parsePeriod(value: unknown): Period | null {
  return PERIODS.find((period) => period.id === value) ?? null;
}

export function withinPeriod(
  results: readonly SavedResult[],
  period: Period | null,
  now = Date.now(),
): SavedResult[] {
  if (!period) return [...results];
  const since = now - period.days * DAY;
  return results.filter((result) => new Date(result.createdAt).getTime() >= since);
}
