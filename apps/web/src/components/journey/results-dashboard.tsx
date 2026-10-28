// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useMemo } from "react";
import { Radar as RadarIcon } from "lucide-react";

import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { CareerLookDialog } from "@/components/career-look/career-look-dialog";
import { ResultsKeepsakeActions } from "@/components/journey/results-actions";
import { BlurFade } from "@/components/magic/blur-fade";
import { HexagonPattern } from "@/components/magic/hexagon-pattern";
import { NumberTicker } from "@/components/magic/number-ticker";
import { ShineBorder } from "@/components/magic/shine-border";
import { PathwayResults } from "@/components/riasec/pathway-results";
import { RiasecRadar } from "@/components/riasec/riasec-radar";
import { Progress } from "@/components/ui/progress";
import { TraitEmblem } from "@/components/riasec/trait-emblem";
import { letterChip } from "@/lib/riasec/letter-chip-styles";
import { QUESTIONS } from "@/lib/riasec/questions";
import {
  computeHollandCode,
  formatHollandCode,
  maxScorePerTrait,
  TRAIT_META,
  TRAIT_ORDER,
  traitForLetter,
} from "@/lib/riasec/scoring";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

// Bento spans collapse in the printed PDF so it stays one column.
const printSingle = "print:col-span-1 print:row-span-1";

