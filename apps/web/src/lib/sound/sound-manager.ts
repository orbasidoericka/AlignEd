// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { getSoundEnabled } from "./sound-preference";

// UI sound on the Web Audio API rather than <audio> or a library: a fresh
// BufferSource per play lets fast Yes/No taps overlap instead of cutting each
// other off, and the celebration's cutoff is scheduled on the audio clock, so
// it lands exactly on time instead of drifting the way a setTimeout would.

export type SoundName = "default" | "yes" | "no" | "celebration";

type SoundConfig = {
  src: string;
  /** Peak gain, 0-1. The raw files are not level-matched. */
  gain: number;
  /** Skip this much of the head, e.g. leading silence before a transient. */
  startMs?: number;
  /** Hard ceiling on playback, measured from startMs; the source stops here. */
  maxMs?: number;
  /** Ramp to silence over this long, ending exactly at the ceiling. */
  fadeMs?: number;
};

export const SOUNDS: Record<SoundName, SoundConfig> = {
  // The file is a string of four separate transients (98, 264, 630 and 790ms)
  // behind 94ms of dead air, and each one reads as its own click. A UI click
  // wants exactly one: skip the silence, play the first transient and its
  // short decay, and stop in the silence well before the next one at 264ms.
  default: { src: "/sounds/default.mp3", gain: 0.45, startMs: 94, maxMs: 86, fadeMs: 24 },
  yes: { src: "/sounds/yes.mp3", gain: 0.85 },
  no: { src: "/sounds/no.mp3", gain: 0.85 },
  // The track runs 2.61s; the brief caps the reward at 1.5s, and cutting a
  // held note dead clips audibly, so the last 220ms ramp out.
  celebration: { src: "/sounds/celebration.mp3", gain: 0.9, maxMs: 1500, fadeMs: 220 },
};

/** Never ramp a gain to exactly 0: an exponential ramp would be invalid and a
 *  0 target reads as "already there" on some implementations. */
const SILENCE = 0.0001;
/** Fade applied when a sound is cut short by a repeat of itself. */
const RETRIGGER_FADE_MS = 40;

type Playing = { source: AudioBufferSourceNode; gain: GainNode };

let context: AudioContext | null = null;
const encoded = new Map<SoundName, Promise<ArrayBuffer>>();
const decoded = new Map<SoundName, AudioBuffer>();
const playing = new Map<SoundName, Playing>();

function audioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

// Built on the first play, which always follows a click or a keypress, so the
// context is never created in a state the autoplay policy would block.
function getContext(): AudioContext | null {
  if (context) return context;
  const Ctor = audioContextCtor();
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

// Stage one of preload: fetch the bytes. No AudioContext is involved, so this
// can run on idle without tripping the "was not allowed to start" warning.
function fetchSound(name: SoundName): Promise<ArrayBuffer> {
  const cached = encoded.get(name);
  if (cached) return cached;
  const request = fetch(SOUNDS[name].src).then((response) => {
    if (!response.ok) throw new Error(`sound ${name}: ${response.status}`);
    return response.arrayBuffer();
  });
  // A failed fetch must not poison the cache, or the sound is dead for the
  // rest of the session.
  request.catch(() => encoded.delete(name));
  encoded.set(name, request);
  return request;
}

/** Warms the byte cache. Safe to call repeatedly and before any interaction. */
export function preloadSounds(): void {
  if (typeof window === "undefined") return;
  for (const name of Object.keys(SOUNDS) as SoundName[]) {
    fetchSound(name).catch(() => {
      // Offline or a missing file: play() stays a no-op, nothing else breaks.
    });
  }
}

// Stage two: decode, which does need the context, so it waits for the gesture.
// decodeAudioData detaches the ArrayBuffer it is given, so each decode gets its
// own copy and the cached bytes stay reusable.
async function getBuffer(
  ctx: AudioContext,
  name: SoundName,
): Promise<AudioBuffer | null> {
  const ready = decoded.get(name);
  if (ready) return ready;
  try {
    const bytes = await fetchSound(name);
    const buffer = await ctx.decodeAudioData(bytes.slice(0));
    decoded.set(name, buffer);
    return buffer;
  } catch {
    return null;
  }
}

function stopPlaying(entry: Playing, ctx: AudioContext, fadeMs: number): void {
  const endsAt = ctx.currentTime + fadeMs / 1000;
  try {
    entry.gain.gain.cancelScheduledValues(ctx.currentTime);
    entry.gain.gain.setValueAtTime(entry.gain.gain.value, ctx.currentTime);
    entry.gain.gain.linearRampToValueAtTime(SILENCE, endsAt);
    entry.source.stop(endsAt);
  } catch {
    // Already stopped; nothing to unwind.
  }
}

/**
 * Plays a UI sound. Every failure path — muted, hidden tab, no Web Audio, a
 * missing file — is a silent no-op, because audio is decoration and must never
 * be able to break the interaction that triggered it.
 */
export function playSound(name: SoundName): void {
  const config = SOUNDS[name];
  if (!config) return;
  if (!getSoundEnabled()) return;
  // A sound firing into a backgrounded tab is startling and always unwanted.
  if (typeof document !== "undefined" && document.hidden) return;

  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  void getBuffer(ctx, name).then((buffer) => {
    if (!buffer) return;
    // Re-checked after the await: the student may have muted, or left the tab,
    // while the first decode was still running.
    if (!getSoundEnabled()) return;
    if (typeof document !== "undefined" && document.hidden) return;

    const previous = playing.get(name);
    if (previous) stopPlaying(previous, ctx, RETRIGGER_FADE_MS);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(config.gain, ctx.currentTime);
    source.connect(gain);
    gain.connect(ctx.destination);

    const entry: Playing = { source, gain };
    playing.set(name, entry);
    source.onended = () => {
      if (playing.get(name) === entry) playing.delete(name);
    };

    source.start(0, (config.startMs ?? 0) / 1000);

    if (config.maxMs !== undefined) {
      const stopAt = ctx.currentTime + config.maxMs / 1000;
      const fade = (config.fadeMs ?? RETRIGGER_FADE_MS) / 1000;
      gain.gain.setValueAtTime(config.gain, stopAt - fade);
      gain.gain.linearRampToValueAtTime(SILENCE, stopAt);
      source.stop(stopAt);
    }
  });
}

/** Cuts every sound currently playing, e.g. the moment sound is muted. */
export function stopAllSounds(): void {
  const ctx = context;
  if (!ctx) return;
  for (const entry of playing.values()) {
    stopPlaying(entry, ctx, RETRIGGER_FADE_MS);
  }
  playing.clear();
}

/** Test seam: drops the context and every cache. */
export function resetSoundManager(): void {
  context = null;
  encoded.clear();
  decoded.clear();
  playing.clear();
}
