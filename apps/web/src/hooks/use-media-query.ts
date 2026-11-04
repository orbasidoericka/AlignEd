// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useSyncExternalStore } from "react";

// Follows a CSS media query live. False on the server, during hydration and
// wherever matchMedia does not exist, so the first client render matches the
// server one. Use it only for what CSS cannot express (an aria state, a
// handler that behaves differently on a phone); layout belongs in CSS.
export function useMediaQuery(query: string): boolean {
  const subscribe = (onChange: () => void) => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return () => {};
    }
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  };
  const getSnapshot = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false;
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
