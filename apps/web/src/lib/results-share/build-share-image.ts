// Copyright (c) 2026 EdTech. All rights reserved.

import {
  formatHollandCode,
  TRAIT_META,
  traitForLetter,
  type HollandCode,
} from "@/lib/riasec/scoring";
import { TRAIT_SHADE_KEEP } from "@/lib/riasec/letter-chip-styles";
import { TRAIT_LABEL_FIL } from "@/lib/riasec/results-fil";
import type { RiasecLetter } from "@/lib/riasec/types";
import type { QuestionLanguage } from "@/lib/riasec/questions";

// The picture behind "Share my results" (PRD FR-12). Drawn in the browser and
// never uploaded. The content below is the whole card, so anything added here
// is published by the student: no name, school, scores or ranking words.

export interface ShareCardContent {
  title: string;
  code: string;
  traits: { letter: RiasecLetter; label: string }[];
  footer: string;
}

export function shareCardContent(
  code: HollandCode,
  language: QuestionLanguage = "en",
): ShareCardContent {
  const fil = language === "fil";
  return {
    title: fil ? "Aking Holland Code" : "My Holland Code",
    code: formatHollandCode(code),
    traits: code.map((letter) => {
      const trait = traitForLetter(letter);
      return {
        letter,
        label: fil ? TRAIT_LABEL_FIL[trait] : TRAIT_META[trait].label,
      };
    }),
    footer: fil
      ? "AlignEd · mga interes sa karera ng RIASEC"
      : "AlignEd · RIASEC career interests",
  };
}

export interface SharePalette {
  card: string;
  foreground: string;
  muted: string;
  traitInk: string;
  traits: Record<RiasecLetter, string>;
}

export interface ShareFonts {
  heading: string;
  body: string;
}

const SIZE = 1080;
const BADGE_CENTERS = [220, 540, 860];
// The emblem's own viewBox is 448x534.
const BADGE_WIDTH = 252;
const BADGE_HEIGHT = 300;

// A canvas cannot resolve var(), so the tokens are read off the root element.
// The card therefore follows whichever theme the student is using.
function readSharePalette(root: CSSStyleDeclaration): SharePalette {
  const token = (name: string) => root.getPropertyValue(name).trim();
  return {
    card: token("--card"),
    foreground: token("--foreground"),
    muted: token("--muted-foreground"),
    traitInk: token("--trait-foreground"),
    traits: {
      R: token("--trait-r"),
      I: token("--trait-i"),
      A: token("--trait-a"),
      S: token("--trait-s"),
      E: token("--trait-e"),
      C: token("--trait-c"),
    },
  };
}

// An SVG loaded as an image is cut off from the page's CSS, so every colour
// the emblem takes from it has to be written in as a plain value first.
export function emblemMarkup(
  svg: SVGSVGElement,
  colors: { trait: string; ink: string; shade: string },
): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("class");
  clone.removeAttribute("style");
  clone.setAttribute("width", String(BADGE_WIDTH));
  clone.setAttribute("height", String(BADGE_HEIGHT));
  return new XMLSerializer()
    .serializeToString(clone)
    .replaceAll("currentColor", colors.trait)
    .replaceAll("var(--trait-foreground)", colors.ink)
    .replaceAll("var(--trait-shade)", colors.shade);
}

// The emblem's darker rim: the same mix as letterArtStyle, resolved to rgb so
// it survives being written into a standalone SVG.
function traitShade(trait: string, ink: string, keep: number): string {
  const probe = document.createElement("span");
  probe.style.color = `color-mix(in oklab, ${trait} ${keep}%, ${ink})`;
  document.body.append(probe);
  const mixed = getComputedStyle(probe).color;
  probe.remove();

  const pixel = document.createElement("canvas");
  pixel.width = 1;
  pixel.height = 1;
  const ctx = pixel.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.fillStyle = mixed;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

async function loadEmblem(markup: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  await image.decode();
  return image;
}

export function drawShareCard(
  ctx: CanvasRenderingContext2D,
  content: ShareCardContent,
  palette: SharePalette,
  fonts: ShareFonts,
  emblems: readonly CanvasImageSource[],
) {
  ctx.fillStyle = palette.card;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = palette.foreground;
  ctx.font = `600 56px ${fonts.heading}`;
  ctx.fillText(content.title, SIZE / 2, 150);
  ctx.font = `800 168px ${fonts.heading}`;
  ctx.fillText(content.code, SIZE / 2, 310);

  content.traits.forEach(({ label }, index) => {
    const x = BADGE_CENTERS[index]!;
    ctx.drawImage(
      emblems[index]!,
      x - BADGE_WIDTH / 2,
      435,
      BADGE_WIDTH,
      BADGE_HEIGHT,
    );

    ctx.fillStyle = palette.foreground;
    ctx.font = `700 42px ${fonts.heading}`;
    ctx.fillText(label, x, 800);
  });

  ctx.fillStyle = palette.muted;
  ctx.font = `600 36px ${fonts.body}`;
  ctx.fillText(content.footer, SIZE / 2, 960);
}

// `badges` are the rendered TraitEmblem SVGs, one per code letter, in order.
export async function buildShareImage(
  code: HollandCode,
  badges: readonly SVGSVGElement[],
  language: QuestionLanguage = "en",
): Promise<File> {
  const root = getComputedStyle(document.documentElement);
  const fonts: ShareFonts = {
    heading: root.getPropertyValue("--font-heading").trim(),
    body: root.getPropertyValue("--font-sans").trim(),
  };
  // A canvas does not wait for a web font: drawing before it has loaded
  // silently uses the fallback.
  await Promise.all([
    document.fonts.load(`800 168px ${fonts.heading}`),
    document.fonts.load(`700 42px ${fonts.heading}`),
    document.fonts.load(`600 56px ${fonts.heading}`),
    document.fonts.load(`600 36px ${fonts.body}`),
  ]);

  const palette = readSharePalette(root);
  const emblems = await Promise.all(
    code.map((letter, index) => {
      const trait = palette.traits[letter];
      const ink = palette.traitInk;
      return loadEmblem(
        emblemMarkup(badges[index]!, {
          trait,
          ink,
          shade: traitShade(trait, ink, TRAIT_SHADE_KEEP[letter]),
        }),
      );
    }),
  );

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");
  drawShareCard(ctx, shareCardContent(code, language), palette, fonts, emblems);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("The image could not be encoded.");
  return new File([blob], "aligned-holland-code.png", { type: "image/png" });
}
