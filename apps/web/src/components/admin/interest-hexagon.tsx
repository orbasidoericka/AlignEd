// Copyright (c) 2026 EdTech. All rights reserved.

import { TraitEmblem } from "@/components/riasec/trait-emblem";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import type { RiasecLetter } from "@/lib/riasec/types";
import { cn } from "@/lib/utils";

// Strongest interest areas on Holland's own hexagon: R top left, then
// clockwise I, A, S, E, C, so neighbours on the shape are the related areas.
// The filled shape reaches further toward the areas more students lead with.
// The chart is decorative; the list beside it carries every number.

const CHART_RADIUS = 100;
const EMBLEM_RADIUS = 134;
const VIEW = 175;

const DOT_FILL: Readonly<Record<RiasecLetter, string>> = {
  R: "fill-trait-r",
  I: "fill-trait-i",
  A: "fill-trait-a",
  S: "fill-trait-s",
  E: "fill-trait-e",
  C: "fill-trait-c",
};

const BAR_FILL: Readonly<Record<RiasecLetter, string>> = {
  R: "bg-trait-r",
  I: "bg-trait-i",
  A: "bg-trait-a",
  S: "bg-trait-s",
  E: "bg-trait-e",
  C: "bg-trait-c",
};

// Holland order around the hexagon, starting top left and going clockwise.
function corner(index: number, radius: number): [number, number] {
  const angle = ((-120 + 60 * index) * Math.PI) / 180;
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

function points(radii: number[]): string {
  return radii
    .map((radius, i) => corner(i, radius).map((n) => n.toFixed(1)).join(","))
    .join(" ");
}

export function InterestHexagon({
  rows,
  total,
}: {
  rows: { letter: RiasecLetter; count: number }[];
  total: number;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  const reach = rows.map((row) =>
    Math.max(CHART_RADIUS * 0.08, (row.count / max) * CHART_RADIUS),
  );
  const ranked = [...rows].sort((a, b) => b.count - a.count);

  return (
    <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="relative mx-auto aspect-square w-full max-w-[22rem]" aria-hidden>
        <svg
          viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
          className="absolute inset-0 size-full overflow-visible"
        >
          {[1 / 3, 2 / 3, 1].map((step) => (
            <polygon
              key={step}
              points={points(rows.map(() => CHART_RADIUS * step))}
              className={cn(
                "fill-none stroke-border",
                step === 1 && "fill-muted/60",
              )}
              strokeWidth={1.5}
            />
          ))}
          {rows.map((row, i) => {
            const [x, y] = corner(i, CHART_RADIUS);
            return (
              <line
                key={row.letter}
                x1={0}
                y1={0}
                x2={x}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
              />
            );
          })}
          <polygon
            points={points(reach)}
            className="fill-primary/25 stroke-primary-strong"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {rows.map((row, i) => {
            const [x, y] = corner(i, reach[i]!);
            return (
              <circle
                key={row.letter}
                cx={x}
                cy={y}
                r={6}
                className={cn(DOT_FILL[row.letter], "stroke-card")}
                strokeWidth={2.5}
              />
            );
          })}
        </svg>
        {rows.map((row, i) => {
          const [x, y] = corner(i, EMBLEM_RADIUS);
          return (
            <div
              key={row.letter}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{
                left: `${((x + VIEW) / (VIEW * 2)) * 100}%`,
                top: `${((y + VIEW) / (VIEW * 2)) * 100}%`,
              }}
            >
              <TraitEmblem letter={row.letter} className="size-10" />
              <span className="mt-0.5 rounded-full bg-card px-1.5 text-xs font-bold text-foreground tabular-nums shadow-sm">
                {row.count}
              </span>
            </div>
          );
        })}
      </div>

      <ol className="flex flex-col gap-1">
        {ranked.map((row, i) => {
          const share = total ? Math.round((row.count / total) * 100) : 0;
          return (
            <li
              key={row.letter}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2",
                i === 0 && row.count > 0 && "ring-2 ring-primary/40",
              )}
            >
              <TraitEmblem letter={row.letter} className="size-8" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-medium text-foreground">
                    {RIASEC_PATHWAYS[row.letter].name}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-semibold text-foreground">
                      {row.count.toLocaleString()}
                    </span>
                    <span className="ml-1.5 text-sm text-muted-foreground">
                      {share}%
                    </span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted" aria-hidden>
                  <div
                    className={cn("h-1.5 rounded-full", BAR_FILL[row.letter])}
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
