// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useMemo } from "react";
import { Radar as RadarIcon } from "lucide-react";

import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { CareerLookDialog } from "@/components/career-look/career-look-dialog";
import { ResultsKeepsakeActions } from "@/components/journey/results-actions";
import { ResultsExpiryNote } from "@/components/journey/results-expiry-note";
import { SavedResultsPanel } from "@/components/journey/saved-results-panel";
import { BlurFade } from "@/components/magic/blur-fade";
import { HexagonPattern } from "@/components/magic/hexagon-pattern";
import { NumberTicker } from "@/components/magic/number-ticker";
import { ShineBorder } from "@/components/magic/shine-border";
import { PathwayResults } from "@/components/riasec/pathway-results";
import { RiasecRadar } from "@/components/riasec/riasec-radar";
import { Progress } from "@/components/ui/progress";
import { TraitEmblem } from "@/components/riasec/trait-emblem";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { PATHWAY_NAME_FIL } from "@/lib/riasec/career-pathways-fil";
import { letterChip } from "@/lib/riasec/letter-chip-styles";
import { QUESTIONS } from "@/lib/riasec/questions";
import { RESULTS_TEXT_FIL } from "@/lib/riasec/results-fil";
import {
  computeHollandCode,
  rankTraits,
  formatHollandCode,
  maxScorePerTrait,
  TRAIT_META,
  TRAIT_ORDER,
} from "@/lib/riasec/scoring";
import { useHydrated } from "@/hooks/use-hydrated";
import type { RiasecLetter } from "@/lib/riasec/types";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

const DISCLAIMER_EN =
  "The RIASEC assessment is designed solely to evaluate career interests; it does not measure a student’s skills, abilities, or academic aptitudes. Results provide general suggestions for potential career pathways based on current preferences and should not be interpreted as a definitive prediction of future employment or career success. This inventory is best used as an exploratory tool alongside skill evaluations, academic performance records, and career counseling.";

// Bento spans collapse in the printed PDF so it stays one column.
const printSingle = "print:col-span-1 print:row-span-1";

