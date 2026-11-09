// Copyright (c) 2026 EdTech. All rights reserved.

import { revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isRecord,
  parseAge,
  parseStrand,
  validateScoredResults,
} from "@/lib/riasec/validate-results";
import { callerKey, createWindowLimiter } from "@/lib/saved-results/ip-limiter";
import { saveResult } from "@/lib/saved-results/repository";
import { bumpCounter, TESTS_TAKEN } from "@/lib/site-counters/repository";
import { TESTS_TAKEN_TAG } from "@/lib/site-counters/tests-taken";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// POST /api/results: saves a finished assessment (scores, code, grade,
// strand, age, date; no name or other identifier) and answers with a results
// ID, used only for the admin stats page. Rows expire after a year.
//
// Server-only setting in apps/web/.env.local:
//   SUPABASE_SERVICE_ROLE_KEY  Project Settings > API > service_role key

// A school lab shares one IP, and a whole class may finish in the same
// hour, so this is generous.
const saves = createWindowLimiter(200, 60 * 60 * 1000);

export async function POST(request: Request) {
  const db = createSupabaseAdminClient();
  if (!db) return Response.json({ error: "not_configured" }, { status: 500 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const checked = validateScoredResults(body);
  if (!checked.ok) {
    return Response.json(
      { error: "invalid", message: checked.error },
      { status: 400 },
    );
  }

  const age = parseAge(isRecord(body) ? body.age : undefined);
  if (age === undefined) {
    return Response.json(
      { error: "invalid", message: "Invalid age." },
      { status: 400 },
    );
  }

  const strand = parseStrand(isRecord(body) ? body.strand : undefined);
  if (strand === undefined) {
    return Response.json(
      { error: "invalid", message: "Invalid strand." },
      { status: 400 },
    );
  }

  if (saves.hit(callerKey(request))) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const resultsId = await saveResult(db, { ...checked.value, age, strand });
    await countTestTaken(db);
    return Response.json({ resultsId });
  } catch (error) {
    console.error("results: could not save:", errorCode(error));
    return Response.json({ error: "failed" }, { status: 502 });
  }
}

// The landing page's lifetime tally. One bump per saved result (the panel on
// the results page saves exactly once per completion), and the landing page's
// cached count is marked stale so it picks the new figure up without waiting
// out its five minutes. "max" is stale-while-revalidate: the next visitor may
// still see the previous number while the fresh one loads behind them, which
// is the right trade for a number nobody is watching to the second.
//
// Swallows its own failures: the student's result is already stored, and a
// counter must never be able to turn a successful save into an error.
async function countTestTaken(db: SupabaseClient): Promise<void> {
  try {
    await bumpCounter(db, TESTS_TAKEN);
    revalidateTag(TESTS_TAKEN_TAG, "max");
  } catch (error) {
    console.error("results: could not count the test taken:", errorCode(error));
  }
}

function errorCode(error: unknown): string {
  return typeof error === "object" && error && "code" in error
    ? String(error.code)
    : "unknown";
}
