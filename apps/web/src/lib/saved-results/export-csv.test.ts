import { describe, expect, it } from "vitest";

import { resultsToCsv } from "./export-csv";
import type { SavedResult } from "./repository";

const RESULT: SavedResult = {
  resultsId: "ALGN-7KQ2-MX9P",
  code: ["I", "R", "A"],
  scores: {
    realistic: 5,
    investigative: 7,
    artistic: 4,
    social: 1,
    enterprising: 2,
    conventional: 0,
  },
  maxScore: 7,
  gradeLevel: "11",
  strand: "Science, Technology, Engineering, and Mathematics (STEM)",
  age: 16,
  takenOn: "2026-10-01",
  createdAt: "2026-10-01T03:04:05.000Z",
};

describe("resultsToCsv", () => {
  const lines = resultsToCsv([
    RESULT,
    { ...RESULT, gradeLevel: null, strand: null, age: null },
  ])
    .replace(/^﻿/, "")
    .split("\r\n");

  it("starts with a byte order mark so Excel reads UTF-8", () => {
    expect(resultsToCsv([]).startsWith("﻿")).toBe(true);
  });

  it("writes a header and one row per result", () => {
    expect(lines[0]).toBe(
      "Results ID,Date taken,Saved at (UTC),Grade,Strand,Age,Holland code," +
        "Realistic (R),Investigative (I),Artistic (A),Social (S),Enterprising (E),Conventional (C)," +
        "Max score per area",
    );
    expect(lines[1]).toBe(
      'ALGN-7KQ2-MX9P,2026-10-01,2026-10-01T03:04:05.000Z,11,' +
        '"Science, Technology, Engineering, and Mathematics (STEM)",16,IRA,5,7,4,1,2,0,7',
    );
  });

  it("leaves missing grade, strand and age empty", () => {
    expect(lines[2]).toBe(
      "ALGN-7KQ2-MX9P,2026-10-01,2026-10-01T03:04:05.000Z,,,,IRA,5,7,4,1,2,0,7",
    );
  });
});
