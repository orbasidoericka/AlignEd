import { describe, expect, it } from "vitest";

import { resultsPdfPassword, resultsTakenOn } from "./password";

describe("results PDF password", () => {
  it("is the nickname followed by the RIASEC code", () => {
    expect(resultsPdfPassword("MARI", ["I", "R", "A"])).toBe("MARIIRA");
  });

  it("keeps the code's letter order", () => {
    expect(resultsPdfPassword("JUAN", ["S", "E", "C"])).toBe("JUANSEC");
  });

  it("keeps hyphens in the nickname, exactly as the student typed it", () => {
    expect(resultsPdfPassword("MARI-EL", ["A", "S", "E"])).toBe("MARI-ELASE");
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
