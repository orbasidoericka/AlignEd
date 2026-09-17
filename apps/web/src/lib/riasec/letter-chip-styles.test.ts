import { describe, expect, it } from "vitest";

import { letterChip, letterChipStyles } from "./letter-chip-styles";
import type { RiasecLetter } from "./types";

const LETTERS: RiasecLetter[] = ["R", "I", "A", "S", "E", "C"];

describe("letter chips", () => {
  it("gives every letter its own fill", () => {
    const fills = LETTERS.map((letter) => letterChip(letter));
    expect(new Set(fills).size).toBe(LETTERS.length);
  });

  it("keeps dark text on the pastel fills", () => {
    for (const letter of LETTERS) {
      expect(letterChipStyles[letter]).toContain("text-trait-foreground");
    }
  });

  it("is keyed by letter, so a letter keeps its color in any position", () => {
    expect(letterChip("A")).toBe(letterChipStyles.A);
    expect(letterChip("A")).not.toBe(letterChip("S"));
  });
});