// Results dashboard (PRD FR-4 to FR-8) as an Aceternity bento grid.
// Everything is computed client-side from the store.
export function ResultsDashboard() {
  const scores = useAssessmentStore((state) => state.scores);
  const nickname = useAssessmentStore((state) => state.profile.nickname);
  // JourneyGuard already withholds this whole subtree until the persisted
  // store has rehydrated, which is why `scores` above is safe. The greeting
  // keeps its own gate anyway: it is the one string a student would notice
  // being wrong, and this way the component is still correct if it is ever
  // rendered outside the guard.
  const hydrated = useHydrated();

  const code = useMemo(() => computeHollandCode(scores), [scores]);
  const max = useMemo(() => maxScorePerTrait(QUESTIONS), []);

  return (
    <div className="flex flex-1 flex-col bg-background print:bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-2">
          <p
            className="font-heading text-sm font-bold text-primary-strong print:hidden"
            data-print-hidden
          >
            Step 3 of 3 · Your results
          </p>
          {/* The page's only h1: the cards below are all h2. Before hydration
              (and for a profile with no nickname) it drops the name rather
              than the greeting, so the line never reads half-finished. */}
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
            {hydrated && nickname
              ? `Here are your results, ${nickname}!`
              : "Here are your results"}
          </h1>
        </div>

        <BentoGrid className="print:grid-cols-1">
          {/* Holland Code */}
          <BlurFade inView className={cn("md:col-span-2", printSingle)}>
            <BentoGridItem
              headingId="code-heading"
              // Blue into yellow, with the card's own white as the middle
              // stop: those two hues blend to green wherever they meet
              // directly, so `via-card` is doing real work here, not spacing.
              // /40 keeps the "Your Holland Code" label at 5.52:1 on the blue
              // end; past /55 it drops under AA.
              className="relative isolate h-full justify-center overflow-hidden bg-linear-to-br from-primary/40 via-card to-highlight/60"
            >
              {/* The code is the payoff of the whole journey: a slow shine
                  traces this card and nothing else on the page. One hue at
                  three depths rather than three trait colors: the shine sweeps
                  the full perimeter, so any two stops that are not neighbours
                  blend somewhere along the way, and blue against the trait
                  green turned the frame's top edge green. */}
              <ShineBorder
                borderWidth={2}
                duration={12}
                shineColor={[
                  "var(--primary-spark)",
                  "var(--primary)",
                  "var(--primary-strong)",
                ]}
                className="z-0"
              />
              {/* Mirrored so column 0 hugs the right edge at every width;
                  the mask flips with it and fades toward the text. */}
              <HexagonPattern
                radius={28}
                gap={3}
                // Blue cells with one yellow, matching the wash they sit on;
                // the green and lime cells read as a third hue the card no
                // longer uses.
                hexagons={[
                  [0, 1, "fill-primary/70"],
                  [1, 2, "fill-primary/35"],
                  [2, 1, "fill-highlight"],
                  [1, 0, "fill-primary/20"],
                ]}
                className="-z-10 -scale-x-100 stroke-primary/40 mask-[linear-gradient(to_right,white,transparent_75%)] print:hidden dark:stroke-primary/20"
              />
              <p className="text-sm font-semibold text-muted-foreground">
                Your Holland Code
              </p>
              {/* h2, like every other bento cell: the page's h1 is the
                  greeting above the grid. */}
              <h2
                id="code-heading"
                className="-mt-2 text-3xl font-bold text-foreground sm:text-4xl"
              >
                You are an{" "}
                <span className="whitespace-nowrap">
                  {formatHollandCode(code)}
                </span>
              </h2>
              {/* The code spelled as emblems, each centered over its own
                  name in equal-width columns. The emblems are decorative (the
                  h2 says the letters); the names stay readable. */}
              {/* Plain 1fr (not Tailwind's minmax(0,1fr)): under w-fit, only
                  an auto minimum makes the three columns share the widest
                  name's width. */}
              <ul className="grid w-fit grid-cols-[repeat(3,1fr)] gap-x-3 sm:gap-x-5">
                {code.map((letter) => (
                  <li
                    key={letter}
                    className="flex flex-col items-center gap-1.5 text-center"
                  >
                    <TraitEmblem letter={letter} className="size-16 sm:size-20" />
                    <span className="text-sm text-muted-foreground sm:text-base">
                      {TRAIT_META[traitForLetter(letter)].label}
                    </span>
                  </li>
                ))}
              </ul>
              <div
                className="flex flex-wrap items-center gap-2 print:hidden"
                data-print-hidden
              >
                <CareerLookDialog code={code} />
                <ResultsKeepsakeActions />
              </div>
            </BentoGridItem>
          </BlurFade>

          {/* Six-trait radar */}
          <BlurFade
            inView
            delay={0.06}
            className={cn("md:row-span-2", printSingle)}
          >
            <BentoGridItem
              headingId="radar-heading"
              title="Your six traits"
              icon={
                <RadarIcon className="size-5 text-primary-strong" aria-hidden />
              }
              description={`Scores out of ${max} for each RIASEC trait.`}
              className="h-full"
            >
              <RiasecRadar scores={scores} max={max} className="my-auto" />
              {/* Visual legend; the radar's sr-only table carries the data. */}
              <ul className="grid grid-cols-3 gap-2" aria-hidden>
                {TRAIT_ORDER.map((trait) => {
                  const { letter } = TRAIT_META[trait];
                  const inCode = code.includes(letter);
                  return (
                    <li
                      key={trait}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 font-heading text-sm font-semibold",
                        // Letters in the code carry their own color; the rest
                        // stay quiet so the code still reads first.
                        inCode
                          ? letterChip(letter)
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <span>{letter}</span>
                      <span className="tabular-nums">{scores[trait]}</span>
                    </li>
                  );
                })}
              </ul>
            </BentoGridItem>
          </BlurFade>

          {/* Top-three trait breakdown */}
          <BlurFade
            inView
            delay={0.1}
            className={cn("md:col-span-2", printSingle)}
          >
            <BentoGridItem
              headingId="traits-heading"
              title="What your code means"
              className="h-full"
            >
              <ul className="flex flex-col gap-5">
                {code.map((letter) => {
                  const trait = traitForLetter(letter);
                  const percent =
                    max > 0 ? Math.round((scores[trait] / max) * 100) : 0;
                  return (
                    <li key={letter} className="flex flex-col gap-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-heading text-base font-bold text-foreground">
                          {letter}: {TRAIT_META[trait].label}
                        </h3>
                        <span className="font-heading text-sm font-semibold text-primary-strong tabular-nums">
                          <NumberTicker value={scores[trait]} /> / {max}
                        </span>
                      </div>
                      <Progress
                        value={percent}
                        aria-label={`${TRAIT_META[trait].label}: ${scores[trait]} out of ${max}`}
                      />
                    </li>
                  );
                })}
              </ul>
            </BentoGridItem>
          </BlurFade>

          {/* Majors and related pathways for each code letter (official
              RIASEC sheet). Every item listed, no ranking or match labels. */}
          <BlurFade
            inView
            delay={0.14}
            className={cn("md:col-span-3", printSingle)}
          >
            <PathwayResults topThreeLetters={code} />
          </BlurFade>
        </BentoGrid>

        <p className="hidden text-center text-xs text-muted-foreground print:block">
          AlignEd results · generated {new Date().toLocaleDateString("en-PH")} ·
          aligned.example
        </p>
      </div>
    </div>
  );
}
