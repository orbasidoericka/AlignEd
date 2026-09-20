// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { playSound, stopAllSounds } from "@/lib/sound/sound-manager";
import { setSoundEnabled, useSoundEnabled } from "@/lib/sound/sound-preference";
import { Button } from "@/components/ui/button";

// False on the server and during hydration, true afterwards: the stored
// preference cannot be known until the client runs, and unlike ThemeToggle
// there is no CSS class to let markup decide for itself.
const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function SoundToggle() {
  const hydrated = useHydrated();
  const enabled = useSoundEnabled();

  // Same footprint as the rendered button, so the bar does not shift when the
  // real state arrives.
  if (!hydrated) return <div className="size-9" aria-hidden="true" />;

  const next = !enabled;

  return (
    <Button
      variant="ghost"
      size="icon"
      // Muting must not itself make a sound; unmuting plays one, so the
      // choice confirms itself.
      data-sound={next ? undefined : "off"}
      aria-label={next ? "Turn sound on" : "Turn sound off"}
      aria-pressed={enabled}
      onClick={() => {
        setSoundEnabled(next);
        if (next) playSound("default");
        else stopAllSounds();
      }}
    >
      {enabled ? <Volume2 /> : <VolumeX />}
    </Button>
  );
}