// Results dashboard (PRD FR-4 to FR-8) as an Aceternity bento grid.
// Everything is computed client-side from the store.
export function ResultsDashboard() {
  const scores = useAssessmentStore((state) => state.scores);
  const nickname = useAssessmentStore((state) => state.profile.nickname);
  const fil = useAssessmentStore((state) => state.language) === "fil";
  const t = RESULTS_TEXT_FIL;
  // The type's formal name (Realistic, Investigative, ...).
  const typeName = (letter: RiasecLetter) =>
    fil ? PATHWAY_NAME_FIL[letter] : RIASEC_PATHWAYS[letter].name;
  // JourneyGuard already withholds this whole subtree until the persisted
  // store has rehydrated, which is why `scores` above is safe. The greeting
  // keeps its own gate anyway: it is the one string a student would notice
  // being wrong, and this way the component is still correct if it is ever
  // rendered outside the guard.
  const hydrated = useHydrated();

  const code = useMemo(() => computeHollandCode(scores), [scores]);
  const otherLetters = useMemo(() => rankTraits(scores).slice(3), [scores]);
  const max = useMemo(() => maxScorePerTrait(QUESTIONS), []);

  return (
    <div className="flex flex-1 flex-col bg-background print:bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-2">
          {/* The page's only h1: the cards below are all h2. Before hydration
              (and for a profile with no nickname) it drops the name rather
              than the greeting, so the line never reads half-finished. */}
          <h1
            lang={fil ? "fil" : undefined}
            className="font-heading text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl"
          >
            {fil
              ? hydrated && nickname
                ? t.greeting(nickname)
                : t.greetingNoName
              : hydrated && nickname
                ? `Here are your results, ${nickname}!`
                : "Here are your results"}
          </h1>
          <ResultsExpiryNote />
        </div>

        <BentoGrid className="print:grid-cols-1">
          {/* Holland Code */}
          <BlurFade inView className={cn("md:col-span-3", printSingle)}>
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
              {/* Full width; from lg the emblems move to the right of the
                  text so the wide card is not half empty. Grid placement
                  only, so the reading order stays label, code, emblems,
                  actions. */}
              <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-8">
              <p
                lang={fil ? "fil" : undefined}
                className="text-sm font-semibold text-muted-foreground lg:col-start-1"
              >
                {fil ? t.hollandCodeLabel : "Your Holland Code"}
              </p>
              {/* h2, like every other bento cell: the page's h1 is the
                  greeting above the grid. */}
              <h2
                id="code-heading"
                lang={fil ? "fil" : undefined}
                className="-mt-2 text-3xl font-bold text-foreground sm:text-4xl lg:col-start-1 lg:text-5xl"
              >
                {fil ? t.youAre : "You are an"}{" "}
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
              <ul className="grid w-fit grid-cols-[repeat(3,1fr)] gap-x-1 min-[360px]:gap-x-2 min-[400px]:gap-x-3 sm:gap-x-5 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:mr-32 lg:gap-x-8">
                {code.map((letter) => (
                  <li
                    key={letter}
                    className="flex flex-col items-center gap-1.5 text-center"
                  >
                    <TraitEmblem
                      letter={letter}
                      className="size-16 sm:size-20 lg:size-24"
                    />
                    <span
                      lang={fil ? "fil" : undefined}
                      className="text-[0.6875rem] text-muted-foreground min-[360px]:text-xs min-[400px]:text-sm sm:text-base"
                    >
                      {typeName(letter)}
                    </span>
                  </li>
                ))}
              </ul>
              <div
                className="flex flex-wrap items-center gap-2 lg:col-start-1 print:hidden"
                data-print-hidden
              >
                <CareerLookDialog code={code} />
                <ResultsKeepsakeActions />
              </div>
              </div>
            </BentoGridItem>
          </BlurFade>

          {/* Scores: the radar and all six score bars in one full-width
              card. Graph and its key on the left, bars on the right from md. */}
          <BlurFade
            inView
            delay={0.06}
            className={cn("md:col-span-3", printSingle)}
          >
            <BentoGridItem
              headingId="radar-heading"
              title={
                fil ? <span lang="fil">{t.sixTraitsTitle}</span> : "Your six RIASEC types"
              }
              icon={
                <RadarIcon className="size-5 text-primary-strong" aria-hidden />
              }
              description={
                fil ? (
                  <span lang="fil">
                    {t.sixTraitsDescription(max)} {t.radarCodeNote}
                  </span>
                ) : (
                  `Scores out of ${max}. Colored bars are the three types in your code.`
                )
              }
              className="h-full"
            >
              <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-x-8">
                <RiasecRadar
                  scores={scores}
                  max={max}
                  className="mx-auto w-full max-w-72 md:row-span-2"
                />
                {/* How to read the graph, in words: the picture alone
                    confused readers. From md it sits under the bars, so both
                    columns end up about the same height. */}
                <div
                  lang={fil ? "fil" : undefined}
                  className="flex w-full flex-col gap-1 text-sm text-muted-foreground md:col-start-2 md:row-start-2 md:self-start"
                >
                  <p className="flex items-center gap-2 font-semibold text-foreground">
                    <span
                      aria-hidden
                      className="size-3.5 shrink-0 rounded-sm border-2 border-primary-strong bg-primary/40"
                    />
                    {fil ? t.radarKey : "Blue shape: your scores"}
                  </p>
                  <p>
                    {fil
                      ? t.radarHowTo(max)
                      : `The farther it reaches, the higher your score! The center means 0, and the outermost grid line means 7. Hover over or tap an icon to learn what each type means.`}
                  </p>
                </div>

                {/* All six scores as bars, in the radar's R to C order. The
                    three in the code wear their trait color; the rest stay
                    quiet so the code still reads first. Visual only: the
                    radar's sr-only table carries the data. */}
                <ul
                  className="flex flex-col gap-2.5 md:col-start-2 md:row-start-1 md:self-end"
                  aria-hidden
                >
                  {TRAIT_ORDER.map((trait) => {
                    const { letter } = TRAIT_META[trait];
                    const inCode = code.includes(letter);
                    const percent =
                      max > 0 ? Math.round((scores[trait] / max) * 100) : 0;
                    return (
                      <li key={trait} className="flex flex-col gap-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            lang={fil ? "fil" : undefined}
                            className={cn(
                              "font-heading text-sm",
                              inCode
                                ? "font-bold text-foreground"
                                : "font-semibold text-muted-foreground",
                            )}
                          >
                            {typeName(letter)}
                          </span>
                          <span
                            className={cn(
                              "font-heading text-sm font-semibold tabular-nums",
                              inCode
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            <NumberTicker value={scores[trait]} /> / {max}
                          </span>
                        </div>
                        {/* The pale trait fills need an edge to stand
                            out from the track. */}
                        <Progress
                          value={percent}
                          indicatorClassName={
                            inCode
                              ? cn(
                                  letterChip(letter),
                                  "inset-ring inset-ring-trait-foreground/45",
                                )
                              : "bg-muted-foreground/45"
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </BentoGridItem>
          </BlurFade>

          {/* No UI: mounting this is what saves the result row for admin
              stats (PRD FR-9, BACKEND.md), so it must stay on the page. */}
          <SavedResultsPanel />

          {/* Majors and related pathways for each code letter (official
              RIASEC sheet). Every item listed, no ranking or match labels. */}
          <BlurFade
            inView
            delay={0.1}
            className={cn("md:col-span-3", printSingle)}
          >
            <PathwayResults topThreeLetters={code} otherLetters={otherLetters} />
          </BlurFade>

          {/* Scope disclaimer, closing the results: it frames everything
              above as exploratory. */}
          <BlurFade
            inView
            delay={0.12}
            className={cn("md:col-span-3", printSingle)}
          >
            <section
              aria-labelledby="disclaimer-heading"
              lang={fil ? "fil" : undefined}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-bento sm:p-6 print:shadow-none"
            >
              <h2
                id="disclaimer-heading"
                className="font-heading text-lg font-bold text-foreground"
              >
                {fil ? t.disclaimerTitle : "Disclaimer"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {fil ? t.disclaimer : DISCLAIMER_EN}
              </p>
            </section>
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
