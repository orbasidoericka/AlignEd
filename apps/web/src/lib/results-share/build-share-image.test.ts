// Copyright (c) 2026 EdTech. All rights reserved.

import { describe, expect, it, vi } from "vitest";

import type { HollandCode } from "@/lib/riasec/scoring";

import {
  drawShareCard,
  emblemMarkup,
  shareCardContent,
  type SharePalette,
} from "./build-share-image";

const code: HollandCode = ["I", "A", "C"];

describe("drawShareCard", () => {
  const palette: SharePalette = {
    card: "#fff",
    foreground: "#000",
    muted: "#333",
    traitInk: "#000",
    traits: { R: "#111", I: "#222", A: "#333", S: "#444", E: "#555", C: "#666" },
  };
  const fonts = { heading: "serif", body: "serif" };
  const fakeContext = () =>
    ({
      fillRect: vi.fn(),
      fillText: vi.fn(),
      drawImage: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    }) as unknown as CanvasRenderingContext2D;

  it("draws the three emblems when the browser can load them", () => {
    const ctx = fakeContext();
    const emblems = [{}, {}, {}] as unknown as CanvasImageSource[];
    drawShareCard(ctx, shareCardContent(code), palette, fonts, emblems);
    expect(ctx.drawImage).toHaveBeenCalledTimes(3);
  });

  it("still draws a full card, with each letter, when they cannot load", () => {
    const ctx = fakeContext();
    drawShareCard(ctx, shareCardContent(code), palette, fonts, null);
    expect(ctx.drawImage).not.toHaveBeenCalled();
    const drawn = vi.mocked(ctx.fillText).mock.calls.map(([text]) => text);
    expect(drawn).toEqual(
      expect.arrayContaining(["I", "A", "C", "I-A-C", "The Organizer"]),
    );
  });
});

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
