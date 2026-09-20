// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect } from "react";

import { playSound, preloadSounds } from "@/lib/sound/sound-manager";

// Everything that reads as a pressable control. Delegation rather than an
// onClick on every component, because ui/button.tsx is a Base UI wrapper with
// no Slot to hook and several CTAs are plain next/link anchors wearing
// buttonVariants, so they never pass through Button at all.
const CLICKABLE = 'button, a[href], [role="button"], [data-slot="button"]';

// The quiz answer cards are role="radio" and carry their own Yes/No sounds;
// they are deliberately absent from the selector so nothing doubles up.

export function SoundProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // A click the page already handled (or a synthetic one) is not a press.
      if (event.defaultPrevented) return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const control = target.closest(CLICKABLE);
      if (!control) return;
      // An opted-out subtree, e.g. the mute toggle turning sound off.
      if (control.closest('[data-sound="off"]')) return;
      if (
        control.matches(":disabled") ||
        control.getAttribute("aria-disabled") === "true"
      ) {
        return;
      }

      playSound("default");
    };

    // Capture, so a handler calling stopPropagation still gets its click sound.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    // Warm the byte cache once the page is idle; decoding waits for the first
    // gesture, so this costs nothing but removes the first-click delay.
    const idle = window.requestIdleCallback?.bind(window);
    if (idle) {
      const handle = idle(() => preloadSounds());
      return () => window.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(preloadSounds, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return <>{children}</>;
}
