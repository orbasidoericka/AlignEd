import { cn } from "@/lib/utils";

// Vendored from Aceternity UI (ui.aceternity.com/components/background-gradient).
// Adapted: pure CSS instead of motion/react (the JS backgroundPosition loop
// repainted a blurred layer every frame and ignored MotionConfig reduced
// motion), AlignEd palette via the `bg-answer-gradient` utility, and an
// "interactive" mode: the pan animation stays attached but paused, and runs
// only while the card is hovered, keyboard-focused, or checked, so it resumes
// smoothly instead of snapping back. Keyframes live in globals.css.

type GradientAnimation = "interactive" | "always" | "never";

const playState: Record<GradientAnimation, string> = {
  always: "[animation-play-state:running]",
  interactive:
    "[animation-play-state:paused] group-hover:[animation-play-state:running] group-has-[:focus-visible]:[animation-play-state:running] group-has-[[data-checked]]:[animation-play-state:running]",
  never: "",
};

export function BackgroundGradient({
  children,
  className,
  containerClassName,
  animate = "interactive",
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: GradientAnimation;
}) {
  const motion = animate !== "never" && "motion-safe:animate-gradient-pan";

  return (
    <div className={cn("group relative p-[3px]", containerClassName)}>
      {/* Glow: hidden at rest in interactive mode, blooms on interaction. */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 z-[1] rounded-3xl bg-answer-gradient blur-xl transition-opacity duration-500",
          animate === "always" ? "opacity-60" : "opacity-0",
          "group-hover:opacity-80 group-has-[:focus-visible]:opacity-100 group-has-[[data-checked]]:opacity-100",
          motion,
          playState[animate],
        )}
      />
      {/* Gradient border: always visible, pans only when animating. */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 z-[1] rounded-3xl bg-answer-gradient",
          motion,
          playState[animate],
        )}
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}
