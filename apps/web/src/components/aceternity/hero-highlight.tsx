"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";

import { cn } from "@/lib/utils";

// Vendored from Aceternity UI (ui.aceternity.com/components/hero-highlight).
// Adapted: framer-motion imports; dot/highlight colors mapped to the AlignEd
// teal palette; dark variants driven by the .dark class like the rest of the app.
export function HeroHighlight({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const dotPattern = (color: string) => ({
    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none'%3E%3Ccircle fill='${encodeURIComponent(
      color,
    )}' cx='10' cy='10' r='1.6257'/%3E%3C/svg%3E")`,
  });

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    if (!currentTarget) return;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        "group relative flex w-full items-center justify-center",
        containerClassName,
      )}
      onMouseMove={handleMouseMove}
    >
      <div
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={dotPattern("#d4d4d8")}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={dotPattern("#334155")}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 dark:hidden"
        style={{
          ...dotPattern("#14b8a6"),
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 hidden opacity-0 transition duration-300 group-hover:opacity-100 dark:block"
        style={{
          ...dotPattern("#2dd4bf"),
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
        }}
      />
      <div className={cn("relative z-20", className)}>{children}</div>
    </div>
  );
}

export function Highlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      initial={{ backgroundSize: "0% 100%" }}
      whileInView={{ backgroundSize: "100% 100%" }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, ease: "linear", delay: 0.4 }}
      style={{
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        display: "inline",
      }}
      className={cn(
        "relative inline-block rounded-lg bg-linear-to-r from-teal-200 to-amber-200 px-1 pb-1 dark:from-teal-700 dark:to-amber-700",
        className,
      )}
    >
      {children}
    </motion.span>
  );
}
