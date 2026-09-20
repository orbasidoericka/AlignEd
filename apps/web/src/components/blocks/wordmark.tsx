// Copyright (c) 2026 EdTech. All rights reserved.

import Image from "next/image";

import { cn } from "@/lib/utils";

// The brand wordmark, shared by the header and the footer so the two can
// never drift. Two files rather than one recolored by CSS: the mark is a
// raster PNG, and the navy in it sits at ~1.7:1 on the dark ground, which
// no filter fixes honestly. The dark file lifts only the navy to
// --primary-strong; the yellow already clears 7:1 and is left alone.
const WORDMARK_WIDTH = 1200;
const WORDMARK_HEIGHT = 274;

export function Wordmark({
  className,
  priority = false,
}: {
  /** Sets the height; width follows the 4.38:1 aspect ratio. */
  className?: string;
  priority?: boolean;
}) {
  // One wrapper, not a fragment: two siblings would each be counted by a
  // parent `space-y-*`, giving the visible mark a stray margin in one theme
  // and not the other.
  return (
    <span className={cn("inline-flex items-center", className)}>
      {/* Exactly one copy is displayed at a time, so only one reaches the
          accessibility tree and the name is spoken once. */}
      <Image
        src="/aligned-wordmark.png"
        alt="AlignEd"
        width={WORDMARK_WIDTH}
        height={WORDMARK_HEIGHT}
        priority={priority}
        className="h-full w-auto object-contain dark:hidden"
      />
      <Image
        src="/aligned-wordmark-dark.png"
        alt="AlignEd"
        width={WORDMARK_WIDTH}
        height={WORDMARK_HEIGHT}
        priority={priority}
        className="hidden h-full w-auto object-contain dark:block"
      />
    </span>
  );
}
