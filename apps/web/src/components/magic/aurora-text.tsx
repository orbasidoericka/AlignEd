"use client";

import { memo } from "react";

import { cn } from "@/lib/utils";

// Vendored from MagicUI (magicui.design/docs/components/aurora-text).
// Adapted:
// - Palette tokens instead of raw hexes. CSS variables resolve inside
//   linear-gradient(), and these already flip per theme, so one definition
//   covers both themes.
// - Only two colors, echoing the blue/yellow story that already anchors this
//   headline (blue underlines "profession", palette yellow marks "passion").
//   --align-a/--align-b are their own tokens, not --primary-strong /
//   --stage-profile-strong: a 72px word owes the 3:1 large-text floor rather
//   than the 4.5:1 those two are tuned for, and the palette's own blue and
//   yellow clear neither on the light page. See globals.css.
//   The original 3-stop version also mixed in --success-strong, a green with
//   no story in this sentence, which read as a muddy, off-palette smear.
// - Each color holds and the hand-off between them is short. Blue and gold
//   are near-complementary, so any long blend passes through grey; a short
//   one in oklab reads as two colors meeting, not a third one appearing.
// - The gradient pans; the text does not. Upstream animated rotate/scale on
//   the word itself, which tilts and resizes a 72px headline and shoves the
//   words after it.
// - motion-safe:, so reduced motion gets the static gradient.
// - Keyframes are longhands in globals.css; the `animation` shorthand would
//   reset the per-instance duration.

// The pair twice: the gradient is 200% of the word, so with one pair the word
// showed a single band at a time and turned all blue, then all yellow. Two
// pairs keep both colors on the word and the pan just slides the seam.
const DEFAULT_COLORS = [
  "var(--align-a)",
  "var(--align-b)",
  "var(--align-a)",
  "var(--align-b)",
];

/** Share of each color's band spent blending into the next. */
const BLEND = 0.2;

// "a 0%, a 20%, b 25%, b 45%, ..., a 100%" for four: every color holds for
// most of its band and hands off over the last BLEND of it, then the first
// color closes the loop so the pan wraps seamlessly.
function heldStops(colors: string[]): string {
  const band = 100 / colors.length;
  const stops = colors.flatMap((color, i) => {
    const start = i * band;
    return [`${color} ${start}%`, `${color} ${start + band * (1 - BLEND)}%`];
  });
  return [...stops, `${colors[0]} 100%`].join(", ");
}

interface AuroraTextProps {
  children: React.ReactNode;
  className?: string;
  /** Gradient stops. Pass `var(--token)` values, not raw hex. */
  colors?: string[];
  /** 1 = a 10s loop; lower is slower. */
  speed?: number;
}

export const AuroraText = memo(function AuroraText({
  children,
  className,
  colors = DEFAULT_COLORS,
  speed = 1,
}: AuroraTextProps) {
  return (
    <span className={cn("relative inline-block", className)}>
      {/* Read once: the painted copy below is hidden from assistive tech. */}
      <span className="sr-only">{children}</span>
      <span
        aria-hidden="true"
        className="relative bg-clip-text text-transparent motion-safe:animate-aurora"
        style={
          {
            backgroundImage: `linear-gradient(135deg in oklab, ${heldStops(colors)})`,
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            "--aurora-duration": `${10 / speed}s`,
          } as React.CSSProperties
        }
      >
        {children}
      </span>
    </span>
  );
});
