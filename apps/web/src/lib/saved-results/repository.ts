// Copyright (c) 2026 EdTech. All rights reserved.

import type { SupabaseClient } from "@supabase/supabase-js";

import { TRAIT_ORDER } from "@/lib/riasec/scoring";
import type { ScoredResults } from "@/lib/riasec/validate-results";
import type { GradeLevel, RiasecLetter } from "@/lib/riasec/types";
import type { RiasecScores } from "@/store/useAssessmentStore";

import { generateResultsId } from "./results-id";

// Reads and writes public.saved_results (supabase/migrations/0003). Server
// only: every call needs the service role client.

const TABLE = "saved_results";

export interface SavedResult {
  resultsId: string;
  code: [RiasecLetter, RiasecLetter, RiasecLetter];
  scores: RiasecScores;
  maxScore: number;
  gradeLevel: GradeLevel | null;
  age: number | null;
  takenOn: string; // YYYY-MM-DD
  createdAt: string; // ISO
}

// What the save route stores: the scored results plus the student's age.
export type SaveInput = ScoredResults & { age: number | null };

interface Row {
  results_id: string;
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
  max_score: number;
  holland_code: string;
  grade_level: GradeLevel | null;
  age: number | null;
  taken_on: string;
  created_at: string;
}

const COLUMNS =
  "results_id, realistic, investigative, artistic, social, enterprising, conventional, max_score, holland_code, grade_level, age, taken_on, created_at";

export function fromRow(row: Row): SavedResult {
  const scores = {} as RiasecScores;
  for (const trait of TRAIT_ORDER) scores[trait] = row[trait];
  return {
    resultsId: row.results_id,
    code: row.holland_code.split("") as SavedResult["code"],
    scores,
    maxScore: row.max_score,
    gradeLevel: row.grade_level,
    age: row.age,
    takenOn: row.taken_on,
    createdAt: row.created_at,
  };
}

// Postgres unique_violation: the random ID was already taken.
const UNIQUE_VIOLATION = "23505";

export async function saveResult(
  db: SupabaseClient,
  results: SaveInput,
): Promise<string> {
  // A clash in 2^40 is very unlikely; three tries makes it a non-event.
  for (let attempt = 1; ; attempt++) {
    const resultsId = generateResultsId();
    const { error } = await db.from(TABLE).insert({
      results_id: resultsId,
      ...results.scores,
      max_score: results.maxScore,
      holland_code: results.code.join(""),
      grade_level: results.gradeLevel,
      age: results.age,
      taken_on: results.takenOn,
    });
    if (!error) return resultsId;
    if (error.code !== UNIQUE_VIOLATION || attempt === 3) throw error;
  }
}

// The saved result, or null when there is none or it has expired.
export async function getResult(
  db: SupabaseClient,
  resultsId: string,
): Promise<SavedResult | null> {
  const { data, error } = await db
    .from(TABLE)
    .select(COLUMNS)
    .eq("results_id", resultsId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle<Row>();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

// True when a row was deleted.
export async function deleteResult(
  db: SupabaseClient,
  resultsId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from(TABLE)
    .delete()
    .eq("results_id", resultsId)
    .select("results_id");
  if (error) throw error;
  return (data ?? []).length > 0;
}

// Rows past their one-year retention. Run on admin page loads, so expired
// data is gone even without a scheduled job; reads already skip it.
export async function purgeExpired(db: SupabaseClient): Promise<void> {
  const { error } = await db
    .from(TABLE)
    .delete()
    .lte("expires_at", new Date().toISOString());
  if (error) throw error;
}

export async function listResults(
  db: SupabaseClient,
  limit: number,
): Promise<{ results: SavedResult[]; total: number }> {
  const { data, error, count } = await db
    .from(TABLE)
    .select(COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<Row[]>();
  if (error) throw error;
  return { results: (data ?? []).map(fromRow), total: count ?? 0 };
}
