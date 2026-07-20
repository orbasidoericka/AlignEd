// Copyright (c) 2026 EdTech. All rights reserved.

// Pure-SVG six-axis radar. Chart-lib-agnostic props (scores + max) so the
// PRD's later Recharts phase can swap the internals without touching callers.

import { TRAIT_META, TRAIT_ORDER } from "@/lib/riasec/scoring";
import type { RiasecScores } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

interface RiasecRadarProps {
  scores: RiasecScores;
  max: number;
  className?: string;
}

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 110;
const RINGS = [0.25, 0.5, 0.75, 1];

function pointAt(axisIndex: number, ratio: number): [number, number] {
  // Start at 12 o'clock, go clockwise; six axes 60 degrees apart.
  const angle = (Math.PI / 180) * (axisIndex * 60 - 90);
  return [
    CENTER + RADIUS * ratio * Math.cos(angle),
    CENTER + RADIUS * ratio * Math.sin(angle),
  ];
}

function polygonPoints(ratios: number[]): string {
  return ratios
    .map((ratio, i) => pointAt(i, ratio).map((n) => n.toFixed(1)).join(","))
    .join(" ");
}

export function RiasecRadar({ scores, max, className }: RiasecRadarProps) {
  const safeMax = max > 0 ? max : 1;
  const ratios = TRAIT_ORDER.map((trait) =>
    Math.min(1, Math.max(0, scores[trait] / safeMax)),
  );

  return (
    <figure className={cn("flex flex-col items-center", className)}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-80"
        role="img"
        aria-label={`Radar chart of your six RIASEC trait scores out of ${safeMax}: ${TRAIT_ORDER.map(
          (trait) => `${TRAIT_META[trait].label} ${scores[trait]}`,
        ).join(", ")}`}
      >
        {RINGS.map((ring) => (
          <polygon
            key={ring}
            points={polygonPoints(TRAIT_ORDER.map(() => ring))}
            fill="none"
            className="stroke-border"
            strokeWidth={1}
          />
        ))}
        {TRAIT_ORDER.map((trait, i) => {
          const [x, y] = pointAt(i, 1);
          return (
            <line
              key={trait}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              className="stroke-border"
              strokeWidth={1}
            />
          );
        })}
        <polygon
          points={polygonPoints(ratios)}
          className="fill-stage-results/25 stroke-stage-results"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {ratios.map((ratio, i) => {
          const [x, y] = pointAt(i, ratio);
          return (
            <circle
              key={TRAIT_ORDER[i]}
              cx={x}
              cy={y}
              r={4}
              className="fill-stage-results"
            />
          );
        })}
        {TRAIT_ORDER.map((trait, i) => {
          const [x, y] = pointAt(i, 1.18);
          return (
            <text
              key={trait}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground font-heading text-[15px] font-semibold"
            >
              {TRAIT_META[trait].letter}
            </text>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        <table>
          <caption>Your RIASEC trait scores</caption>
          <tbody>
            {TRAIT_ORDER.map((trait) => (
              <tr key={trait}>
                <th scope="row">
                  {TRAIT_META[trait].letter}: {TRAIT_META[trait].label}
                </th>
                <td>
                  {scores[trait]} out of {safeMax}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
