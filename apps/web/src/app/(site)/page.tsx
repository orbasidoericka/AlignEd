// Copyright (c) 2026 EdTech. All rights reserved.

import type { Metadata } from "next";
import { ClipboardPen, Compass, PartyPopper } from "lucide-react";

import { EncryptedText } from "@/components/aceternity/encrypted-text";
import { FloatingDock } from "@/components/aceternity/floating-dock";
import { BlurFade } from "@/components/magic/blur-fade";
import { Highlighter } from "@/components/magic/highlighter";
import {
  HexagonPattern,
  scatterHexagons,
} from "@/components/magic/hexagon-pattern";
import { ShineBorder } from "@/components/magic/shine-border";
import { HeroCta } from "@/components/journey/hero-cta";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { letterHoverWash } from "@/lib/riasec/letter-chip-styles";
import { TraitEmblem } from "@/components/riasec/trait-emblem";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  description:
    "Free, anonymous career guidance for Senior High School students. Discover your Holland Code and matching careers in about 5 minutes.",
};

const listFormat = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

// The six letters, with the first sentence of each official description and
// the majors and pathways that letter leads to (single source of truth:
// lib/riasec/career-pathways.ts). Chip colors come from the shared per-letter
// map, so they match the results page.
//
// Prose rather than tags or pills: six letters times seven majors would be
// far too many chips for a landing page, and the results page is where the
// full tagged lists belong.
const traitPreview = (["R", "I", "A", "S", "E", "C"] as const).map((letter) => {
  const profile = RIASEC_PATHWAYS[letter];
  return {
    letter,
    name: profile.name,
    // "These people are often good at mechanical or athletic jobs."
    summary: `${profile.description.split(". ")[0]}.`,
    majors: `Good college majors for ${profile.name} people are ${listFormat.format(profile.majors)}.`,
    pathways: `These majors lead into the ${listFormat.format(profile.relatedPathways)} career pathways.`,
  };
});

const traitAnchor = (letter: string) => `trait-${letter.toLowerCase()}`;

const traitDockItems = traitPreview.map((trait) => ({
  title: trait.name,
  href: `#${traitAnchor(trait.letter)}`,
  icon: <TraitEmblem letter={trait.letter} className="size-full" />,
}));

const HERO_SUBTITLE =
  "Answer 42 quick yes-or-no statements to discover your Holland Code, and the careers and college programs that match you. About 5 minutes, free, no sign-up.";

// One shared accent (not a per-stage color) — this strip previews the whole
// journey as a single path rather than wayfinding between stages, so it
// deliberately steps outside the stage-accent system that colors the actual
// screens. See DESIGN.md "How it works".
const journeySteps = [
  {
    title: "Tell us where you are",
    body: "Your grade level. One tap, no name, no sign-up.",
    icon: ClipboardPen,
  },
  {
    title: "Discover yourself",
    body: "Answer yes or no to 42 quick statements. About 5 minutes, saved as you go.",
    icon: Compass,
  },
  {
    title: "See your alignment",
    body: "Your Holland Code, and the careers and programs that match you.",
    icon: PartyPopper,
  },
] as const;

// Lit cells in the full-strength palette. Yellow takes half the slots: it is
// the palette's loudest note and the CTA colour, so the field leans warm and
// the blue grid lines do not swallow it. Dark keeps the yellow a touch dimmer
// so it glows rather than glares.
const heroYellowCell = "fill-stage-profile dark:fill-stage-profile/60";
const heroGreenCell = "fill-stage-results";

