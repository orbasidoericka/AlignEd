// Copyright (c) 2026 EdTech. All rights reserved.

import Image from "next/image";
import { Crown } from "lucide-react";

import { letterWash } from "@/lib/riasec/letter-chip-styles";
import { traitForLetter } from "@/lib/riasec/scoring";
import type { RiasecLetter } from "@/lib/riasec/types";
import { cn } from "@/lib/utils";

// One character per RIASEC trait, so a student recognises who they are before
// reading a word. The files are named by trait, and traitForLetter already
// owns the letter -> trait mapping, so there is one source of truth for it.
//
// All six are exported onto the same 800x600 canvas with the transparent
// margin trimmed first, so every character fills the band to the same height
// instead of the tightly-cropped ones towering over the loosely-cropped ones.
const MASCOT_WIDTH = 800;
const MASCOT_HEIGHT = 600;

export function TraitMascot({
  letter,
  primary = false,
}: {
  letter: RiasecLetter;
  /** The first letter of the Holland code gets a taller, ringed band. */
  primary?: boolean;
}) {
  const trait = traitForLetter(letter);

  return (
    <div
      className={cn(
        // Bleeds to the card edges against BentoGridItem's p-5 / sm:p-6.
        "relative -mx-5 -mt-5 overflow-hidden rounded-t-[1.25rem] sm:-mx-6 sm:-mt-6",
        "flex items-end justify-center",
        // A full-bleed illustration per card is a lot of ink for decoration.
        "print:hidden",
        letterWash(letter),
        primary ? "h-36 sm:h-40" : "h-28 sm:h-32",
      )}
    >
      {primary && (
        // Stated in words, not only in size and color: a border and a taller
        // band tell a screen reader user nothing. The card ground rather than
        // a trait tint, so one badge reads over all six washes in both themes.
        <p
          className="absolute top-3 left-4 z-10 inline-flex items-center gap-1.5 rounded-full
                     bg-card/90 px-2.5 py-1 font-heading text-xs font-bold text-foreground
                     shadow-sm backdrop-blur-sm"
        >
          <Crown className="size-3.5 text-primary-strong" aria-hidden />
          Your top trait
        </p>
      )}
      <Image
        src={`/mascots/${trait}.webp`}
        // Decorative: the card's heading already names the trait, so a second
        // announcement would only repeat it.
        alt=""
        width={MASCOT_WIDTH}
        height={MASCOT_HEIGHT}
        sizes="(min-width: 768px) 33vw, 100vw"
        className={cn(
          "relative h-full w-auto object-contain",
          primary && "drop-shadow-sm",
        )}
      />
    </div>
  );
}
