import { describe, expect, it } from "vitest";

import {
  letterBorder,
  letterBorderStyles,
  letterChip,
  letterChipStyles,
  letterWash,
  letterWashStyles,
} from "./letter-chip-styles";
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

  it("gives every letter its own wash, matching its fill hue", () => {
    const washes = LETTERS.map((letter) => letterWash(letter));
    expect(new Set(washes).size).toBe(LETTERS.length);
    for (const letter of LETTERS) {
      // Same token as the fill, only softened: the wash sits behind artwork.
      expect(letterWashStyles[letter]).toContain(
        `bg-trait-${letter.toLowerCase()}/`,
      );
      expect(letterWashStyles[letter]).not.toContain("text-");
    }
  });

  it("gives every letter its own border, matching its fill hue", () => {
    const borders = LETTERS.map((letter) => letterBorder(letter));
    expect(new Set(borders).size).toBe(LETTERS.length);
    for (const letter of LETTERS) {
      expect(letterBorderStyles[letter]).toBe(
        `border-trait-${letter.toLowerCase()}`,
      );
    }
  });
});
