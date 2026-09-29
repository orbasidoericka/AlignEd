import { describe, expect, it } from "vitest";

import type { RiasecLetter } from "@/lib/riasec/types";

import { CAREER_LOOKS } from "./looks";

const LETTERS: RiasecLetter[] = ["R", "I", "A", "S", "E", "C"];

describe("career looks", () => {
  it("has a look for every RIASEC letter, keyed by its own letter", () => {
    for (const letter of LETTERS) {
      expect(CAREER_LOOKS[letter].letter).toBe(letter);
    }
  });

  it("captions each look with the student's trait: 'You are Realistic'", () => {
    expect(CAREER_LOOKS.R.caption).toBe("You are Realistic");
    expect(CAREER_LOOKS.I.caption).toBe("You are Investigative");
    expect(CAREER_LOOKS.A.caption).toBe("You are Artistic");
    expect(CAREER_LOOKS.S.caption).toBe("You are Social");
    expect(CAREER_LOOKS.E.caption).toBe("You are Enterprising");
    expect(CAREER_LOOKS.C.caption).toBe("You are Conventional");
  });

  it("writes prop labels to follow 'try on' without doubling the article", () => {
    for (const letter of LETTERS) {
      expect(CAREER_LOOKS[letter].propsLabel).not.toMatch(/^(a|an) (a|an) /);
      expect(CAREER_LOOKS[letter].propsLabel).toBe(
        CAREER_LOOKS[letter].propsLabel.toLowerCase(),
      );
    }
  });
});
