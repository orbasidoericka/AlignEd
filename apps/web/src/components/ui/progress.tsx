// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn } from "@/lib/utils";

interface ProgressProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

function Progress({
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root data-slot="progress" {...props}>
      <ProgressPrimitive.Track
        className={cn(
          "block h-2.5 w-full overflow-hidden rounded-full bg-muted",
          className,
        )}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "block h-full rounded-full bg-primary transition-[width] duration-300 ease-out",
            indicatorClassName,
          )}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
