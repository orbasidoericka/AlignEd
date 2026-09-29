// Copyright (c) 2026 EdTech. All rights reserved.

import { RATE_LIMITS } from "./email-content";

// In-memory rate limiter for the send-results route. Keys are salted
// hashes, never raw addresses or IPs, and entries expire with their window.
//
// Memory only: it resets when the server restarts, and each server
// instance counts separately. Good enough for one school's traffic; a
// shared store (a database table) is needed if the app runs on several
// instances.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function createRateLimiter() {
  const sendsByEmail = new Map<string, number[]>();
  const sendsByIp = new Map<string, number[]>();

  const recent = (map: Map<string, number[]>, key: string, window: number, now: number) => {
    const times = (map.get(key) ?? []).filter((t) => now - t < window);
    if (times.length > 0) map.set(key, times);
    else map.delete(key);
    return times;
  };

  return {
    // True when another send for this address or network is over a limit.
    isLimited(emailHash: string, ipHash: string, now = Date.now()): boolean {
      return (
        recent(sendsByEmail, emailHash, DAY, now).length >=
          RATE_LIMITS.perEmailPerDay ||
        recent(sendsByIp, ipHash, HOUR, now).length >= RATE_LIMITS.perIpPerHour
      );
    },

    record(emailHash: string, ipHash: string, now = Date.now()): void {
      sendsByEmail.set(emailHash, [...recent(sendsByEmail, emailHash, DAY, now), now]);
      sendsByIp.set(ipHash, [...recent(sendsByIp, ipHash, HOUR, now), now]);
    },
  };
}
