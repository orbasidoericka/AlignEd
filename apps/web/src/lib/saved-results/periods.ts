// Copyright (c) 2026 EdTech. All rights reserved.

import type { GradeLevel } from "@/lib/riasec/types";

import type { SavedResult } from "./repository";

// The admin page's time filter (PRD FR-10.1). In the URL:
//   ?period=30d|3m|6m|1y|3y|5y|10y        a preset: saved within that many
//                                         days of now (leap days counted)
//   ?period=custom&from=YYYY-MM-DD&to=…   a custom range of whole days,
//                                         Philippine time, both ends kept
// Absent or anything else is all time. A custom range may leave one end
// open; reversed ends are swapped.

export const PRESETS = [
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "3m", label: "Last 3 months", days: 91 },
  { id: "6m", label: "Last 6 months", days: 182 },
  { id: "1y", label: "Last 1 year", days: 365 },
  { id: "3y", label: "Last 3 years", days: 1096 },
  { id: "5y", label: "Last 5 years", days: 1826 },
  { id: "10y", label: "Last 10 years", days: 3652 },
] as const;

export type Preset = (typeof PRESETS)[number];
export type PresetId = Preset["id"];

export type Period =
  | { kind: "preset"; preset: Preset }
  | { kind: "custom"; from: string | null; to: string | null };

const DAY = 24 * 60 * 60 * 1000;
const MANILA_OFFSET = 8 * 60 * 60 * 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Param = string | string[] | null | undefined;
const single = (value: Param) => (typeof value === "string" ? value : null);

// A real calendar date in YYYY-MM-DD form, or null.
function validDate(value: Param): string | null {
  const text = single(value);
  if (!text || !ISO_DATE.test(text)) return null;
  const parsed = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(text) ? text : null;
}

// Midnight at the start of a date, Philippine time, as epoch ms.
const manilaMidnight = (date: string) => Date.parse(`${date}T00:00:00Z`) - MANILA_OFFSET;

// Null (all time) for anything that is not a known preset or a custom range
// with at least one valid date.
export function parsePeriod(params: { period?: Param; from?: Param; to?: Param }): Period | null {
  const id = single(params.period);
  if (id === "custom") {
    let from = validDate(params.from);
    let to = validDate(params.to);
    if (!from && !to) return null;
    if (from && to && from > to) [from, to] = [to, from];
    return { kind: "custom", from, to };
  }
  const preset = PRESETS.find((candidate) => candidate.id === id);
  return preset ? { kind: "preset", preset } : null;
}

export function withinPeriod(
  results: readonly SavedResult[],
  period: Period | null,
  now = Date.now(),
): SavedResult[] {
  if (!period) return [...results];
  let since = -Infinity;
  let until = Infinity;
  if (period.kind === "preset") {
    since = now - period.preset.days * DAY;
  } else {
    if (period.from) since = manilaMidnight(period.from);
    // Through the end of the "to" day.
    if (period.to) until = manilaMidnight(period.to) + DAY;
  }
  return results.filter((result) => {
    const saved = new Date(result.createdAt).getTime();
    return saved >= since && saved < until;
  });
}

// Today's date in the Philippines, YYYY-MM-DD.
export function manilaToday(now = Date.now()): string {
  return new Date(now + MANILA_OFFSET).toISOString().slice(0, 10);
}

// "25 Nov 2026": spelled out so it reads the same in every locale.
export function formatDay(date: string): string {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

// The period as a name: "Last 30 days", "1 Jan 2026 to 25 Nov 2026".
export function periodLabel(period: Period): string {
  if (period.kind === "preset") return period.preset.label;
  const { from, to } = period;
  if (from && to) return `${formatDay(from)} to ${formatDay(to)}`;
  return from ? `Since ${formatDay(from)}` : `Up to ${formatDay(to!)}`;
}

// The period inside a sentence: "in the last 30 days", "from 1 Jan 2026 to
// 25 Nov 2026".
export function periodPhrase(period: Period): string {
  if (period.kind === "preset") return `in the ${period.preset.label.toLowerCase()}`;
  const { from, to } = period;
  if (from && to) return `from ${formatDay(from)} to ${formatDay(to)}`;
  return from ? `since ${formatDay(from)}` : `up to ${formatDay(to!)}`;
}

// Stable across renders and safe in a file name: "30d", "2026-01-01-to-2026-11-25".
export function periodKey(period: Period | null): string {
  if (!period) return "all";
  if (period.kind === "preset") return period.preset.id;
  return `${period.from ?? "start"}-to-${period.to ?? "today"}`;
}

// The admin page's address for a grade and period; each filter keeps the
// other's choice. Pass base "/admin/export" for the download.
export function adminHref(
  grade: GradeLevel | null,
  period: Period | null,
  base = "/admin",
): string {
  const params = new URLSearchParams();
  if (grade) params.set("grade", grade);
  if (period?.kind === "preset") params.set("period", period.preset.id);
  if (period?.kind === "custom") {
    params.set("period", "custom");
    if (period.from) params.set("from", period.from);
    if (period.to) params.set("to", period.to);
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
