// Copyright (c) 2026 EdTech. All rights reserved.

import Image from "next/image";

import { cn } from "@/lib/utils";

// The brand wordmark, shared by the header and the footer so the two can
// never drift. One file for both themes: the mark is palette blue and a mustard
// yellow (#FFC000, the "ED" and the cap). The neon palette yellow measured
// 1.08:1 on the white header glass and vanished; the mustard is ~1.6:1 there
// and reads strongly on the dark page, with the blue carrying the rest. It used to
// be two files because the original navy sat at ~1.7:1 on dark, which no
// filter fixes honestly; the recolour removed that reason, so the second file
// went with it. No shadow: the header sits the mark on a white glass surface.
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
      className={cn("w-auto object-contain", className)}
    />
  );
}
