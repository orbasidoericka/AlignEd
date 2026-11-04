import { cn } from "@/lib/utils";

// Vendored from Aceternity UI (ui.aceternity.com/components/background-gradient).
// Adapted: pure CSS instead of motion/react (the JS backgroundPosition loop
// repainted a blurred layer every frame and ignored MotionConfig reduced
// motion), AlignEd palette via the `bg-answer-glow` utility, and an
// "interactive" mode: the pan animation stays attached but paused, and runs
// only while the card is hovered, keyboard-focused, or checked, so it resumes
// smoothly instead of snapping back. Keyframes live in globals.css.
//
// Upstream's gradient border is gone: the glow alone is the effect. The 3px
// frame tracing every answer card read as a second, competing outline next to
// the card's own border and never stopped moving, so the children now draw
// their own edge and this wraps them without insetting them.

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
  glowClassName = "bg-answer-glow",
  animate = "interactive",
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  // Fill of the glow layer. Defaults to the blue/mustard stage gradient; a
  // card with its own meaning (the quiz's Yes / No) passes a single tone.
  glowClassName?: string;
  animate?: GradientAnimation;
}) {
  // The pan re-blurs the glow every frame, so it runs only on mouse devices.
  // Phones still get the glow, held still.
  const motion = animate !== "never" && "fancy:animate-gradient-pan";

  return (
    <div className={cn("group relative", containerClassName)}>
      {/* Glow: hidden at rest in interactive mode, blooms on interaction.
          Sits slightly outside the card and blurs wide, so the falloff is a
          glow rather than a soft-edged slab tracing the card's rectangle. */}
      <div
        aria-hidden
        className={cn(
          "absolute -inset-1 z-[1] rounded-[1.75rem] blur-2xl transition-opacity duration-500",
          glowClassName,
          animate === "always" ? "opacity-70" : "opacity-0",
          "group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 group-has-[[data-checked]]:opacity-100",
          motion,
          playState[animate],
        )}
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}
