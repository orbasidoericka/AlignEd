// Copyright (c) 2026 EdTech. All rights reserved.

import { createHash, randomBytes } from "node:crypto";

// Per-network rate limits for the saved-results routes. Keys are salted
// hashes of the caller's IP, never the IP itself. Memory only, like the
// email limiter: it resets on restart and each server instance counts on
// its own.

// Fresh per process, so the hashes mean nothing outside this server.
const SALT = randomBytes(32).toString("hex");

export function callerKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "local";
  return createHash("sha256").update(`${SALT}:${ip}`).digest("hex");
}

export function createWindowLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return {
    // Counts this request and says whether it is over the limit.
    hit(key: string, now = Date.now()): boolean {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return true;
      }
      hits.set(key, [...recent, now]);
      return false;
    },
  };
}
