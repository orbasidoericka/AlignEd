// Copyright (c) 2026 EdTech. All rights reserved.

import { BlurFade } from "@/components/magic/blur-fade";
import { TraitEmblem } from "@/components/riasec/trait-emblem";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { hexPoint, hexPolygon } from "@/lib/riasec/hexagon";
import { TRAIT_META, TRAIT_ORDER } from "@/lib/riasec/scoring";

// The figure lives in a 100 x 118 box (taller than wide so the labels under
// the bottom vertex have room). Positions are worked out in those units and
// turned into percentages, so the hexagon scales with its container and
// needs no breakpoints.
const BOX_W = 100;
const BOX_H = 118;
const CENTER = { x: 50, y: 54 };
const OUTER_R = 38;
const INNER_R = 20;

const vertices = TRAIT_ORDER.map((trait, index) => {
  const { letter, label } = TRAIT_META[trait];
  const { x, y } = hexPoint(CENTER, index, OUTER_R);
  return {
    letter,
    label,
    name: RIASEC_PATHWAYS[letter].name,
    left: `${(x / BOX_W) * 100}%`,
    top: `${(y / BOX_H) * 100}%`,
  };
});

// Holland's theory of career choice in plain words, just after the hero: why
// a three-letter code is worth five minutes, before the steps explain how to
// get one. Paraphrased for Grade 11 and 12 readers, not quoted.
export function HollandTheory() {
  return (
    <section
      id="holland-theory"
      aria-labelledby="holland-theory-heading"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <BlurFade inView>
          <div className="mx-auto flex max-w-[62ch] flex-col gap-4 text-center lg:mx-0 lg:text-left">
            <h2
              id="holland-theory-heading"
              className="text-3xl font-bold text-balance text-foreground sm:text-4xl"
            >
              Where your code comes from
            </h2>
            <p className="text-lg text-pretty text-foreground">
              In 1959, psychologist John L. Holland put forward a simple idea:
              the work people enjoy tends to reflect who they are. When a job
              fits your personality, you are more likely to find it
              satisfying.
            </p>
            <p className="text-base text-pretty text-muted-foreground">
              He grouped interests into six types, known by their first letters
              as RIASEC: Realistic, Investigative, Artistic, Social,
              Enterprising and Conventional. Each type is drawn to different
              work. A Realistic person may like hands-on jobs such as building
              or fixing things, while an Artistic person may lean toward design
              or music.
            </p>
            <p className="text-base text-pretty text-muted-foreground">
              No one is only one type. Most people are a blend, and that blend
              is what makes each path different. That is why your result is
              three letters, not one.
            </p>
            <p className="mt-2 rounded-2xl bg-stage-assessment-soft px-5 py-4 text-base text-pretty text-foreground">
              Career counselors around the world still use Holland&apos;s model
              to help people find work that suits them.
            </p>
          </div>
        </BlurFade>

        <BlurFade inView delay={0.08}>
          <figure className="relative mx-auto aspect-100/118 w-full max-w-[24rem] lg:max-w-none">
            <svg
              viewBox={`0 0 ${BOX_W} ${BOX_H}`}
              aria-hidden="true"
              focusable="false"
              className="absolute inset-0 size-full"
            >
              <polygon
                points={hexPolygon(CENTER, OUTER_R)}
                strokeWidth={0.8}
                strokeLinejoin="round"
                className="fill-stage-assessment-soft stroke-primary/40 dark:stroke-primary/30"
              />
              <polygon
                points={hexPolygon(CENTER, INNER_R)}
                strokeWidth={0.5}
                strokeLinejoin="round"
                strokeDasharray="1.5 1.5"
                className="fill-none stroke-primary/30 dark:stroke-primary/20"
              />
            </svg>

            {/* Centre label, part of the drawing: the list below names the
                six types for assistive tech. */}
            <div
              aria-hidden="true"
              className="absolute flex -translate-1/2 flex-col items-center"
              style={{
                left: `${(CENTER.x / BOX_W) * 100}%`,
                top: `${(CENTER.y / BOX_H) * 100}%`,
              }}
            >
              <span className="font-heading text-lg font-extrabold tracking-tight text-foreground sm:text-2xl">
                RIASEC
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                6 types, 1 code
              </span>
            </div>

            <ul aria-label="The six RIASEC types">
              {vertices.map((vertex, index) => (
                <li
                  key={vertex.letter}
                  className="absolute -translate-x-1/2 -translate-y-6 sm:-translate-y-7"
                  style={{ left: vertex.left, top: vertex.top }}
                >
                  <BlurFade
                    inView
                    delay={0.12 + index * 0.06}
                    className="group flex flex-col items-center text-center"
                  >
                    <TraitEmblem
                      letter={vertex.letter}
                      className="size-12 transition-transform duration-300 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:size-14"
                    />
                    {/* Page-coloured backing so the hexagon's edges never
                        run through the words. */}
                    <span className="mt-1 flex flex-col items-center rounded-lg bg-background px-1.5 py-0.5">
                      <span className="font-heading text-sm leading-tight font-bold whitespace-nowrap text-foreground">
                        {vertex.name}
                      </span>
                      <span className="text-xs leading-tight whitespace-nowrap text-muted-foreground">
                        {vertex.label}
                      </span>
                    </span>
                  </BlurFade>
                </li>
              ))}
            </ul>

            <figcaption className="sr-only">
              Holland&apos;s six interest types arranged around a hexagon.
            </figcaption>
          </figure>
        </BlurFade>
      </div>
    </section>
  );
}
