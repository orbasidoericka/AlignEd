// Copyright (c) 2026 EdTech. All rights reserved.

import { callerKey, createWindowLimiter } from "@/lib/saved-results/ip-limiter";
import { deleteResult, getResult } from "@/lib/saved-results/repository";
import { normalizeResultsId } from "@/lib/saved-results/results-id";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// GET /api/results/:id loads a saved result to compare against;
// DELETE /api/results/:id removes it for good. The results ID is the only
// key, so both are rate-limited per network to make guessing IDs useless.

const lookups = createWindowLimiter(60, 60 * 60 * 1000);

type Context = { params: Promise<{ id: string }> };

async function prepare(request: Request, { params }: Context) {
  const db = createSupabaseAdminClient();
  if (!db) {
    return { response: Response.json({ error: "not_configured" }, { status: 500 }) };
  }
  if (lookups.hit(callerKey(request))) {
    return { response: Response.json({ error: "rate_limited" }, { status: 429 }) };
  }
  const resultsId = normalizeResultsId(decodeURIComponent((await params).id));
  if (!resultsId) {
    return { response: Response.json({ error: "not_found" }, { status: 404 }) };
  }
  return { db, resultsId };
}

export async function GET(request: Request, context: Context) {
  const ready = await prepare(request, context);
  if ("response" in ready) return ready.response;
  try {
    const result = await getResult(ready.db, ready.resultsId);
    if (!result) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json(
      { result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("results: could not load:", errorCode(error));
    return Response.json({ error: "failed" }, { status: 502 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const ready = await prepare(request, context);
  if ("response" in ready) return ready.response;
  try {
    const deleted = await deleteResult(ready.db, ready.resultsId);
    if (!deleted) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("results: could not delete:", errorCode(error));
    return Response.json({ error: "failed" }, { status: 502 });
  }
}

function errorCode(error: unknown): string {
  return typeof error === "object" && error && "code" in error
    ? String(error.code)
    : "unknown";
}
