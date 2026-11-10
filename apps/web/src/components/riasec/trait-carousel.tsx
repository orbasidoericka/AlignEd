// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { letterChip } from "@/lib/riasec/letter-chip-styles";
import type { RiasecLetter } from "@/lib/riasec/types";
import { cn } from "@/lib/utils";

export interface TraitSlide {
  letter: RiasecLetter;
  name: string;
  lang?: string | undefined;
  content: React.ReactNode;
}

interface TraitCarouselProps {
  slides: readonly TraitSlide[];
  label: string;
  showLabel: (name: string) => string;
  slideLabel: (position: number, total: number) => string;
  className?: string | undefined;
}

type Position = "front" | "left" | "right";

const POSITIONS: readonly Position[] = ["front", "left", "right"];
const SWIPE_DISTANCE = 40;
const DRAG_START = 8;
// A trackpad flick keeps firing wheel events through its inertia, so a gesture
// only counts once the wheel has been quiet for this long.
const WHEEL_QUIET_MS = 200;

// --shift and --tilt are set per breakpoint on the stage; --drag follows a
// finger. Every neighbour is the same card scaled down, so only transform moves.
const TRANSFORMS: Readonly<Record<Position, string>> = {
  front: "translateX(var(--drag, 0px))",
  left: "translateX(calc(var(--drag, 0px) - var(--shift))) rotate(calc(var(--tilt) * -1)) scale(0.88)",
  right:
    "translateX(calc(var(--drag, 0px) + var(--shift))) rotate(var(--tilt)) scale(0.88)",
};

const wrap = (index: number, total: number) => (index + total) % total;

// A ring, not a scroller: scroll-snap cannot wrap around, and the card that
// leaves one side has to come back on the other.
export function TraitCarousel({
  slides,
  label,
  showLabel,
  slideLabel,
  className,
}: TraitCarouselProps) {
  const [focused, setFocused] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; moving: boolean } | null>(null);
  const lastWheelRef = useRef(Number.NEGATIVE_INFINITY);

  const total = slides.length;
  const leftIndex = wrap(focused + 1, total);
  const rightIndex = wrap(focused + 2, total);
  const showLeft = () => setFocused(leftIndex);
  const showRight = () => setFocused(rightIndex);

  // Written straight to the DOM: a re-render per pointer move is what would
  // make this stutter on a low-end phone.
  const setDrag = (offset: number | null) => {
    const stage = stageRef.current;
    if (!stage) return;
    if (offset === null) {
      stage.style.removeProperty("--drag");
      delete stage.dataset.dragging;
    } else {
      stage.style.setProperty("--drag", `${offset}px`);
      stage.dataset.dragging = "";
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Touch and pen only: a mouse drag across a card is selecting its text.
    if (event.pointerType === "mouse") return;
    dragRef.current = { x: event.clientX, y: event.clientY, moving: false };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    if (!drag.moving) {
      const dy = event.clientY - drag.y;
      if (Math.abs(dx) < DRAG_START || Math.abs(dx) <= Math.abs(dy)) return;
      drag.moving = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    setDrag(dx / 2);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.moving) return;
    setDrag(null);
    const dx = event.clientX - drag.x;
    if (Math.abs(dx) < SWIPE_DISTANCE) return;
    if (dx > 0) showLeft();
    else showRight();
  };

  const onPointerCancel = () => {
    dragRef.current = null;
    setDrag(null);
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    const quiet = event.timeStamp - lastWheelRef.current > WHEEL_QUIET_MS;
    lastWheelRef.current = event.timeStamp;
    if (!quiet) return;
    if (event.deltaX > 0) showRight();
    else showLeft();
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className={cn("@container flex flex-col gap-3", className)}
    >
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onWheel={onWheel}
        className="group/stage relative grid touch-pan-y justify-items-center overflow-x-clip py-3 [--shift:14.6cqw] [--tilt:2deg] sm:[--shift:17.4cqw] sm:[--tilt:3deg] lg:[--shift:18.6cqw] lg:[--tilt:4deg] print:block print:overflow-visible print:p-0"
      >
        {slides.map((slide, index) => {
          const position = POSITIONS[wrap(index - focused, total)] ?? "front";
          const front = position === "front";
          return (
            <div
              key={slide.letter}
              role="group"
              aria-roledescription="slide"
              aria-label={slideLabel(index + 1, total)}
              data-position={position}
              style={{ transform: TRANSFORMS[position] }}
              className={cn(
                "relative w-[76cqw] [grid-area:1/1] group-data-dragging/stage:transition-none! motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out sm:w-[56cqw] lg:w-[44cqw] print:mb-4 print:w-full print:transform-none!",
                front ? "z-20" : "z-10",
              )}
            >
              {slide.content}
              {/* Darkens a card that is not in front and makes it a tap target.
                  Arrows and rank pills are the keyboard route to the same. */}
              <div
                aria-hidden
                onClick={position === "left" ? showLeft : showRight}
                className={cn(
                  "absolute inset-0 z-10 rounded-[1.75rem] bg-black/12 motion-safe:transition-opacity motion-safe:duration-500 dark:bg-black/30 print:hidden",
                  front ? "pointer-events-none opacity-0" : "cursor-pointer",
                )}
              />
            </div>
          );
        })}

        <SideArrow
          side="left"
          label={showLabel(slides[leftIndex]?.name ?? "")}
          onClick={showLeft}
        />
        <SideArrow
          side="right"
          label={showLabel(slides[rightIndex]?.name ?? "")}
          onClick={showRight}
        />
      </div>

      <div className="flex justify-center gap-2 print:hidden" data-print-hidden>
        {slides.map((slide, index) => (
          <button
            key={slide.letter}
            type="button"
            lang={slide.lang}
            aria-current={index === focused ? "true" : undefined}
            onClick={() => setFocused(index)}
            className={cn(
              "flex min-h-11 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl px-0.5 py-1 font-heading text-xs font-semibold wrap-anywhere transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:flex-none sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm sm:whitespace-nowrap",
              index === focused
                ? letterChip(slide.letter)
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="shrink-0 font-bold whitespace-nowrap">
              #{index + 1}
            </span>
            <span>{slide.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SideArrow({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    // The offset is on a wrapper: Button's pressed state sets its own translate.
    <div
      className={cn(
        "absolute top-1/2 z-30 -translate-y-1/2 print:hidden",
        side === "left" ? "left-0" : "right-0",
      )}
    >
      <Button
        variant="outline"
        size="icon"
        className="size-11 rounded-full shadow-chip"
        aria-label={label}
        onClick={onClick}
      >
        <Icon aria-hidden />
      </Button>
    </div>
  );
}
