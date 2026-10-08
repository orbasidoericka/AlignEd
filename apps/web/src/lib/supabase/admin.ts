// Copyright (c) 2026 EdTech. All rights reserved.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client with the service role key, which bypasses
// RLS. Import it only from route handlers and server components: the key
// must never reach the browser (it has no NEXT_PUBLIC_ prefix, so Next.js
// leaves it out of client bundles anyway).
//
// Returns null when the keys are not set, so callers can answer
// "not_configured" instead of crashing.
export function createSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
