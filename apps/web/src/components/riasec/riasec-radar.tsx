// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

// The six-score graph on Results, drawn like the landing page's hexagon: the
// trait emblems on its corners, each naming its type on hover, focus or tap
// (the score bars beside the graph spell out names and numbers). Inside, a blue
// shape reaches toward every type in proportion to its score over a grid of
// rings and spokes, whose outermost ring is a full score. Plain SVG and HTML; the sr-only table carries
// the data.

import { TraitEmblem } from "@/components/riasec/trait-emblem";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { PATHWAY_NAME_FIL } from "@/lib/riasec/career-pathways-fil";
import { hexPoint, hexPolygon, svgPoints } from "@/lib/riasec/hexagon";
import { RESULTS_TEXT_FIL } from "@/lib/riasec/results-fil";
import { TRAIT_META, TRAIT_ORDER } from "@/lib/riasec/scoring";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import type { RiasecScores } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

// A square box. Positions are worked out in these units and turned into
// percentages, so the graph scales with its container.
const BOX_W = 100;
const BOX_H = 100;
const CENTER = { x: 50, y: 50 };
// The emblems sit on this hexagon.
const OUTER_R = 41;
// A full score reaches this one, short of the emblems so they never hide it.
const FULL_SCORE_R = 29;
// Grid rings, as shares of a full score.
const GRID_RINGS = [0.25, 0.5, 0.75, 1] as const;

interface RiasecRadarProps {
  scores: RiasecScores;
  max: number;
  className?: string;
}

export function RiasecRadar({ scores, max, className }: RiasecRadarProps) {
  const fil = useAssessmentStore((state) => state.language) === "fil";
  const t = RESULTS_TEXT_FIL;
  const safeMax = max > 0 ? max : 1;
  const data = TRAIT_ORDER.map((trait, index) => {
    const { letter } = TRAIT_META[trait];
    const score = scores[trait];
    const share = Math.min(Math.max(score / safeMax, 0), 1);
    return {
      letter,
      name: fil ? PATHWAY_NAME_FIL[letter] : RIASEC_PATHWAYS[letter].name,
      score,
      corner: hexPoint(CENTER, index, OUTER_R),
      reach: hexPoint(CENTER, index, FULL_SCORE_R * share),
      spoke: hexPoint(CENTER, index, FULL_SCORE_R),
    };
  });

  return (
    <figure className={cn("flex flex-col items-center", className)}>
      <div className="relative aspect-square w-full">
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
          <g
            data-testid="score-grid"
            strokeWidth={0.35}
            strokeLinejoin="round"
            className="fill-none stroke-primary/45 dark:stroke-primary/30"
          >
            {GRID_RINGS.map((ring) => (
              <polygon
                key={ring}
                points={hexPolygon(CENTER, FULL_SCORE_R * ring)}
              />
            ))}
            {data.map((d) => (
              <line
                key={d.letter}
                x1={CENTER.x}
                y1={CENTER.y}
                x2={d.spoke.x.toFixed(2)}
                y2={d.spoke.y.toFixed(2)}
              />
            ))}
          </g>
          <polygon
            data-testid="score-shape"
            points={svgPoints(data.map((d) => d.reach))}
            strokeWidth={0.9}
            strokeLinejoin="round"
            className="fill-primary/40 stroke-primary-strong"
          />
          {data.map((d) => (
            <circle
              key={d.letter}
              cx={d.reach.x.toFixed(2)}
              cy={d.reach.y.toFixed(2)}
              r={1.3}
              className="fill-primary-strong"
            />
          ))}
        </svg>

        {data.map((d) => {
          const upper = d.corner.y < CENTER.y;
          return (
            // The type's name shows on hover, keyboard focus, or a tap (which
            // focuses the button: touch screens have no hover).
            <div
              key={d.letter}
              className="group absolute -translate-1/2 hover:z-10 focus-within:z-10"
              style={{
                left: `${(d.corner.x / BOX_W) * 100}%`,
                top: `${(d.corner.y / BOX_H) * 100}%`,
              }}
            >
              <button
                type="button"
                // Explicit, so Safari focuses it on a click or tap too.
                tabIndex={0}
                lang={fil ? "fil" : undefined}
                aria-label={d.name}
                onKeyDown={(event) => {
                  if (event.key === "Escape") event.currentTarget.blur();
                }}
                className="block cursor-pointer rounded-xl outline-none transition-transform duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:hover:scale-110"
              >
                <TraitEmblem letter={d.letter} className="block size-10 sm:size-12" />
              </button>
              {/* Padding, not margin, closes the gap, so the pointer can
                  travel onto the name without losing it. Above the upper
                  three emblems, below the lower three: never over the shape. */}
              <span
                aria-hidden
                lang={fil ? "fil" : undefined}
                className={cn(
                  "invisible absolute left-1/2 -translate-x-1/2 opacity-0 transition-[opacity,visibility] duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100",
                  upper ? "bottom-full pb-1" : "top-full pt-1",
                )}
              >
                <span className="block rounded-xl bg-foreground px-3 py-1.5 font-heading text-sm font-semibold whitespace-nowrap text-background shadow-bento">
                  {d.name}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <figcaption lang={fil ? "fil" : undefined} className="sr-only">
        <table>
          <caption>{fil ? t.radarCaption : "Your RIASEC type scores"}</caption>
          <tbody>
            {data.map((d) => (
              <tr key={d.letter}>
                <th scope="row">
                  {d.letter}: {d.name}
                </th>
                <td>
                  {d.score} {fil ? t.outOf(safeMax) : `out of ${safeMax}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
