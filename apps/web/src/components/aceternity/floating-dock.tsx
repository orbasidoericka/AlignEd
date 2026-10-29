// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

import { SectionLink } from "@/components/blocks/section-link";

// Vendored from Aceternity UI (ui.aceternity.com/components/floating-dock).
// Adapted:
// - No surfaces: the dock and the per-icon circles carry no background,
//   because the trait emblems are their own hex badges.
// - The icon fills its container, so one size drives both (upstream sized a
//   half-size icon inside a filled circle).
// - Distance uses clientX: getBoundingClientRect() is in viewport coordinates,
//   and upstream's pageX drifts from it on a horizontally scrolled page.
// - Links are SectionLinks (same-page smooth scroll, focus moves to the
//   target), and the tooltip also opens on keyboard focus.
// - Reduced motion: no magnify, tooltip without travel.
// - The tooltip sits below the icon: icons grow upward from a fixed bottom
//   edge, so below is the one place it never moves or meets the copy above.
// - Below md the upstream collapse button is replaced by a plain row of the
//   same links: touch has no hover, so there is nothing to magnify.

export interface DockItem {
  title: string;
  icon: React.ReactNode;
  href: string;
}

const REST = 64;
const PEAK = 96;
const REACH = 150;
const SPRING = { mass: 0.1, stiffness: 150, damping: 12 };

const linkClassName =
  "block rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function FloatingDock({
  items,
  className,
  label,
}: {
  items: readonly DockItem[];
  className?: string;
  /** Accessible name for the navigation landmark. */
  label: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      <FloatingDockDesktop items={items} />
      <ul className="flex justify-center gap-2 sm:gap-4 md:hidden">
        {items.map((item) => (
          <li key={item.title}>
            <SectionLink href={item.href} className={linkClassName}>
              <span className="block size-10 sm:size-14">{item.icon}</span>
              <span className="sr-only">{item.title}</span>
            </SectionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function FloatingDockDesktop({ items }: { items: readonly DockItem[] }) {
  const mouseX = useMotionValue(Infinity);
  return (
    <motion.ul
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="mx-auto hidden h-24 items-end justify-center gap-4 md:flex"
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.ul>
  );
}

function IconContainer({
  mouseX,
  title,
  icon,
  href,
}: DockItem & { mouseX: MotionValue<number> }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });
  const sizeTransform = useTransform(
    distance,
    [-REACH, 0, REACH],
    [REST, PEAK, REST],
  );
  const size = useSpring(sizeTransform, SPRING);

  return (
    <li
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <SectionLink href={href} className={linkClassName}>
        <motion.div
          ref={ref}
          style={reduceMotion ? { width: REST, height: REST } : { width: size, height: size }}
          className="relative flex aspect-square items-center justify-center"
        >
          <AnimatePresence>
            {open && (
              <motion.div
                aria-hidden
                initial={{ opacity: 0, y: reduceMotion ? 0 : -10, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -2, x: "-50%" }}
                className="absolute top-full left-1/2 mt-2 w-fit rounded-md border border-border bg-popover px-2 py-0.5 font-heading text-xs font-semibold whitespace-pre text-popover-foreground shadow-bento"
              >
                {title}
              </motion.div>
            )}
          </AnimatePresence>
          <span className="block size-full">{icon}</span>
        </motion.div>
        <span className="sr-only">{title}</span>
      </SectionLink>
    </li>
  );
}
