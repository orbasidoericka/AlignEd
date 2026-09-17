// Copyright (c) 2026 EdTech. All rights reserved.

import type { Metadata } from "next";
import { ClipboardPen, Compass, PartyPopper, ShieldCheck } from "lucide-react";

import { BlurFade } from "@/components/magic/blur-fade";
import { Highlighter } from "@/components/magic/highlighter";
import {
  HexagonPattern,
  scatterHexagons,
} from "@/components/magic/hexagon-pattern";
import { NumberTicker } from "@/components/magic/number-ticker";
import { ShineBorder } from "@/components/magic/shine-border";
import { SectionLink } from "@/components/blocks/section-link";
import { HeroCta } from "@/components/journey/hero-cta";
import { buttonVariants } from "@/components/ui/button";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { letterChip } from "@/lib/riasec/letter-chip-styles";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  description:
    "Free, anonymous career guidance for Senior High School students. Discover your Holland Code and matching careers in about 5 minutes.",
};

// The six letters, with the first sentence of each official description
// (single source of truth: lib/riasec/career-pathways.ts). Chip colors come
// from the shared per-letter map, so they match the results page.
const traitPreview = (["R", "I", "A", "S", "E", "C"] as const).map((letter) => {
  const profile = RIASEC_PATHWAYS[letter];
  return {
    letter,
    name: profile.name,
    // "These people are often good at mechanical or athletic jobs."
    summary: `${profile.description.split(". ")[0]}.`,
    chip: letterChip(letter),
  };
});

const journeySteps = [
  {
    step: "Step 1",
    title: "Tell us where you are",
    body: "Your grade level. One tap, no name, no sign-up.",
    icon: ClipboardPen,
    wash: "bg-stage-profile-soft",
    chip: "bg-stage-profile text-stage-profile-foreground",
    heading: "text-stage-profile-strong",
  },
  {
    step: "Step 2",
    title: "Discover yourself",
    body: "Answer yes or no to 42 quick statements. About 5 minutes, saved as you go.",
    icon: Compass,
    wash: "bg-stage-assessment-soft",
    chip: "bg-stage-assessment text-stage-assessment-foreground",
    heading: "text-stage-assessment-strong",
  },
  {
    step: "Step 3",
    title: "See your alignment",
    body: "Your Holland Code, and the careers and programs that match you.",
    icon: PartyPopper,
    wash: "bg-stage-results-soft",
    chip: "bg-stage-results text-stage-results-foreground",
    heading: "text-stage-results-strong",
  },
] as const;

// Pale yellow and sage vanish on the near-white hero, so light mode tints
// those cells with their strong tones; dark mode uses the pastel bases.
const heroYellowCell = "fill-stage-profile-strong/30 dark:fill-stage-profile/60";
const heroGreenCell = "fill-stage-results-strong/35 dark:fill-stage-results";

