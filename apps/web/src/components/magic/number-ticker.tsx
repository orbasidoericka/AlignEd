"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

import { cn } from "@/lib/utils";

// Vendored from MagicUI (magicui.design/docs/components/number-ticker).
// Adapted to import from framer-motion (the repo's installed motion package).
interface NumberTickerProps extends React.ComponentPropsWithoutRef<"span"> {
  value: number;
  direction?: "up" | "down";
  delay?: number; // seconds
  decimalPlaces?: number;
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  decimalPlaces = 0,
  className,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      motionValue.set(direction === "down" ? 0 : value);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [motionValue, isInView, delay, value, direction]);

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = Intl.NumberFormat("en-US", {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(Number(latest.toFixed(decimalPlaces)));
        }
      }),
    [springValue, decimalPlaces],
  );

  return (
    <span
      ref={ref}
      className={cn("inline-block tabular-nums tracking-wider", className)}
      {...props}
    >
      {Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(direction === "down" ? value : 0)}
    </span>
  );
}
