// Copyright (c) 2026 EdTech. All rights reserved.

import { HeroCta } from "@/components/journey/hero-cta";
import { BlurFade } from "@/components/magic/blur-fade";
import {
  HexagonPattern,
  scatterHexagons,
} from "@/components/magic/hexagon-pattern";
import { ShineBorder } from "@/components/magic/shine-border";
import { TraitEmblem } from "@/components/riasec/trait-emblem";
import { cn } from "@/lib/utils";

const LETTERS = ["R", "I", "A", "S", "E", "C"] as const;

// Closing CTA grid: the panel is a pale card, so the warm and green cells take
// the stage "-strong" tone at low alpha; blue stays the plain stage blue.
const ctaCells = scatterHexagons({
  count: 8,
  cols: 20,
  rows: 6,
  classNames: [
    "fill-stage-profile-strong/30",
    "fill-stage-assessment/30",
    "fill-stage-results-strong/30",
    "fill-stage-profile-strong/30",
  ],
  seed: 11,
});

// The closing invitation shared by the landing page and About Us, so the two
// can never drift: hexagon field, shine border, the six trait emblems, the
// question, and the journey-aware button.
export function ClosingCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      <BlurFade inView>
        <div className="relative isolate flex flex-col items-center gap-6 overflow-hidden rounded-4xl bg-card px-6 py-12 text-center sm:py-16">
          {/* Hexagon field fills the sides; the centre is masked clear so
              the text never sits on a lit cell. */}
          <HexagonPattern
            radius={32}
            gap={4}
            hexagons={ctaCells}
            className="-z-10 stroke-primary/30 mask-[radial-gradient(ellipse_at_center,transparent_30%,white_80%)] print:hidden dark:stroke-primary/15"
          />
          <ShineBorder borderWidth={2} duration={12} />
          {/* The six traits: the code the student is about to find. */}
          <div aria-hidden className="flex justify-center gap-1 sm:gap-2">
            {LETTERS.map((letter, index) => (
              <TraitEmblem
                key={letter}
                letter={letter}
                className={cn(
                  "size-11 sm:size-14",
                  index % 2 === 1 && "translate-y-2",
                )}
              />
            ))}
          </div>
          <h2 className="max-w-xl text-3xl font-bold text-foreground sm:text-4xl">
            Not sure what comes after Senior High?
          </h2>
          <p className="max-w-md text-lg text-balance text-muted-foreground">
            Answer at your own pace. There are no wrong answers, and nobody
            needs to know your name.
          </p>
          <HeroCta label="Find your path" />
        </div>
      </BlurFade>
    </section>
  );
}
