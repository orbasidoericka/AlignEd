// Copyright (c) 2026 EdTech. All rights reserved.

// The RIASEC hexagon's geometry, shared by the landing page's theory figure
// and the results graph. Pointy-top, clockwise from the top: R, I, A, S, E, C,
// the order Holland drew them in.

export interface Point {
  x: number;
  y: number;
}

export function hexPoint(center: Point, index: number, radius: number): Point {
  const angle = ((-90 + index * 60) * Math.PI) / 180;
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
}

// SVG `points` text. Rounded, so server and client print the same string.
export function svgPoints(points: readonly Point[]): string {
  return points.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

export function hexPolygon(center: Point, radius: number): string {
  return svgPoints(
    Array.from({ length: 6 }, (_, i) => hexPoint(center, i, radius)),
  );
}
