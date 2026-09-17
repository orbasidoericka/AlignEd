import { useId } from "react";

import { seededRandom } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";

// Vendored from MagicUI (magicui.design/docs/components/hexagon-pattern).
// Adapted: token default colors, optional per-hexagon className so one
// pattern can highlight cells in several palette colors, no loose index
// signature on props, a static grid with highlighted cells that glow in and
// out at random-looking times (pure CSS, keyframes in globals.css), and
// `scatterHexagons` for spreading lit cells across a grid deterministically.

type Direction = "horizontal" | "vertical";

type HighlightedHexagon =
  | [col: number, row: number]
  | [col: number, row: number, className: string];

interface HexagonPatternProps
  extends Omit<React.ComponentProps<"div">, "children"> {
  /**
   * The radius of each hexagon (center to vertex).
   * @default 40
   */
  radius?: number;
  /**
   * Spacing in pixels between adjacent hexagons.
   * @default 0
   */
  gap?: number;
  /**
   * Offset applied to the pattern origin on the x-axis.
   * @default -1
   */
  x?: number;
  /**
   * Offset applied to the pattern origin on the y-axis.
   * @default -1
   */
  y?: number;
  /**
   * `"horizontal"`: flat-top hexagons. `"vertical"`: pointy-top hexagons.
   * @default "horizontal"
   */
  direction?: Direction;
  /**
   * SVG stroke-dasharray applied to each hexagon outline.
   * @default "0"
   */
  strokeDasharray?: string;
  /**
   * [col, row] cells to fill on top of the pattern, with an optional
   * className (e.g. a fill color) per cell.
   */
  hexagons?: HighlightedHexagon[];
  /**
   * Highlighted cells slowly fade in and out (breathing LED), each on its
   * own pseudo-random period and phase. The grid itself never moves.
   * Applied with `motion-safe:`, so reduced-motion users see lit cells.
   * @default true
   */
  animated?: boolean;
  /**
   * [min, max] seconds for one glow cycle; each cell picks a value between.
   * @default [5, 10]
   */
  glowSeconds?: [min: number, max: number];
  className?: string;
}

type HexPoint = readonly [number, number];

// Math.cos/sin can differ in the last digits between Node and the browser,
// which breaks hydration on the `points` attribute. Sub-pixel rounding keeps
// server and client output identical.
function roundCoord(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Picks `count` distinct cells spread across a `cols` x `rows` grid,
 * cycling through `classNames` for their colors. Same inputs always give the
 * same cells, so it is safe to call during server rendering.
 */
export function scatterHexagons({
  count,
  cols,
  rows,
  classNames,
  seed = 1,
}: {
  count: number;
  cols: number;
  rows: number;
  classNames: readonly string[];
  seed?: number;
}): HighlightedHexagon[] {
  const cells: HighlightedHexagon[] = [];
  const taken = new Set<string>();
  const total = cols * rows;
  for (let i = 0; cells.length < Math.min(count, total) && i < total * 8; i++) {
    const index = Math.floor(seededRandom(i, seed, 3) * total);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const key = `${col}-${row}`;
    if (taken.has(key)) continue;
    taken.add(key);
    cells.push([col, row, classNames[cells.length % classNames.length] ?? ""]);
  }
  return cells;
}

function hexVertexList(
  cx: number,
  cy: number,
  r: number,
  direction: Direction,
): HexPoint[] {
  const startAngle = direction === "horizontal" ? 0 : 30;
  return Array.from({ length: 6 }, (_, i) => {
    const angle = ((startAngle + i * 60) * Math.PI) / 180;
    return [
      roundCoord(cx + r * Math.cos(angle)),
      roundCoord(cy + r * Math.sin(angle)),
    ] as const;
  });
}

function hexPoints(
  cx: number,
  cy: number,
  r: number,
  direction: Direction,
): string {
  return hexVertexList(cx, cy, r, direction)
    .map(([px, py]) => `${px},${py}`)
    .join(" ");
}

function edgeLexKey(a: HexPoint, b: HexPoint): string {
  const [p, q] =
    a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]) ? [a, b] : [b, a];
  return `${p[0].toFixed(6)},${p[1].toFixed(6)}|${q[0].toFixed(6)},${q[1].toFixed(6)}`;
}

function collectUniqueHexEdges(
  centers: [number, number][],
  r: number,
  direction: Direction,
): [HexPoint, HexPoint][] {
  const seen = new Set<string>();
  const edges: [HexPoint, HexPoint][] = [];
  for (const [cx, cy] of centers) {
    const verts = hexVertexList(cx, cy, r, direction);
    // Pair each vertex with the next, wrapping the last back to the first.
    const next = [...verts.slice(1), ...verts.slice(0, 1)];
    for (const [i, a] of verts.entries()) {
      const b = next[i];
      if (!b) continue;
      const key = edgeLexKey(a, b);
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([a, b]);
      }
    }
  }
  return edges;
}

function isSolidStrokeDasharray(strokeDasharray: string): boolean {
  const t = strokeDasharray.trim();
  return t === "" || t === "none" || t === "0";
}

