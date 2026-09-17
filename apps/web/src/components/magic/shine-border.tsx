"use client";

import { cn } from "@/lib/utils";

// Vendored from MagicUI (magicui.design/docs/components/shine-border).
// Adapted: keyframes live in globals.css as `animate-shine` longhands (the
// `animation` shorthand would reset the per-instance --duration), the default
// shine uses palette tokens instead of black, and it is aria-hidden.
interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Border thickness in pixels. @default 1 */
  borderWidth?: number;
  /** Seconds for one sweep. @default 14 */
  duration?: number;
  /** One color, or several to sweep through. Accepts `var(--token)`. */
  shineColor?: string | string[];
}

const DEFAULT_SHINE = [
  "var(--stage-assessment)",
  "var(--stage-results)",
  "var(--stage-profile)",
];

export function ShineBorder({
  borderWidth = 1,
  duration = 14,
  shineColor = DEFAULT_SHINE,
  className,
  style,
  ...props
}: ShineBorderProps) {
  const colors = Array.isArray(shineColor) ? shineColor.join(",") : shineColor;

  return (
    <div
      aria-hidden
      style={
        {
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          backgroundImage: `radial-gradient(transparent, transparent, ${colors}, transparent, transparent)`,
          backgroundSize: "300% 300%",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "var(--border-width)",
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 size-full rounded-[inherit] will-change-[background-position] motion-safe:animate-shine",
        className,
      )}
      {...props}
    />
  );
}
