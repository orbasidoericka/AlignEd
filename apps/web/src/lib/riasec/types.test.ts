// Copyright (c) 2026 EdTech. All rights reserved.

import { describe, expect, it } from "vitest";

import { NICKNAME_MAX_LENGTH, sanitizeNickname } from "./types";

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
