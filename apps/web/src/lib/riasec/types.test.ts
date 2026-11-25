// Copyright (c) 2026 EdTech. All rights reserved.

import { describe, expect, it } from "vitest";

import {
  isValidAge,
  NICKNAME_MAX_LENGTH,
  sanitizeNickname,
  strandLabel,
} from "./types";

describe("isValidAge", () => {
  it("accepts Senior High ages from 15 to 30", () => {
    for (const age of ["15", "16", "17", "30"]) {
      expect(isValidAge(age)).toBe(true);
    }
  });

  it("rejects ages outside the range, blanks, and non-numbers", () => {
    for (const age of ["", "10", "14", "31", "1", "abc"]) {
      expect(isValidAge(age)).toBe(false);
    }
  });
});

describe("strandLabel", () => {
  it("prints the picked strand as is", () => {
    expect(strandLabel("Sports", "ignored")).toBe("Sports");
  });

  it("prints the typed text for Others, trimmed", () => {
    expect(strandLabel("Others", "  Cookery ")).toBe("Cookery");
  });

  it("is null when nothing is picked or Others has no text", () => {
    expect(strandLabel(null, "Cookery")).toBeNull();
    expect(strandLabel("Others", "   ")).toBeNull();
  });
});

describe("sanitizeNickname", () => {
  it("uppercases whatever is typed", () => {
    expect(sanitizeNickname("mari")).toBe("MARI");
  });

  it("keeps hyphens", () => {
    expect(sanitizeNickname("mari-el")).toBe("MARI-EL");
  });

  it("drops digits and other special characters", () => {
    expect(sanitizeNickname("m4r!_e l@")).toBe("MREL");
  });

  it("caps the length at the maximum", () => {
    expect(sanitizeNickname("abcdefghijkl")).toHaveLength(NICKNAME_MAX_LENGTH);
    expect(sanitizeNickname("abcdefghijkl")).toBe("ABCDEFGH");
  });

  it("returns an empty string when nothing valid is typed", () => {
    expect(sanitizeNickname("123 !!")).toBe("");
  });
});
