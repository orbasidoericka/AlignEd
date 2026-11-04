// Copyright (c) 2026 EdTech. All rights reserved.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// Every surface shadow must be one of the tokens in globals.css
// (shadow-chip, shadow-bento, shadow-bento-lifted, shadow-overlay,
// shadow-glow-*). The Tailwind defaults and arbitrary values drift per page.
const ROOTS = [join(process.cwd(), "src/components"), join(process.cwd(), "src/app")];
const BANNED = /(?<![\w-])(?:shadow-(?:sm|md|lg|xl|2xl)|drop-shadow-(?:sm|md|lg|xl|2xl)|shadow-\[)/;
// Internal, non-surface effects that are not elevation.
const ALLOW = ["src/components/magic/shimmer-button.tsx"];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(tsx?|css)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

describe("shadow tokens", () => {
  it("uses no ad-hoc shadow utilities", () => {
    const offenders = ROOTS.flatMap(walk)
      .filter((p) => !p.endsWith("globals.css"))
      .filter((p) => !ALLOW.some((a) => p.replaceAll("\\", "/").endsWith(a)))
      .filter((p) => BANNED.test(readFileSync(p, "utf8")));
    expect(offenders).toEqual([]);
  });
});
