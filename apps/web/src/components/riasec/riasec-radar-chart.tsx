// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

// The Recharts half of RiasecRadar. Its own module so riasec-radar.tsx can
// load it lazily: Recharts (with its redux and immer) is the largest chunk on
// the results page, and nothing but this picture needs it.

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

const chartConfig = {
  score: { label: "Score", color: "var(--chart-1)" },
} satisfies ChartConfig;

export interface RadarDatum {
  letter: string;
  label: string;
  score: number;
}

export default function RiasecRadarChart({
  data,
  max,
}: {
  data: RadarDatum[];
  max: number;
}) {
  // Recharts animates in JS, outside MotionConfig and the CSS media query.
  const reduceMotion = useReducedMotion();

  return (
    // Visual only; RiasecRadar's sr-only table carries the data.
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
        <PolarRadiusAxis domain={[0, max]} tick={false} axisLine={false} />
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
  );
}
