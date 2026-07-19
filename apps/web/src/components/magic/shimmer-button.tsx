import Link from "next/link";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";

import { cn } from "@/lib/utils";

// Vendored from MagicUI (magicui.design/docs/components/shimmer-button).
// Adapted: brand-token default background; optional `href` renders a Next.js
// Link so the CTA can navigate without nesting a button inside an anchor.
// Keyframes live in globals.css (@theme --animate-shimmer-slide/spin-around).
export interface ShimmerButtonProps extends ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  href?: string;
}

export function ShimmerButton({
  shimmerColor = "#ffffff",
  shimmerSize = "0.05em",
  shimmerDuration = "3s",
  borderRadius = "100px",
  background = "oklch(var(--brand))",
  className,
  children,
  href,
  ...props
}: ShimmerButtonProps) {
  const style = {
    "--spread": "90deg",
    "--shimmer-color": shimmerColor,
    "--radius": borderRadius,
    "--speed": shimmerDuration,
    "--cut": shimmerSize,
    "--bg": background,
  } as CSSProperties;

  const rootClassName = cn(
    "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden border border-white/10 px-6 py-3 whitespace-nowrap text-white [background:var(--bg)] [border-radius:var(--radius)]",
    "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
    className,
  );

  const inner = (
    <>
      {/* spark container */}
      <div className="-z-30 absolute inset-0 overflow-visible blur-[2px] [container-type:size]">
        {/* spark */}
        <div className="animate-shimmer-slide absolute inset-0 h-[100cqh] [aspect-ratio:1] [border-radius:0] [mask:none]">
          {/* spark before */}
          <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
        </div>
      </div>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {/* highlight */}
      <div className="absolute inset-0 size-full transform-gpu rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f] transition-all duration-300 ease-in-out group-hover:shadow-[inset_0_-6px_10px_#ffffff3f] group-active:shadow-[inset_0_-10px_10px_#ffffff3f]" />
      {/* backdrop */}
      <div className="absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]" />
    </>
  );

  if (href) {
    return (
      <Link href={href} style={style} className={rootClassName}>
        {inner}
      </Link>
    );
  }

  return (
    <button style={style} className={rootClassName} {...props}>
      {inner}
    </button>
  );
}
