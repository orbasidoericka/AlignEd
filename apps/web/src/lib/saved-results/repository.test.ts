// Copyright (c) 2026 EdTech. All rights reserved.

import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { listResults } from "./repository";

describe("listResults", () => {
  it("skips expired rows, because the purge now runs after the page is sent", async () => {
    const query = {
      select: vi.fn(() => query),
      gt: vi.fn(() => query),
      order: vi.fn(() => query),
      limit: vi.fn(() => query),
      returns: vi.fn(async () => ({ data: [], error: null, count: 0 })),
    };
    const db = { from: () => query } as unknown as SupabaseClient;

    await expect(listResults(db, 10)).resolves.toEqual({ results: [], total: 0 });
    expect(query.gt).toHaveBeenCalledWith("expires_at", expect.any(String));
  });
});
