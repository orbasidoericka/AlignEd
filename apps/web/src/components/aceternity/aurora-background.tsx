// Copyright (c) 2026 EdTech. All rights reserved.

import { cn } from "@/lib/utils";

// Vendored from Aceternity UI (ui.aceternity.com/components/aurora-background).
// Adapted:
// - AlignEd pastels via tokens instead of the demo's blue/indigo/violet, so
//   the field belongs to the Profile Setup stage instead of fighting it.
// - One blurred layer, not two blended with mix-blend-difference: the second
//   layer cost a full-screen composite for no visible gain under this palette,
//   and this has to stay smooth on a low-end Android phone.
// - `motion-safe:`, so reduced motion keeps the field and drops the drift.
// - No motion/react wrapper: the drift is pure CSS in globals.css, and the
//   demo's fade-in would animate on mount, which the design system reserves
//   for ambient background loops only.
// - Server component; there is no state or effect to own.

interface AuroraBackgroundProps extends React.ComponentProps<"div"> {
  /** Fades the field out toward the bottom so copy never sits on texture. */
  showRadialGradient?: boolean;
}

export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative isolate flex flex-1 flex-col overflow-hidden bg-stage-profile-soft",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden print:hidden"
      >
        <div
          className={cn(
            // Inset past the edges so the blur never reveals a hard border.
            "absolute -inset-16 aurora-field opacity-85 dark:opacity-30",
            "motion-safe:animate-aurora-drift",
            showRadialGradient &&
              "mask-[radial-gradient(ellipse_at_top,white,transparent_75%)]",
          )}
        />
      </div>
      {children}
    </div>
  );
}
