// Copyright (c) 2026 EdTech. All rights reserved.

import { describe, expect, it } from "vitest";

import { callerKey, createWindowLimiter } from "./ip-limiter";

describe("callerKey", () => {
  it("gives the same key from a request or from its headers alone", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    const request = new Request("https://aligned.test/", { headers });
    expect(callerKey(headers)).toBe(callerKey(request));
    expect(callerKey(headers)).not.toContain("203.0.113.7");
    expect(callerKey(new Headers({ "x-forwarded-for": "198.51.100.2" }))).not.toBe(callerKey(headers));
  });
});

describe("createWindowLimiter", () => {
  it("refuses the hit after the limit until the window passes", () => {
    const limiter = createWindowLimiter(5, 1000);
    for (let i = 0; i < 5; i++) expect(limiter.hit("k", i)).toBe(false);
    expect(limiter.hit("k", 10)).toBe(true);
    expect(limiter.hit("other", 10)).toBe(false);
    expect(limiter.hit("k", 1005)).toBe(false);
  });
});
