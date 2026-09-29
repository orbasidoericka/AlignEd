import { describe, expect, it } from "vitest";

import {
  formatPasswordDate,
  resultsPdfPassword,
  resultsTakenOn,
} from "./password";

describe("results PDF password", () => {
  it("is the nickname followed by MMDDYYYY", () => {
    expect(resultsPdfPassword("MARI", new Date(2026, 8, 30))).toBe(
      "MARI09302026",
    );
  });

  it("pads single-digit months and days", () => {
    expect(formatPasswordDate(new Date(2026, 0, 5))).toBe("01052026");
  });

  it("keeps hyphens in the nickname, exactly as the student typed it", () => {
    expect(resultsPdfPassword("MARI-EL", new Date(2026, 11, 25))).toBe(
      "MARI-EL12252026",
    );
  });

  it("uses the student's local date, not UTC", () => {
    // Local midnight on 1 October: the UTC date may still be 30 September.
    const localMidnight = new Date(2026, 9, 1, 0, 30);
    expect(formatPasswordDate(localMidnight)).toBe("10012026");
  });
});

describe("resultsTakenOn", () => {
  it("prefers the completion date", () => {
    const date = resultsTakenOn(
      "2026-09-30T08:00:00.000Z",
      "2026-10-05T08:00:00.000Z",
    );
    expect(date.toISOString()).toBe("2026-09-30T08:00:00.000Z");
  });

  it("falls back to the last save for results saved before completedAt", () => {
    const date = resultsTakenOn(null, "2026-10-05T08:00:00.000Z");
    expect(date.toISOString()).toBe("2026-10-05T08:00:00.000Z");
  });

  it("falls back to today when nothing is stored or it is unreadable", () => {
    const before = Date.now();
    expect(resultsTakenOn(null, null).getTime()).toBeGreaterThanOrEqual(before);
    expect(resultsTakenOn("not a date", null).getTime()).toBeGreaterThanOrEqual(
      before,
    );
  });
});
