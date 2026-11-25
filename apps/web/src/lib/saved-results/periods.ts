// Copyright (c) 2026 EdTech. All rights reserved.

import type { SavedResult } from "./repository";

// The admin page's period filter (PRD FR-10.1): ?period=1y|5y|10y, absent for
// all time. A result is in a period when it was saved (createdAt) within that
// many days of now (leap days counted), the same measure as the "Last 30 days"
// card.

export const PERIODS = [
  { id: "1y", label: "Last 1 year", short: "1 year", days: 365 },
  { id: "5y", label: "Last 5 years", short: "5 years", days: 1826 },
  { id: "10y", label: "Last 10 years", short: "10 years", days: 3652 },
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
