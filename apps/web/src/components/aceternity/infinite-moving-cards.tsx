"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// Vendored from Aceternity UI (ui.aceternity.com/components/infinite-moving-cards).
// Adapted to AlignEd design tokens; scroll keyframes live in globals.css
// (@theme --animate-scroll).
export function InfiniteMovingCards({
  items,
  direction = "left",
  speed = "slow",
  pauseOnHover = true,
  className,
}: {
  items: {
    quote: string;
    name: string;
    title: string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);

  const addAnimation = useCallback(() => {
    if (!containerRef.current || !scrollerRef.current) return;

    const scrollerContent = Array.from(scrollerRef.current.children);
    scrollerContent.forEach((item) => {
      const duplicatedItem = item.cloneNode(true);
      scrollerRef.current?.appendChild(duplicatedItem);
    });

    containerRef.current.style.setProperty(
      "--animation-direction",
      direction === "left" ? "forwards" : "reverse",
    );
    containerRef.current.style.setProperty(
      "--animation-duration",
      speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s",
    );
    setStart(true);
  }, [direction, speed]);

  useEffect(() => {
    addAnimation();
  }, [addAnimation]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className,
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
      >
        {items.map((item) => (
          <li
            key={item.name}
            className="relative w-[300px] max-w-full shrink-0 rounded-2xl border border-border bg-card px-6 py-5 shadow-sm md:w-[380px] dark:shadow-none"
          >
            <blockquote>
              <span className="relative z-20 text-sm leading-relaxed text-card-foreground">
                {item.quote}
              </span>
              <div className="relative z-20 mt-4 flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {item.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.title}
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
}
