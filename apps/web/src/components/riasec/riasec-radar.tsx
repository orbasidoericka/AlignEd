// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

// Six-axis RIASEC radar on shadcn Chart (Recharts). Props are unchanged from
// the earlier hand-rolled SVG so callers do not move.
//
// The chart itself loads lazily (riasec-radar-chart.tsx), so Recharts stays
// out of the results page's first download. A same-size placeholder holds its
// square until it arrives, so nothing shifts; the sr-only table is rendered
// here, at once, so the scores never wait on the picture.

import dynamic from "next/dynamic";

import { RESULTS_TEXT_FIL, TRAIT_LABEL_FIL } from "@/lib/riasec/results-fil";
import { TRAIT_META, TRAIT_ORDER } from "@/lib/riasec/scoring";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import type { RiasecScores } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

const RiasecRadarChart = dynamic(() => import("./riasec-radar-chart"), {
  ssr: false,
  loading: () => (
    <div aria-hidden className="aspect-square w-full max-w-sm" />
  ),
});

interface RiasecRadarProps {
  scores: RiasecScores;
  max: number;
  className?: string;
}

export function RiasecRadar({ scores, max, className }: RiasecRadarProps) {
  const fil = useAssessmentStore((state) => state.language) === "fil";
  const t = RESULTS_TEXT_FIL;
  const label = (trait: (typeof TRAIT_ORDER)[number]) =>
    fil ? TRAIT_LABEL_FIL[trait] : TRAIT_META[trait].label;
  const safeMax = max > 0 ? max : 1;
  const data = TRAIT_ORDER.map((trait) => ({
    letter: TRAIT_META[trait].letter,
    label: label(trait),
    score: scores[trait],
  }));

  return (
    <figure className={cn("flex flex-col items-center", className)}>
      <RiasecRadarChart data={data} max={safeMax} />
      <figcaption lang={fil ? "fil" : undefined} className="sr-only">
        <table>
          <caption>{fil ? t.radarCaption : "Your RIASEC trait scores"}</caption>
          <tbody>
            {TRAIT_ORDER.map((trait) => (
              <tr key={trait}>
                <th scope="row">
                  {TRAIT_META[trait].letter}: {label(trait)}
                </th>
                <td>
                  {scores[trait]} {fil ? t.outOf(safeMax) : `out of ${safeMax}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
