// Copyright (c) 2026 EdTech. All rights reserved.

import type { SupabaseClient } from "@supabase/supabase-js";

// Reads and writes public.site_counters (supabase/migrations/0006). Server
// only: every call needs the service role client.

const TABLE = "site_counters";

// Lifetime completed assessments, shown on the landing hero. The counter is
// never decremented: deleting a saved result or purging an expired one does
// not un-take the test.
export const TESTS_TAKEN = "tests_taken";

export async function readCounter(
  db: SupabaseClient,
  key: string,
): Promise<number> {
  const { data, error } = await db
    .from(TABLE)
    .select("value")
    .eq("key", key)
    .maybeSingle<{ value: number }>();
  if (error) throw error;
  // The migration seeds every key it defines; a missing row means a key no
  // one has counted yet, which is zero.
  return data?.value ?? 0;
}

export async function bumpCounter(
  db: SupabaseClient,
  key: string,
): Promise<void> {
  // One atomic statement in the database (see the migration): read-then-write
  // from here would lose increments when a whole class finishes together.
  const { error } = await db.rpc("increment_site_counter", { p_key: key });
  if (error) throw error;
}
