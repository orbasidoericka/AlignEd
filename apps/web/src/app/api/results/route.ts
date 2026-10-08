// Copyright (c) 2026 EdTech. All rights reserved.

import {
  isRecord,
  parseAge,
  validateScoredResults,
} from "@/lib/riasec/validate-results";
import { callerKey, createWindowLimiter } from "@/lib/saved-results/ip-limiter";
import { saveResult } from "@/lib/saved-results/repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// POST /api/results: saves a finished assessment (scores, code, grade,
// age, date; no name or other identifier) and answers with the results ID the
// student keeps to compare later. Rows expire after a year.
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

  if (saves.hit(callerKey(request))) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const resultsId = await saveResult(db, { ...checked.value, age });
    return Response.json({ resultsId });
  } catch (error) {
    console.error("results: could not save:", errorCode(error));
    return Response.json({ error: "failed" }, { status: 502 });
  }
}

function errorCode(error: unknown): string {
  return typeof error === "object" && error && "code" in error
    ? String(error.code)
    : "unknown";
}
