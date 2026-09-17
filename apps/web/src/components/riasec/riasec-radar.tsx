// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

// Six-axis RIASEC radar on shadcn Chart (Recharts). Props are unchanged from
// the earlier hand-rolled SVG so callers do not move.

import { useReducedMotion } from "framer-motion";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TRAIT_META, TRAIT_ORDER } from "@/lib/riasec/scoring";
import type { RiasecScores } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

interface RiasecRadarProps {
  scores: RiasecScores;
  max: number;
  className?: string;
}

const chartConfig = {
  score: { label: "Score", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function RiasecRadar({ scores, max, className }: RiasecRadarProps) {
  // Recharts animates in JS, outside MotionConfig and the CSS media query.
  const reduceMotion = useReducedMotion();
  const safeMax = max > 0 ? max : 1;
  const data = TRAIT_ORDER.map((trait) => ({
    letter: TRAIT_META[trait].letter,
    label: TRAIT_META[trait].label,
    score: scores[trait],
  }));

  return (
    <figure className={cn("flex flex-col items-center", className)}>
      {/* Visual only; the sr-only table below carries the data. */}
      <ChartContainer
        config={chartConfig}
        className="aspect-square w-full max-w-sm"
        aria-hidden
      >
        <RadarChart data={data} outerRadius="76%">
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(value, payload) => {
                  const label = payload?.[0]?.payload?.label;
                  return label ? `${value}: ${label}` : value;
                }}
              />
            }
          />
          <PolarGrid className="stroke-border" />
          <PolarAngleAxis
            dataKey="letter"
            tick={{
              className: "fill-foreground font-heading text-[15px] font-semibold",
            }}
          />
          <PolarRadiusAxis
            domain={[0, safeMax]}
            tick={false}
            axisLine={false}
          />
          <Radar
            dataKey="score"
            fill="var(--color-score)"
            fillOpacity={0.5}
            stroke="var(--primary-strong)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            dot={{ r: 4, fill: "var(--primary-strong)", fillOpacity: 1 }}
            isAnimationActive={!reduceMotion}
          />
        </RadarChart>
      </ChartContainer>
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
