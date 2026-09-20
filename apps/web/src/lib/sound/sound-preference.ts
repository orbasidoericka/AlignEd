// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useSyncExternalStore } from "react";

// Whether UI sound is allowed to play. Sound ships on, because the feedback is
// the point, but students may be taking the quiz in a classroom or on a shared
// phone, so the choice has to persist and has to be one tap away.
export const SOUND_STORAGE_KEY = "aligned.sound";

const ON = "on";
const OFF = "off";

// Mirrors the reason useAssessmentStore keeps an inert storage rather than
// undefined: every caller can read it unconditionally, on the server too.
function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // Private mode and blocked site data both throw on access, not on use.
    return null;
  }
}

const listeners = new Set<() => void>();

// Cached so getSnapshot is cheap and, more importantly, referentially stable:
// useSyncExternalStore re-renders in a loop if the snapshot keeps changing.
let enabled: boolean | null = null;

function read(): boolean {
  const store = storage();
  if (!store) return true;
  try {
    return store.getItem(SOUND_STORAGE_KEY) !== OFF;
  } catch {
    return true;
  }
}

export function getSoundEnabled(): boolean {
  if (enabled === null) enabled = read();
  return enabled;
}

export function setSoundEnabled(next: boolean): void {
  enabled = next;
  try {
    storage()?.setItem(SOUND_STORAGE_KEY, next ? ON : OFF);
  } catch {
    // A failed write still leaves the in-memory value correct for this tab.
  }
  for (const listener of listeners) listener();
}

export function subscribeSound(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Muting in one tab mutes the others: the storage event only fires in tabs
// that did not make the change, so this never double-notifies the writer.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== SOUND_STORAGE_KEY) return;
    enabled = event.newValue !== OFF;
    for (const listener of listeners) listener();
  });
}

/** Test seam: drops the cached value so the next read hits storage again. */
export function resetSoundPreferenceCache(): void {
  enabled = null;
}

export function useSoundEnabled(): boolean {
  // The server cannot know the stored choice; it renders the default and the
  // toggle waits for hydration before showing a state.
  return useSyncExternalStore(subscribeSound, getSoundEnabled, () => true);
}
