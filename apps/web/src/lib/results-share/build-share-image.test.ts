// Copyright (c) 2026 EdTech. All rights reserved.

import { describe, expect, it } from "vitest";

import type { HollandCode } from "@/lib/riasec/scoring";

import { emblemMarkup, shareCardContent } from "./build-share-image";

const code: HollandCode = ["I", "A", "C"];

describe("emblemMarkup", () => {
  it("leaves no colour that depends on the page's CSS", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "size-16");
    svg.innerHTML = `<circle fill="currentColor"/><rect fill="var(--trait-foreground)"/><path fill="var(--trait-shade)"/>`;

    const markup = emblemMarkup(svg, {
      trait: "rgb(1, 2, 3)",
      ink: "rgb(4, 5, 6)",
      shade: "rgb(7, 8, 9)",
    });

    expect(markup).not.toMatch(/currentColor|var\(|class=/);
    for (const color of ["rgb(1, 2, 3)", "rgb(4, 5, 6)", "rgb(7, 8, 9)"]) {
      expect(markup).toContain(color);
    }
    expect(markup).toContain('width="252"');
  });
});

describe("shareCardContent", () => {
  it("states the code and its three trait labels", () => {
    const content = shareCardContent(code);
    expect(content.code).toBe("I-A-C");
    expect(content.traits).toEqual([
      { letter: "I", label: "The Thinker" },
      { letter: "A", label: "The Creator" },
      { letter: "C", label: "The Organizer" },
    ]);
  });

  it.each(["R", "I", "A", "S", "E", "C"] as const)(
    "publishes no scores or ranking words for %s",
    (first) => {
      const others = (["R", "I", "A"] as const).filter((l) => l !== first);
      const content = shareCardContent([first, others[0]!, others[1]!]);
      const text = [
        content.title,
        content.code,
        content.footer,
        ...content.traits.map((trait) => trait.label),
      ].join(" ");
      expect(text).not.toMatch(/\d|%|best|match|top|rank/i);
    },
  );
});
