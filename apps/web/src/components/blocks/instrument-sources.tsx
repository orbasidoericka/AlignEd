// Copyright (c) 2026 EdTech. All rights reserved.

import { BookOpenCheck } from "lucide-react";

import { BlurFade } from "@/components/magic/blur-fade";
import { HexagonPattern } from "@/components/magic/hexagon-pattern";
import { cn } from "@/lib/utils";

// Pointy-top hexagon, the RIASEC shape the rest of the site is built on.
const HEX = "[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]";

type InstrumentRow = {
  term: string;
  /** Plain value; the language row renders chips instead (see below). */
  value?: string;
  languages?: readonly string[];
};

// Facts about the adopted instrument, in the order a reader checks them:
// what it is, where it comes from, what it rests on, how it is offered, why.
export const instrument: readonly InstrumentRow[] = [
  { term: "Assessment", value: "42-item RIASEC Interest Test" },
  { term: "Original source", value: "Hawai'i Department of Education" },
  { term: "Framework", value: "Holland's RIASEC Theory" },
  { term: "Language options", languages: ["English", "Filipino"] },
  { term: "Purpose", value: "Career interest exploration" },
];

export const TRANSLATION_REVIEW_NOTE =
  "The Filipino translation was reviewed by a psychometrician and a Filipino professor.";

/**
 * About page acknowledgment of the adopted assessment instrument: a short
 * credit in prose beside a definition list of the instrument's facts.
 */
export function InstrumentSources() {
  return (
    <section
      id="sources"
      aria-labelledby="sources-heading"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6"
    >
      <BlurFade inView>
        {/* One panel: the credit on the stage-assessment wash, the facts on
            the card. Stacked below lg, side by side from lg with a hairline
            between them. */}
        <div className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-bento lg:grid-cols-12">
          <div className="relative isolate flex flex-col gap-5 bg-stage-assessment-soft p-6 sm:p-8 lg:col-span-5 lg:p-10">
            {/* Flipped on both axes so the lit cells (and the mask with
                them) sit in the bottom-right corner, behind the least text.
                Fills stay faint so muted copy over them keeps its contrast. */}
            <HexagonPattern
              radius={28}
              gap={3}
              animated={false}
              hexagons={[
                [0, 0, "fill-stage-assessment/35"],
                [1, 1, "fill-stage-assessment/20"],
                [2, 0, "fill-stage-assessment/10"],
              ]}
              className="-z-10 -scale-x-100 -scale-y-100 stroke-stage-assessment-strong/25 mask-[radial-gradient(ellipse_at_top_left,white,transparent_40%)] print:hidden dark:stroke-stage-assessment-strong/15"
            />
            <div className="flex items-center gap-4">
              <span
                aria-hidden
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center bg-stage-assessment text-stage-assessment-foreground",
                  HEX,
                )}
              >
                <BookOpenCheck className="size-5" />
              </span>
              <h2
                id="sources-heading"
                className="text-2xl font-bold text-balance text-foreground sm:text-3xl"
              >
                Where the questions come from
              </h2>
            </div>
            <p className="max-w-prose text-lg text-pretty text-foreground">
              AlignEd did not write its own test. The 42 statements you answer
              are adopted from the Hawai&apos;i Department of Education&apos;s
              RIASEC interest test, which is built on John Holland&apos;s
              theory of career interests.
            </p>
            <p className="max-w-prose text-base text-pretty text-muted-foreground">
              Our part is the rest: scoring your answers into a three-letter
              code and showing the careers and college programs that go with
              it. Full credit for the statements belongs to their authors.
            </p>
          </div>

          <dl className="flex flex-col divide-y divide-border border-t border-border px-6 py-2 sm:px-8 lg:col-span-7 lg:justify-center lg:border-t-0 lg:border-l lg:px-10 lg:py-6">
            {instrument.map((row, index) => (
              <BlurFade
                key={row.term}
                inView
                delay={index * 0.06}
                className="grid gap-1.5 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6"
              >
                <dt className="text-sm font-semibold text-muted-foreground sm:pt-1">
                  {row.term}
                </dt>
                <dd className="font-heading text-lg font-semibold text-pretty text-foreground">
                  {row.languages ? (
                    <>
                      <ul className="flex flex-wrap gap-2" aria-label="Languages">
                        {row.languages.map((language) => (
                          <li
                            key={language}
                            className="rounded-full bg-stage-assessment-soft px-3 py-1 text-sm font-semibold text-stage-assessment-strong"
                          >
                            {language}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 font-sans text-sm font-normal text-muted-foreground">
                        {TRANSLATION_REVIEW_NOTE}
                      </p>
                    </>
                  ) : (
                    row.value
                  )}
                </dd>
              </BlurFade>
            ))}
          </dl>
        </div>
      </BlurFade>
    </section>
  );
}
