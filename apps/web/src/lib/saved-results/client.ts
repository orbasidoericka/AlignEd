// Copyright (c) 2026 EdTech. All rights reserved.

import type { HollandCode } from "@/lib/riasec/scoring";
import type { GradeLevel } from "@/lib/riasec/types";
import type { RiasecScores } from "@/store/useAssessmentStore";

import type { SavedResult } from "./repository";

// Browser calls to the saved-results routes. Only scores, the code, grade,
// age and date are sent: never the nickname, school, or answers.

export type SavedResultsError =
  | "not_found"
  | "rate_limited"
  | "invalid"
  | "failed"
  | "not_configured";

export type Outcome<T> = { ok: true; value: T } | { ok: false; error: SavedResultsError };

async function call<T>(
  input: string,
  init: RequestInit,
  read: (body: Record<string, unknown>) => T,
): Promise<Outcome<T>> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    return { ok: false, error: "failed" }; // offline or unreachable
  }
  const body = ((await response.json().catch(() => null)) ?? {}) as Record<
    string,
    unknown
  >;
  if (response.ok) return { ok: true, value: read(body) };
  const known: SavedResultsError[] = [
    "not_found",
    "rate_limited",
    "invalid",
    "not_configured",
  ];
  const error = known.find((code) => code === body.error) ?? "failed";
  return { ok: false, error };
}

// The student's own calendar date, whatever the server's time zone.
function localDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function saveResults(input: {
  gradeLevel: GradeLevel | null;
  // As typed on the profile step; "" when not given.
  age: string;
  code: HollandCode;
  scores: RiasecScores;
  maxScore: number;
  takenOn: Date;
}): Promise<Outcome<string>> {
  return call(
    "/api/results",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, takenOn: localDate(input.takenOn) }),
    },
    (body) => String(body.resultsId),
  );
}

export function loadSavedResult(resultsId: string): Promise<Outcome<SavedResult>> {
  return call(
    `/api/results/${encodeURIComponent(resultsId)}`,
    { cache: "no-store" },
    (body) => body.result as SavedResult,
  );
}

export function deleteSavedResult(resultsId: string): Promise<Outcome<true>> {
  return call(
    `/api/results/${encodeURIComponent(resultsId)}`,
    { method: "DELETE" },
    () => true as const,
  );
}
