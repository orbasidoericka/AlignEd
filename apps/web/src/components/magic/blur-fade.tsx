"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  type UseInViewOptions,
  type Variants,
} from "framer-motion";

// Vendored from MagicUI (magicui.design/docs/components/blur-fade).
// Adapted to import from framer-motion (the repo's installed motion package).
// No blur by default: animating `filter` on whole sections repainted them
// every frame on low-end phones and left a `filter: blur(0px)` layer behind
// on every wrapper. Opacity and a small offset run on the GPU. Pass `blur`
// to opt back in on something small. No AnimatePresence: nothing here exits.
// Content above the fold uses the CSS `animate-fade-up` instead, so it paints
// before this component's JavaScript has loaded.
type MarginType = UseInViewOptions["margin"];

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: Variants;
  duration?: number;
  delay?: number;
  offset?: number;
  direction?: "up" | "down" | "left" | "right";
  inView?: boolean;
  inViewMargin?: MarginType;
  blur?: string;
}

export function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  offset = 6,
  direction = "down",
  inView = false,
  inViewMargin = "-50px",
  blur,
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isInView = !inView || inViewResult;
  const axis = direction === "left" || direction === "right" ? "x" : "y";
  const defaultVariants: Variants = {
    hidden: {
      [axis]: direction === "right" || direction === "down" ? -offset : offset,
      opacity: 0,
      ...(blur && { filter: `blur(${blur})` }),
    },
    visible: {
      [axis]: 0,
      opacity: 1,
      ...(blur && { filter: "blur(0px)" }),
    },
  };
  const combinedVariants = variant || defaultVariants;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={combinedVariants}
      transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
