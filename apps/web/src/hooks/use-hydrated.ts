// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useSyncExternalStore } from "react";

// False on the server and during hydration, true afterwards.
//
// Anything read from localStorage (the zustand store, the sound preference)
// differs between the server render and the first client render, so it has to
// be gated on this or React reports a hydration mismatch. Subscribing to
// nothing is deliberate: the value flips once, when React swaps the server
// snapshot for the client one, and never changes again.
const noopSubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, getSnapshot, getServerSnapshot);
}
