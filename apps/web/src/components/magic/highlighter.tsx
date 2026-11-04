"use client";

import { useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import type { RoughAnnotation } from "rough-notation/lib/model";

// Vendored from MagicUI (magicui.design/docs/components/highlighter).
// Adapted:
// - framer-motion instead of motion/react (the repo's motion package).
// - useEffect, not useLayoutEffect: the component is server-rendered and
//   useLayoutEffect warns during SSR.
// - `darkColor`, because a marker sized for dark text on a light page is
//   unreadable behind light text in dark mode.
// - Reduced motion draws the annotation instantly instead of animating it.
// - rough-notation is imported when the mark is drawn, not with the page, so
//   it stays out of the landing page's first download.
// - A reflow redraws the mark in place without replaying the stroke: on
//   phones the URL bar resizes the page as it hides, and each resize used to
//   restart the full draw animation.

type AnnotationAction =
  | "highlight"
  | "underline"
  | "box"
  | "circle"
  | "strike-through"
  | "crossed-off"
  | "bracket";

interface HighlighterProps {
  children: React.ReactNode;
  action?: AnnotationAction;
  /** Light-theme color. rough-notation draws SVG, so pass a real color. */
  color?: string;
  /** Dark-theme color; falls back to `color`. */
  darkColor?: string;
  strokeWidth?: number;
  animationDuration?: number;
  iterations?: number;
  padding?: number;
  multiline?: boolean;
  /** Wait until the text scrolls into view before drawing. */
  isView?: boolean;
  /** Milliseconds to wait before drawing, for sequencing several marks. */
  delay?: number;
}

export function Highlighter({
  children,
  action = "highlight",
  color = "#ffd1dc",
  darkColor,
  strokeWidth = 1.5,
  animationDuration = 600,
  iterations = 2,
  padding = 2,
  multiline = true,
  isView = false,
  delay = 0,
}: HighlighterProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();

  const isInView = useInView(elementRef, { once: true, margin: "-10%" });
  const shouldShow = !isView || isInView;
  const drawColor =
    resolvedTheme === "dark" && darkColor ? darkColor : color;

  useEffect(() => {
    const element = elementRef.current;
    if (!shouldShow || !element) return;

    let annotation: RoughAnnotation | null = null;
    let cancelled = false;
    let drawn = false;

    // rough-notation has no delay option; hold the draw so several marks can
    // land one after the other. Reduced motion draws everything at once.
    const startDelay = reduceMotion ? 0 : delay;
    const startTimer = setTimeout(() => {
      void import("rough-notation").then(({ annotate }) => {
        if (cancelled) return;
        annotation = annotate(element, {
          type: action,
          color: drawColor,
          strokeWidth,
          animationDuration,
          iterations,
          padding,
          multiline,
          animate: !reduceMotion,
        });
        drawn = true;
        annotation.show();
      });
    }, startDelay);

    // Re-draw when the text reflows (font load, resize, zoom). ResizeObserver
    // fires once as soon as it starts observing, so ignore callbacks until
    // the delayed draw has happened; otherwise that first callback shows the
    // annotation immediately and the delay never applies. The redraw is
    // instant: the stroke animation plays once, on the first draw only.
    const resizeObserver = new ResizeObserver(() => {
      if (!drawn || !annotation) return;
      annotation.animate = false;
      annotation.hide();
      annotation.show();
    });
    resizeObserver.observe(element);
    resizeObserver.observe(document.body);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      annotation?.remove();
      annotation = null;
      resizeObserver.disconnect();
    };
  }, [
    shouldShow,
    action,
    drawColor,
    strokeWidth,
    animationDuration,
    iterations,
    padding,
    multiline,
    reduceMotion,
    delay,
  ]);

  return (
    <span ref={elementRef} className="relative inline-block bg-transparent">
      {children}
    </span>
  );
}
