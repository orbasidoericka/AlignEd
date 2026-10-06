// Copyright (c) 2026 EdTech. All rights reserved.

import Image from "next/image";

import { cn } from "@/lib/utils";

// The brand wordmark, shared by the header and the footer so the two can
// never drift. One file for both themes: the mark is palette blue and palette
// yellow, and both read on either ground (5.90:1 and 17.37:1 on the dark page;
// the blue carries the light one). It used to be two files because the
// original navy sat at ~1.7:1 on dark, which no filter fixes honestly; the
// recolour removed that reason, so the second file went with it.
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
  return (
    <Image
      src="/aligned-wordmark.png"
      alt="AlignEd"
      width={WORDMARK_WIDTH}
      height={WORDMARK_HEIGHT}
      priority={priority}
      className={cn("w-auto object-contain drop-shadow-wordmark", className)}
    />
  );
}
