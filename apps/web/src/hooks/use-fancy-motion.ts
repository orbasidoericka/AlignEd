// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useSyncExternalStore } from "react";

// The JavaScript twin of the `fancy:` CSS variant in globals.css: true only on
// a device with a mouse and no reduced-motion request. Effects that track the
// pointer or scroll in JS (GlowingEffect) attach their listeners only then, so
// phones never pay for them.
//
// False on the server and during hydration, so the first client render matches
// the server one; it then follows the media query live.
export const FANCY_MOTION_QUERY =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

function query(): MediaQueryList | null {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(FANCY_MOTION_QUERY)
    : null;
}

function subscribe(onChange: () => void): () => void {
  const list = query();
  list?.addEventListener("change", onChange);
  return () => list?.removeEventListener("change", onChange);
}

const getSnapshot = () => query()?.matches ?? false;
const getServerSnapshot = () => false;

export function useFancyMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
