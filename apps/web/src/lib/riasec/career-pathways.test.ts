import { describe, expect, it } from "vitest";

import { pathwaysForCode, RIASEC_PATHWAYS } from "./career-pathways";
import type { RiasecLetter } from "./types";

const LETTERS: RiasecLetter[] = ["R", "I", "A", "S", "E", "C"];

describe("RIASEC_PATHWAYS", () => {
  it("covers all six letters with matching keys", () => {
    expect(Object.keys(RIASEC_PATHWAYS).sort()).toEqual([...LETTERS].sort());
    for (const letter of LETTERS) {
      expect(RIASEC_PATHWAYS[letter].letter).toBe(letter);
    }
  });

  it("keeps every major from the sheet (7 per letter)", () => {
    for (const letter of LETTERS) {
      expect(RIASEC_PATHWAYS[letter].majors).toHaveLength(7);
    }
  });

  it("keeps every related pathway from the sheet", () => {
    const counts = Object.fromEntries(
      LETTERS.map((l) => [l, RIASEC_PATHWAYS[l].relatedPathways.length]),
    );
    expect(counts).toEqual({ R: 4, I: 4, A: 2, S: 2, E: 3, C: 3 });
  });

  it("preserves the sheet's order at both ends of each list", () => {
    const ends = Object.fromEntries(
      LETTERS.map((l) => {
        const { majors, relatedPathways } = RIASEC_PATHWAYS[l];
        return [
          l,
          [majors[0], majors.at(-1), relatedPathways[0], relatedPathways.at(-1)],
        ];
      }),
    );
    expect(ends).toEqual({
      R: ["Agriculture", "Food and Hospitality", "Natural Resources", "Arts and Communication"],
      I: ["Marine Biology", "Psychology", "Health Services", "Industrial and Engineering Technology"],
      A: ["Communications", "Architecture", "Public and Human Services", "Arts and Communication"],
      S: ["Counseling", "Education", "Health Services", "Public and Human Services"],
      E: ["Fashion Merchandising", "Banking/Finance", "Business", "Arts and Communication"],
      C: ["Accounting", "Data Processing", "Health Services", "Industrial and Engineering Technology"],
    });
  });

  it("has no duplicate entries within a letter", () => {
    for (const letter of LETTERS) {
      const { majors, relatedPathways } = RIASEC_PATHWAYS[letter];
      expect(new Set(majors).size).toBe(majors.length);
      expect(new Set(relatedPathways).size).toBe(relatedPathways.length);
    }
  });

  it("carries the two corrected source typos", () => {
    expect(RIASEC_PATHWAYS.E.description).toContain("persuading and performing");
    expect(RIASEC_PATHWAYS.E.description).not.toContain("and and");
    expect(RIASEC_PATHWAYS.C.description).toContain("detail oriented, organized");
  });
});

describe("pathwaysForCode", () => {
  it("returns profiles in the code's order", () => {
    expect(pathwaysForCode(["S", "I", "A"]).map((p) => p.letter)).toEqual([
      "S",
      "I",
      "A",
    ]);
  });
});
