import type { ComponentPropsWithoutRef, CSSProperties } from "react";

import { cn } from "@/lib/utils";

// Vendored from MagicUI (magicui.design/docs/components/animated-shiny-text).
// Keyframes live in globals.css (@theme --animate-shiny-text).
export interface AnimatedShinyTextProps
  extends ComponentPropsWithoutRef<"span"> {
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
  ...props
}: AnimatedShinyTextProps) {
  return (
    <span
      style={
        {
          "--shiny-width": `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        "text-muted-foreground",
        "animate-shiny-text bg-position-[0_0] bg-clip-text bg-no-repeat bg-size-[var(--shiny-width)_100%]",
        "bg-linear-to-r from-transparent via-foreground/80 via-50% to-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
