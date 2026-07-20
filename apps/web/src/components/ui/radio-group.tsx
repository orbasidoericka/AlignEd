// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";

import { cn } from "@/lib/utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive>) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

// Card-style radio option sized for thumbs; the journey's enum inputs (grade,
// strand, Likert) all render through this instead of small dots.
function RadioCard({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadioPrimitive.Root>) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-card"
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3 text-left text-base font-medium text-foreground transition-colors duration-150 select-none",
        "hover:border-muted-foreground/40",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        "data-checked:border-current",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </RadioPrimitive.Root>
  );
}

function RadioCardIndicator({
  className,
  ...props
}: React.ComponentProps<typeof RadioPrimitive.Indicator>) {
  return (
    <RadioPrimitive.Indicator
      data-slot="radio-card-indicator"
      keepMounted
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border transition-colors duration-150",
        "data-checked:border-current data-checked:bg-current",
        className,
      )}
      {...props}
    >
      <span className="size-1.5 rounded-full bg-white" aria-hidden />
    </RadioPrimitive.Indicator>
  );
}

export { RadioGroup, RadioCard, RadioCardIndicator };
