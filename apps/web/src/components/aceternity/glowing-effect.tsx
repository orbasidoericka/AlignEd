"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import {
  animate,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "framer-motion";

import { cn } from "@/lib/utils";

// Vendored from Aceternity UI (ui.aceternity.com/components/glowing-effect).
// Adapted:
// - `animate` from framer-motion (the repo's motion package) instead of
//   motion/react, and the previous angle tween is stopped before a new one
//   starts; upstream stacked a fresh tween on every pointer frame.
// - AlignEd palette gradient via tokens, so both themes work; the "white"
//   variant uses the foreground token instead of an undefined --black.
// - Reduced motion: the glow still tracks the pointer but jumps instead of
//   sweeping around the border.

interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  variant?: "default" | "white";
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
}

// Four palette stops: deep blue, brand blue, sage-strong, cream-strong. The
// -strong tokens are pastel in dark mode, so one gradient serves both.
const PALETTE_GRADIENT = `radial-gradient(circle, var(--stage-assessment-strong) 10%, transparent 20%),
  radial-gradient(circle at 40% 40%, var(--stage-profile-strong) 5%, transparent 15%),
  radial-gradient(circle at 60% 60%, var(--stage-results-strong) 10%, transparent 20%),
  radial-gradient(circle at 40% 60%, var(--primary) 10%, transparent 20%),
  repeating-conic-gradient(
    from 236.84deg at 50% 50%,
    var(--stage-assessment-strong) 0%,
    var(--primary) calc(25% / var(--repeating-conic-gradient-times)),
    var(--stage-results-strong) calc(50% / var(--repeating-conic-gradient-times)),
    var(--stage-profile-strong) calc(75% / var(--repeating-conic-gradient-times)),
    var(--stage-assessment-strong) calc(100% / var(--repeating-conic-gradient-times))
  )`;

const WHITE_GRADIENT = `repeating-conic-gradient(
  from 236.84deg at 50% 50%,
  var(--foreground),
  var(--foreground) calc(25% / var(--repeating-conic-gradient-times))
)`;

const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.7,
    proximity = 0,
    spread = 20,
    variant = "default",
    glow = false,
    className,
    movementDuration = 2,
    borderWidth = 1,
    disabled = true,
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number>(0);
    const tweenRef = useRef<AnimationPlaybackControls | null>(null);
    const reduceMotion = useReducedMotion();

    const handleMove = useCallback(
      (e?: MouseEvent | { x: number; y: number }) => {
        if (!containerRef.current) return;

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          const element = containerRef.current;
          if (!element) return;

          const { left, top, width, height } = element.getBoundingClientRect();
          const mouseX = e?.x ?? lastPosition.current.x;
          const mouseY = e?.y ?? lastPosition.current.y;

          if (e) {
            lastPosition.current = { x: mouseX, y: mouseY };
          }

          const centerX = left + width * 0.5;
          const centerY = top + height * 0.5;
          const distanceFromCenter = Math.hypot(
            mouseX - centerX,
            mouseY - centerY,
          );
          const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

          if (distanceFromCenter < inactiveRadius) {
            element.style.setProperty("--active", "0");
            return;
          }

          const isActive =
            mouseX > left - proximity &&
            mouseX < left + width + proximity &&
            mouseY > top - proximity &&
            mouseY < top + height + proximity;

          element.style.setProperty("--active", isActive ? "1" : "0");

          if (!isActive) return;

          const currentAngle =
            parseFloat(element.style.getPropertyValue("--start")) || 0;
          const targetAngle =
            (180 * Math.atan2(mouseY - centerY, mouseX - centerX)) /
              Math.PI +
            90;

          const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
          const newAngle = currentAngle + angleDiff;

          tweenRef.current?.stop();
          if (reduceMotion) {
            element.style.setProperty("--start", String(newAngle));
            return;
          }
          tweenRef.current = animate(currentAngle, newAngle, {
            duration: movementDuration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (value) => {
              element.style.setProperty("--start", String(value));
            },
          });
        });
      },
      [inactiveZone, proximity, movementDuration, reduceMotion],
    );

    useEffect(() => {
      if (disabled) return;

      const handleScroll = () => handleMove();
      const handlePointerMove = (e: PointerEvent) => handleMove(e);

      window.addEventListener("scroll", handleScroll, { passive: true });
      document.body.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        tweenRef.current?.stop();
        window.removeEventListener("scroll", handleScroll);
        document.body.removeEventListener("pointermove", handlePointerMove);
      };
    }, [handleMove, disabled]);

    return (
      <>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -inset-px hidden rounded-[inherit] border opacity-0 transition-opacity",
            glow && "opacity-100",
            variant === "white" && "border-white",
            disabled && "!block",
          )}
        />
        <div
          ref={containerRef}
          aria-hidden
          style={
            {
              "--blur": `${blur}px`,
              "--spread": spread,
              "--start": "0",
              "--active": "0",
              "--glowingeffect-border-width": `${borderWidth}px`,
              "--repeating-conic-gradient-times": "5",
              "--gradient":
                variant === "white" ? WHITE_GRADIENT : PALETTE_GRADIENT,
            } as React.CSSProperties
          }
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",
            glow && "opacity-100",
            blur > 0 && "blur-[var(--blur)]",
            className,
            disabled && "!hidden",
          )}
        >
          <div
            className={cn(
              "glow",
              "rounded-[inherit]",
              'after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))] after:rounded-[inherit] after:content-[""]',
              "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
              "after:[background:var(--gradient)] after:[background-attachment:fixed]",
              "after:opacity-[var(--active)] after:transition-opacity after:duration-300",
              "after:[mask-clip:padding-box,border-box]",
              "after:[mask-composite:intersect]",
              "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]",
            )}
          />
        </div>
      </>
    );
  },
);

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };
