// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { cn } from "@/lib/utils";

// Vendored from MagicUI (magicui.design/docs/components/shimmer-button).
// Adapted: custom properties are namespaced `--shimmer-*` because upstream sets
// a bare `--radius` inline, which would shadow the root `--radius` the whole
// rounded-* scale derives from for every descendant; keyframes live in
// globals.css as `animate-shimmer-slide` / `animate-spin-around` longhands (the
// `animation` shorthand would pin the per-instance `--shimmer-speed`); the
// spark, fill and label use only palette tokens whose hex is identical in both
// themes; a static rail gradient paints the lit edge so reduced motion gets a
// finished pill instead of one stray glow parked at the left edge; the three
// decorative layers are spans (a button takes phrasing content only) and
// aria-hidden, so the accessible name is exactly the children.
type ShimmerButtonProps = React.ComponentProps<"button"> & {
  /** The travelling spark. @default var(--stage-profile) */
  shimmerColor?: string;
  /** Width of the lit perimeter. @default "2px" */
  shimmerSize?: string;
  /** One pass of the spark. @default "3s" */
  shimmerDuration?: string;
  /** @default "9999px" (pill) */
  borderRadius?: string;
  /** The pill fill. @default var(--primary) */
  background?: string;
  /** Static perimeter under the spark; what reduced motion is left with. */
  rail?: string;
};

export function ShimmerButton({
  shimmerColor = "var(--stage-profile)",
  shimmerSize = "2px",
  shimmerDuration = "3s",
  borderRadius = "9999px",
  background = "var(--primary)",
  rail = "linear-gradient(145deg, var(--stage-profile), var(--primary) 55%, var(--stage-profile))",
  className,
  children,
  style,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      type="button"
      style={
        {
          "--shimmer-spread": "90deg",
          "--shimmer-color": shimmerColor,
          "--shimmer-radius": borderRadius,
          "--shimmer-speed": shimmerDuration,
          "--shimmer-cut": shimmerSize,
          "--shimmer-bg": background,
          "--shimmer-rail": rail,
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        // The root paints the rail; the backdrop below covers all of it but a
        // --shimmer-cut ring, so the rail is the button's lit edge at rest.
        "group/shimmer relative isolate z-0 inline-flex h-14 shrink-0 cursor-pointer items-center justify-center gap-2.5 overflow-hidden px-8 whitespace-nowrap select-none",
        "[background:var(--shimmer-rail)] [border-radius:var(--shimmer-radius)]",
        "font-heading text-lg font-semibold text-primary-foreground",
        // A tight drop shadow and nothing blurred or hover-reactive: the bento
        // frame around this button already runs a pointer-tracked
        // GlowingEffect, and a second halo reads as a bug rather than depth.
        "shadow-[0_12px_30px_-12px_var(--primary)]",
        "transform-gpu transition-transform duration-150 ease-out",
        "active:not-aria-[haspopup]:translate-y-px",
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        className,
      )}
      {...props}
    >
      {/* Spark track. container-type: size makes the 100cqw/100cqh in the
          keyframes resolve against this pill, so the spark crosses it exactly
          once per pass at any width. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-30 overflow-visible blur-[2px] @container-[size]"
      >
        <span className="absolute inset-0 aspect-square h-[100cqh] will-change-transform motion-safe:animate-shimmer-slide">
          <span className="absolute -inset-full w-auto will-change-transform [background:conic-gradient(from_calc(270deg-(var(--shimmer-spread)*0.5)),transparent_0,var(--shimmer-color)_var(--shimmer-spread),transparent_var(--shimmer-spread))] motion-safe:animate-spin-around" />
        </span>
      </span>

      {/* Backdrop: masks the spark down to the --shimmer-cut ring. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[var(--shimmer-cut)] -z-20 [background:var(--shimmer-bg)] [border-radius:var(--shimmer-radius)]"
      />

      {/* Inset bloom along the bottom edge, so the flat pastel fill reads as a
          lit surface. Opacity carries hover and press. The negative z-index is
          load-bearing: positioned layers paint after inline content whatever
          the DOM order, so at z-auto this cream glow would wash over the
          label's descenders. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-45 shadow-[inset_0_-10px_14px_var(--shimmer-color)] transition-opacity duration-300 ease-in-out [border-radius:var(--shimmer-radius)] group-hover/shimmer:opacity-70 group-active/shimmer:opacity-90"
      />

      {children}
    </button>
  );
}
