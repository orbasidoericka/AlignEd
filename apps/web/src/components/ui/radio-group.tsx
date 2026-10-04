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
// quiz yes/no) all render through this instead of small dots.
function RadioCard({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadioPrimitive.Root>) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-card"
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3 text-left text-base font-medium text-foreground select-none",
        // box-shadow is in the list because inset-ring compiles to one.
        "transition-[color,background-color,border-color,box-shadow] duration-150",
        // Hover/focus are drawn in `currentColor`, which each surface already
        // sets for its own stage (blue via text-stage-assessment-strong on the
        // quiz, gold via text-stage-profile-strong on Profile Setup), so one
        // rule stays stage-correct instead of hard-coding a blue tint onto a
        // yellow screen. The card's own 2px border goes to full strength and
        // the surface takes a 15% wash: the border is what makes it
        // unmistakable (5.5:1 against its own wash in light, 7.6:1 in dark),
        // while the wash alone would not be. Resting is a filled card with a
        // hairline, selected is a filled card with an opaque accent and a
        // check mark, so hover reads as "outlined" and can be mistaken for
        // neither. A card that drops the border (the quiz answers, which wear
        // a gradient frame instead) re-adds the outline as an inset ring.
        // Scoped with data-unchecked (Base UI sets it whenever the radio is
        // not checked) so hover can never fight the checked styles for
        // specificity, and so the chosen card stops offering itself.
        "data-unchecked:hover:border-current data-unchecked:hover:control-wash",
        // Keyboard parity: focus-visible gets the same treatment as hover, on
        // top of the ring below, so tabbing is never the quieter path.
        "data-unchecked:focus-visible:border-current data-unchecked:focus-visible:control-wash",
        // Touch has no hover, so the press itself has to answer. Deeper than
        // the hover wash and it fires on tap.
        "data-unchecked:active:control-wash-strong",
        // Solid ring token (≥3:1 on card and page) with an offset so it
        // stays distinct from the card's own border or gradient frame.
        "focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        "data-checked:border-current",
        // Disabled must not light up: pointer-events already blocks hover, but
        // a disabled card can still be focused.
        "disabled:pointer-events-none disabled:opacity-50 disabled:inset-ring-0 disabled:bg-card disabled:bg-none",
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
