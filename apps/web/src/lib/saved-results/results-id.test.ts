import { describe, expect, it } from "vitest";

import {
  generateResultsId,
  isResultsId,
  normalizeResultsId,
} from "./results-id";

describe("results ID", () => {
  it("generates well-formed, distinct IDs", () => {
    const ids = new Set(Array.from({ length: 500 }, generateResultsId));
    expect(ids.size).toBe(500);
    for (const id of ids) expect(isResultsId(id)).toBe(true);
  });

  it("never uses the lookalikes 0, O, 1 or I", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateResultsId().slice(5)).not.toMatch(/[01OI]/);
    }
  });

  it("reads what a student types, forgivingly", () => {
    expect(normalizeResultsId("ALGN-7KQ2-MX9P")).toBe("ALGN-7KQ2-MX9P");
    expect(normalizeResultsId(" algn 7kq2 mx9p ")).toBe("ALGN-7KQ2-MX9P");
    expect(normalizeResultsId("7kq2mx9p")).toBe("ALGN-7KQ2-MX9P");
  });

  it("rejects anything that cannot be an ID", () => {
    expect(normalizeResultsId("")).toBeNull();
    expect(normalizeResultsId("ALGN-7KQ2-MX9")).toBeNull();
    expect(normalizeResultsId("ALGN-0KQ2-MX9P")).toBeNull();
    expect(normalizeResultsId("../../etc")).toBeNull();
  });
});
