// Copyright (c) 2026 EdTech. All rights reserved.

import { getTestsTakenCount } from "@/lib/site-counters/tests-taken";

import { TestsTakenTally } from "./tests-taken-tally";

// Server half of the hero tally: it does the (cached) read and decides
// whether there is anything worth showing.
//
// Nothing renders when the count is unavailable — Supabase unconfigured, or
// the read failed — the same choice the saved-results panel makes. A zero or
// a made-up floor would be worse than silence on a page whose whole job is
// credibility.
export async function TestsTaken() {
  const count = await getTestsTakenCount();
  if (count === null || count < 1) return null;
  return <TestsTakenTally value={count} />;
}
