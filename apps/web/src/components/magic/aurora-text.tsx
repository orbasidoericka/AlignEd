"use client";

import { memo } from "react";

import { cn } from "@/lib/utils";

// Vendored from MagicUI (magicui.design/docs/components/aurora-text).
// Adapted:
// - Palette tokens instead of neon hexes. CSS variables resolve inside
//   linear-gradient(), and these already flip per theme, so one definition
//   covers light and dark and every stop stays >= 4.5:1 as text.
// - Only two colors, echoing the same blue/gold story that already anchors
//   this headline (blue underlines "profession", gold marks "Step 1 of 3"
//   and the Profile Setup heading elsewhere). --align-a/--align-b are their
//   own tokens, not --primary-strong/--stage-profile-strong directly: at 72px
//   bold this word only needs the WCAG AA large-text floor (3:1), so it is
//   blended lighter toward each hue's pastel base and reads softer, while
//   still clearing the app's usual 4.5:1 for colored text (see globals.css).
//   The original 3-stop version also mixed in --success-strong, a green with
//   no story in this sentence, which read as a muddy, off-palette smear.
// - The gradient pans; the text does not. Upstream animated rotate/scale on
//   the word itself, which tilts and resizes a 72px headline and shoves the
//   words after it.
// - motion-safe:, so reduced motion gets the static gradient.
// - Keyframes are longhands in globals.css; the `animation` shorthand would
//   reset the per-instance duration.

const DEFAULT_COLORS = ["var(--align-a)", "var(--align-b)"];

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
  const first = colors[0] ?? DEFAULT_COLORS[0];

  return (
    <span className={cn("relative inline-block", className)}>
      {/* Read once: the painted copy below is hidden from assistive tech. */}
      <span className="sr-only">{children}</span>
      <span
        aria-hidden="true"
        className="relative bg-clip-text text-transparent motion-safe:animate-aurora"
        style={
          {
            backgroundImage: `linear-gradient(135deg, ${colors.join(", ")}, ${first})`,
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