function getHexSpacing(r: number, direction: Direction, gap: number) {
  const sqrt3 = Math.sqrt(3);

  // `gap` matches the visible edge-to-edge spacing, so it is added along the
  // shared-edge normal instead of directly on the raw x/y axes.
  if (direction === "horizontal") {
    const colStep = (3 * r) / 2 + (sqrt3 * gap) / 2;
    const rowStep = sqrt3 * r + gap;
    return { colStep, rowStep, tileW: colStep * 2, tileH: rowStep };
  }

  const colStep = sqrt3 * r + gap;
  const rowStep = (3 * r) / 2 + (sqrt3 * gap) / 2;
  return { colStep, rowStep, tileW: colStep, tileH: rowStep * 2 };
}

function getTileGeometry(r: number, direction: Direction, gap: number) {
  const { colStep, rowStep, tileW, tileH } = getHexSpacing(r, direction, gap);

  const canonical: [number, number][] =
    direction === "horizontal"
      ? [
          [colStep / 2, rowStep / 2],
          [(colStep * 3) / 2, rowStep],
        ]
      : [
          [colStep / 2, rowStep / 2],
          [colStep, (rowStep * 3) / 2],
        ];

  // Hexagons crossing a tile edge are repeated on the opposite edge so the
  // pattern tiles seamlessly.
  const centers: [number, number][] = [];
  for (const [cx, cy] of canonical) {
    centers.push([cx, cy]);
    if (cy - r < 0) centers.push([cx, cy + tileH]);
    if (cy + r > tileH) centers.push([cx, cy - tileH]);
    if (cx - r < 0) centers.push([cx + tileW, cy]);
    if (cx + r > tileW) centers.push([cx - tileW, cy]);
    if (cy - r < 0 && cx - r < 0) centers.push([cx + tileW, cy + tileH]);
    if (cy - r < 0 && cx + r > tileW) centers.push([cx - tileW, cy + tileH]);
    if (cy + r > tileH && cx - r < 0) centers.push([cx + tileW, cy - tileH]);
    if (cy + r > tileH && cx + r > tileW)
      centers.push([cx - tileW, cy - tileH]);
  }

  return { tileW, tileH, centers };
}

function hexCenter(
  col: number,
  row: number,
  r: number,
  direction: Direction,
  gap: number,
): [number, number] {
  const { colStep, rowStep } = getHexSpacing(r, direction, gap);
  if (direction === "horizontal") {
    const x = col * colStep + colStep / 2;
    const y = row * rowStep + rowStep / 2 + (col % 2 !== 0 ? rowStep / 2 : 0);
    return [x, y];
  }
  const x = col * colStep + colStep / 2 + (row % 2 !== 0 ? colStep / 2 : 0);
  const y = row * rowStep + rowStep / 2;
  return [x, y];
}

export function HexagonPattern({
  radius = 40,
  gap = 0,
  x = -1,
  y = -1,
  strokeDasharray = "0",
  direction = "horizontal",
  hexagons,
  animated = true,
  glowSeconds = [5, 10],
  className,
  ...props
}: HexagonPatternProps) {
  const patternId = useId();
  const glowId = useId();

  const { tileW, tileH, centers } = getTileGeometry(radius, direction, gap);
  const solidStroke = isSolidStrokeDasharray(strokeDasharray);
  const dashedEdges = solidStroke
    ? null
    : collectUniqueHexEdges(centers, radius, direction);
  const [minGlow, maxGlow] = glowSeconds;

  // The grid never moves. fill/stroke classes on the wrapper inherit into
  // both SVG layers, and the wrapper's mask fades both.
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden fill-primary/20 stroke-border",
        className,
      )}
      {...props}
    >
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <pattern
            id={patternId}
            width={tileW}
            height={tileH}
            patternUnits="userSpaceOnUse"
            x={x}
            y={y}
          >
            {solidStroke
              ? centers.map(([cx, cy]) => (
                  <polygon
                    className="fill-none"
                    key={`${cx}-${cy}`}
                    points={hexPoints(cx, cy, radius, direction)}
                    strokeDasharray={strokeDasharray}
                  />
                ))
              : dashedEdges?.map(([a, b]) => (
                  <line
                    className="fill-none"
                    key={edgeLexKey(a, b)}
                    x1={a[0]}
                    x2={b[0]}
                    y1={a[1]}
                    y2={b[1]}
                    strokeDasharray={strokeDasharray}
                  />
                ))}
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
          stroke="none"
        />
      </svg>

      {hexagons && hexagons.length > 0 && (
        <svg className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            {/* Glow in each cell's own fill color: blur merged under it. */}
            <filter
              id={glowId}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation={radius / 4} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g transform={`translate(${x} ${y})`}>
            {hexagons.map(([col, row, cellClassName]) => {
              const [cx, cy] = hexCenter(col, row, radius, direction, gap);
              // Each cell breathes on its own period and phase. Seeded from
              // its coordinates so server and client agree (no hydration
              // mismatch) while the grid still reads as random.
              const duration =
                minGlow + seededRandom(col, row, 1) * (maxGlow - minGlow);
              const delay = -seededRandom(col, row, 2) * duration;
              return (
                <polygon
                  key={`${col}-${row}`}
                  points={hexPoints(cx, cy, radius - 1, direction)}
                  strokeWidth="0"
                  filter={`url(#${glowId})`}
                  className={cn(
                    cellClassName,
                    animated && "motion-safe:animate-hex-glow",
                  )}
                  style={{
                    animationDuration: `${roundCoord(duration)}s`,
                    animationDelay: `${roundCoord(delay)}s`,
                  }}
                />
              );
            })}
          </g>
        </svg>
      )}
    </div>
  );
}
