import { describe, expect, it } from "vitest";

import { RATE_LIMITS } from "./email-content";
import { createRateLimiter } from "./rate-limiter";

const HOUR = 60 * 60 * 1000;

describe("createRateLimiter", () => {
  it("allows up to the per-address limit per day, then blocks", () => {
    const limiter = createRateLimiter();
    const start = 1_000_000;
    for (let i = 0; i < RATE_LIMITS.perEmailPerDay; i++) {
      expect(limiter.isLimited("mail", `ip-${i}`, start)).toBe(false);
      limiter.record("mail", `ip-${i}`, start);
    }
    expect(limiter.isLimited("mail", "ip-new", start)).toBe(true);
    // A day later the address can send again.
    expect(limiter.isLimited("mail", "ip-new", start + 24 * HOUR + 1)).toBe(false);
  });

  it("blocks one network after the hourly limit, across addresses", () => {
    const limiter = createRateLimiter();
    const start = 1_000_000;
    for (let i = 0; i < RATE_LIMITS.perIpPerHour; i++) {
      limiter.record(`mail-${i}`, "school-lab", start);
    }
    expect(limiter.isLimited("mail-new", "school-lab", start)).toBe(true);
    expect(limiter.isLimited("mail-new", "school-lab", start + HOUR + 1)).toBe(false);
  });
});