// Lit cells scattered across the hero grid (about 20 x 10 cells at desktop
// width); computed once at module load, identical on server and client.
const heroCells = scatterHexagons({
  count: 16,
  cols: 20,
  rows: 10,
  classNames: ["fill-stage-assessment", heroGreenCell, heroYellowCell],
  seed: 7,
});

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero: static hexagon field (the RIASEC hexagon) whose lit cells
          breathe in and out at random, masked to fade toward the edges */}
      <section className="relative isolate overflow-hidden">
        <HexagonPattern
          radius={40}
          gap={4}
          hexagons={heroCells}
          className="-z-10 stroke-primary/50 mask-[radial-gradient(720px_circle_at_center,white,transparent)] print:hidden dark:stroke-primary/25"
        />

        <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 pt-16 pb-20 text-center sm:pt-24">
          <BlurFade delay={0.08}>
            {/* Two hand-drawn marks, drawn one after the other: the marker
                sweeps "passion", then the line underscores "profession". */}
            <h1 className="text-5xl leading-[1.22] font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl">
              Align your{" "}
              <Highlighter
                color="#f5c749"
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
                color="#3f5f82"
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
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Take a short personality assessment and get your Holland Code,
              plus the careers and college programs that match who you are.
            </p>
          </BlurFade>

          <BlurFade
            delay={0.24}
            className="mt-8 flex flex-col items-center gap-3"
          >
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <HeroCta />
              <SectionLink
                href="/#how-it-works"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-13 rounded-full px-7 text-lg font-semibold",
                )}
              >
                See how it works
              </SectionLink>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Takes about 5 minutes. Free, anonymous, no sign-up.
            </p>
          </BlurFade>

          {/* Colorful stats */}
          <BlurFade delay={0.32} className="mt-14 w-full">
            <dl className="mx-auto grid w-full max-w-md grid-cols-2 gap-4">
              <div className="flex flex-col items-center gap-1">
                <dd className="font-heading text-5xl font-extrabold text-stage-assessment-strong">
                  <NumberTicker value={40} />+
                </dd>
                <dt className="text-sm font-semibold text-muted-foreground">
                  careers mapped
                </dt>
              </div>
              <div className="flex flex-col items-center gap-1">
                <dd className="font-heading text-5xl font-extrabold text-stage-results-strong">
                  <NumberTicker value={6} />
                </dd>
                <dt className="text-sm font-semibold text-muted-foreground">
                  personality traits
                </dt>
              </div>
            </dl>
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
          <p className="mx-auto mt-3 max-w-lg text-center text-base text-muted-foreground">
            The whole journey happens in one sitting, and your progress is
            saved on your device the entire time.
          </p>
        </BlurFade>

        <ol className="relative mt-12 flex flex-col gap-6 md:flex-row md:items-stretch">
          {journeySteps.map((item, index) => (
            <BlurFade
              key={item.title}
              inView
              delay={index * 0.1}
              className="flex-1"
            >
              <li
                className={cn(
                  "flex h-full flex-col gap-4 rounded-3xl p-7",
                  item.wash,
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl",
                      item.chip,
                    )}
                  >
                    <item.icon className="size-6" aria-hidden />
                  </span>
                  <span className="font-heading text-sm font-bold text-muted-foreground">
                    {item.step}
                  </span>
                </div>
                <h3 className={cn("text-xl font-bold", item.heading)}>
                  {item.title}
                </h3>
                <p className="text-base text-foreground/80">{item.body}</p>
              </li>
            </BlurFade>
          ))}
        </ol>
      </section>

      {/* What you get: verdict preview + privacy promise */}
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <BlurFade inView>
            <div className="flex h-full flex-col gap-4 rounded-3xl border border-border bg-card p-7">
              <h3 className="text-xl font-bold text-foreground">
                Options, not verdicts
              </h3>
              <p className="text-base text-muted-foreground">
                For each of your three strongest traits you get the full
                official list of college majors and the career pathways they
                lead to. Nothing is ranked or scored, because the point is to
                widen what you are choosing from.
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-2">
                {["Health Services", "Business", "Arts and Communication"].map(
                  (pathway) => (
                    <span
                      key={pathway}
                      className="rounded-full bg-muted px-4 py-1.5 text-sm font-semibold text-foreground"
                    >
                      {pathway}
                    </span>
                  ),
                )}
              </div>
            </div>
          </BlurFade>
          <BlurFade inView delay={0.1}>
            <div className="flex h-full flex-col gap-4 rounded-3xl border border-border bg-card p-7">
              <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
                <ShieldCheck
                  className="size-6 text-stage-assessment"
                  aria-hidden
                />
                Anonymous by design
              </h3>
              <p className="text-base text-muted-foreground">
                No account, no login, no name. Your answers stay on your device,
                and your results belong to you alone. Export them as a PDF or
                send them to your email once, and nothing about you is stored.
              </p>
              <p className="mt-auto text-sm font-semibold text-muted-foreground">
                Built to respect the Data Privacy Act of 2012.
              </p>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* The six traits: a legend, deliberately not another card grid */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <BlurFade inView>
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Six traits, one code
          </h2>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            The assessment measures all six. Your three strongest become your
            Holland Code, and that code is what the majors and pathways are
            matched to.
          </p>
        </BlurFade>

        <BlurFade inView delay={0.08} className="mt-8">
          <dl className="grid overflow-hidden rounded-3xl border border-border bg-card sm:grid-cols-2">
            {traitPreview.map((trait, index) => (
              <div
                key={trait.letter}
                className={cn(
                  // Fixed name column, so every summary starts on the same
                  // line however long the trait name is.
                  "grid items-start gap-x-5 gap-y-2 border-border p-6 sm:grid-cols-[13.5rem_1fr]",
                  index < traitPreview.length - 1 && "border-b",
                  // Two columns: the left one keeps a divider, and the last
                  // row of each column drops its bottom border.
                  "sm:even:border-l",
                  index >= traitPreview.length - 2 && "sm:border-b-0",
                )}
              >
                <dt className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl font-heading text-lg font-extrabold",
                      trait.chip,
                    )}
                    aria-hidden
                  >
                    {trait.letter}
                  </span>
                  <span className="font-heading text-lg font-bold text-foreground">
                    {trait.name}
                  </span>
                </dt>
                <dd className="text-base text-pretty text-muted-foreground sm:pt-1.5">
                  {trait.summary}
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
