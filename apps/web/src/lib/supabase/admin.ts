// Copyright (c) 2026 EdTech. All rights reserved.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client with the service role key, which bypasses
// RLS. Import it only from route handlers and server components. Nothing
// here is prefixed NEXT_PUBLIC_, so Next.js keeps both the key and the
// project URL out of client bundles; the browser never talks to Supabase.
//
// Returns null when the keys are not set, so callers can answer
// "not_configured" instead of crashing.
export function createSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