// Lit cells scattered across the hero grid (about 20 x 10 cells at desktop
// width); computed once at module load, identical on server and client.
const heroCells = scatterHexagons({
  count: 16,
  cols: 20,
  rows: 10,
  classNames: [
    heroYellowCell,
    "fill-stage-assessment",
    heroYellowCell,
    heroGreenCell,
  ],
  seed: 7,
});

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero: static hexagon field (the RIASEC hexagon) whose lit cells
          breathe in and out at random. The mask is vertical only: a radial
          circle left the grid stopping short of the viewport edges on wide
          screens, and cut it off flat where the section ends. Fading down
          the last third instead means the field dissolves into the next
          section rather than meeting it at a line. */}
      <section className="relative isolate overflow-hidden">
        <HexagonPattern
          radius={40}
          gap={4}
          hexagons={heroCells}
          className="-z-10 stroke-primary/50 mask-[linear-gradient(to_bottom,white,white_55%,transparent_96%)] print:hidden dark:stroke-primary/25"
        />

        <div className="mx-auto flex min-h-[min(72svh,40rem)] w-full max-w-4xl flex-col items-center justify-center px-4 pt-14 pb-24 text-center sm:pt-20">
          <BlurFade delay={0.08}>
            {/* "Align" glows in the headline's own ink; then two hand-drawn
                marks, one after the other: the marker sweeps "passion", then
                the line underscores "profession". */}
            <h1 className="text-5xl leading-[1.22] font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl">
              <span className="text-glow motion-safe:animate-glow-breathe">
                Align
              </span>{" "}
              your{" "}
              <Highlighter
                color="#ffc000"
                darkColor="#8a6a12"
                padding={10}
                strokeWidth={3}
                iterations={2}
                animationDuration={2200}
                delay={700}
              >
                passion
              </Highlighter>{" "}
              with your{" "}
              <Highlighter
                action="underline"
                color="#2192ff"
                darkColor="#b4cae3"
                padding={8}
                strokeWidth={6}
                iterations={2}
                animationDuration={1600}
                delay={2600}
              >
                profession
              </Highlighter>
            </h1>
          </BlurFade>

          <BlurFade delay={0.16}>
            {/* ~20ms a character: the source's 50ms would take ~8s on a
                sentence this long. */}
            <p className="mx-auto mt-6 max-w-xl text-lg text-balance text-muted-foreground sm:text-xl">
              <EncryptedText
                text={HERO_SUBTITLE}
                revealDelayMs={20}
                flipDelayMs={50}
                encryptedClassName="text-primary-strong/70"
              />
            </p>
          </BlurFade>

          {/* The six traits as the hero's image: the code the student is
              about to find, in the same emblems the results page uses. A
              dock: each emblem magnifies under the pointer and jumps to its
              row in "Six traits, one code". The journey's call to action
              lives in the navbar directly above. */}
          <BlurFade delay={0.32} className="mt-12 md:mt-4">
            <FloatingDock label="The six traits" items={traitDockItems} />
          </BlurFade>
        </div>
      </section>

      {/* How it works: one card per journey stage, color-committed */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6"
      >
        <BlurFade inView>
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Three steps to a clearer path
          </h2>
        </BlurFade>

        <ol className="relative mt-14 flex flex-col gap-6 md:flex-row md:items-stretch">
          {journeySteps.map((item, index) => (
            <BlurFade
              key={item.title}
              inView
              delay={index * 0.1}
              className="flex-1"
            >
              <li className="relative isolate flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-stage-assessment/15 bg-stage-assessment-soft p-7 shadow-bento transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-bento-lifted motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                {/* Ghost numeral: a real 3-step sequence earns a number, so
                    it's graphic here rather than a tiny muted label. Purely
                    decorative — the step is already named in words below. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-3 right-6 -z-10 font-heading text-[6rem] leading-none font-extrabold text-stage-assessment/15 select-none"
                >
                  {index + 1}
                </span>
                <span
                  aria-hidden
                  className="flex size-14 items-center justify-center bg-stage-assessment text-stage-assessment-foreground [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]"
                >
                  <item.icon className="size-6" />
                </span>
                <span className="font-heading text-sm font-bold tracking-wide text-stage-assessment-strong">
                  Step {index + 1}
                </span>
                <h3 className="text-xl font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="text-base text-foreground/80">{item.body}</p>
              </li>
            </BlurFade>
          ))}
        </ol>
      </section>

      {/* The six traits: a legend, deliberately not another card grid */}
      <section
        id="six-traits"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6"
      >
        <BlurFade inView>
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Six traits, one code
          </h2>
        </BlurFade>

        <BlurFade inView delay={0.08} className="mt-8">
          <dl className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-bento sm:grid-cols-2">
            {traitPreview.map((trait, index) => (
              <div
                key={trait.letter}
                id={traitAnchor(trait.letter)}
                className={cn(
                  // Target of the hero dock; clears the sticky header.
                  "scroll-mt-28 outline-none",
                  // Name above its details rather than beside them: the
                  // majors run long enough that a fixed name column would
                  // both crowd them and leave a tall void under the name.
                  // Each row warms to its own trait color on hover/focus —
                  // the same six tokens the emblem already carries, so the
                  // legend feels alive without turning into six more cards.
                  "group flex flex-col gap-3 border-border p-6 transition-colors duration-300",
                  letterHoverWash(trait.letter),
                  index < traitPreview.length - 1 && "border-b",
                  // Two columns: the left one keeps a divider, and the last
                  // row of each column drops its bottom border.
                  "sm:even:border-l",
                  index >= traitPreview.length - 2 && "sm:border-b-0",
                )}
              >
                <dt className="flex items-center gap-3">
                  <TraitEmblem
                    letter={trait.letter}
                    className="size-10 transition-transform duration-300 group-hover:scale-110"
                  />
                  <span className="font-heading text-lg font-bold text-foreground">
                    {trait.name}
                  </span>
                </dt>
                <dd className="flex flex-col gap-2">
                  <p className="text-base text-pretty text-muted-foreground">
                    {trait.summary}
                  </p>
                  <p className="text-base text-pretty text-muted-foreground">
                    {trait.majors} {trait.pathways}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </BlurFade>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <BlurFade inView>
          <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-4xl bg-stage-profile-soft px-6 py-14 text-center">
            {/* The one place on the landing page that gets a shine: the
                closing invitation. */}
            <ShineBorder borderWidth={2} duration={12} />
            <h2 className="max-w-xl text-3xl font-bold text-foreground sm:text-4xl">
              Ready to find your path?
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {["Free to use", "No sign-up needed", "About 5 minutes"].map(
                (badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-stage-profile/40 bg-card px-4 py-1.5 text-sm font-semibold text-foreground"
                  >
                    {badge}
                  </span>
                ),
              )}
            </div>
            <HeroCta label="Find your path" />
          </div>
        </BlurFade>
      </section>
    </div>
  );
}
