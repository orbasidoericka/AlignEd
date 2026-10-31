// Copyright (c) 2026 EdTech. All rights reserved.

import { unstable_cache } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { readCounter, TESTS_TAKEN } from "./repository";

// The lifetime "tests taken" figure for the landing hero.
//
// cacheComponents is off in next.config.ts, so this is the classic model:
// unstable_cache is what caches a database read that is not a fetch. The
// landing page stays prerendered and the count refreshes on the tag (the
// save route revalidates it after every completion) or every five minutes,
// whichever comes first.
export const TESTS_TAKEN_TAG = "tests-taken";

const REVALIDATE_SECONDS = 300;

const cachedCount = unstable_cache(
  async (): Promise<number | null> => {
    const db = createSupabaseAdminClient();
    if (!db) return null;
    try {
      return await readCounter(db, TESTS_TAKEN);
    } catch (error) {
      console.error("tests-taken: could not read counter:", errorCode(error));
      return null;
    }
  },
  ["tests-taken"],
  { revalidate: REVALIDATE_SECONDS, tags: [TESTS_TAKEN_TAG] },
);

// null means "no number to show" — Supabase unconfigured, or the read failed.
// The landing page renders nothing in that case rather than a zero, and this
// never throws into a page render.
export async function getTestsTakenCount(): Promise<number | null> {
  try {
    return await cachedCount();
  } catch (error) {
    console.error("tests-taken: could not read counter:", errorCode(error));
    return null;
  }
}

function errorCode(error: unknown): string {
  return typeof error === "object" && error && "code" in error
    ? String(error.code)
    : "unknown";
}
