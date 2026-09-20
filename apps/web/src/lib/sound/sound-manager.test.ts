import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { playSound, resetSoundManager, SOUNDS } from "./sound-manager";
import {
  resetSoundPreferenceCache,
  setSoundEnabled,
} from "./sound-preference";

// jsdom has no Web Audio at all, so the whole graph is faked and asserted on.
// The point of interest is scheduling: what is asked to stop, and when.

type ScheduledRamp = { value: number; time: number };

class FakeParam {
  setValueAtTime = vi.fn<(value: number, time: number) => void>();
  linearRampToValueAtTime = vi.fn<(value: number, time: number) => void>();
  cancelScheduledValues = vi.fn();
  value = 1;

  get ramps(): ScheduledRamp[] {
    return this.linearRampToValueAtTime.mock.calls.map(([value, time]) => ({
      value,
      time,
    }));
  }
}

class FakeGain {
  gain = new FakeParam();
  connect = vi.fn();
}

class FakeSource {
  buffer: unknown = null;
  onended: (() => void) | null = null;
  connect = vi.fn();
  start = vi.fn<(when?: number) => void>();
  stop = vi.fn<(when?: number) => void>();
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  currentTime = 10;
  state: AudioContextState = "running";
  destination = {} as AudioDestinationNode;
  sources: FakeSource[] = [];
  gains: FakeGain[] = [];
  resume = vi.fn(async () => {});
  decodeAudioData = vi.fn(async () => ({ duration: 2.61 }) as AudioBuffer);

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createBufferSource() {
    const source = new FakeSource();
    this.sources.push(source);
    return source as unknown as AudioBufferSourceNode;
  }

  createGain() {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain as unknown as GainNode;
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function context() {
  const ctx = FakeAudioContext.instances[0];
  if (!ctx) throw new Error("no AudioContext was created");
  return ctx;
}

describe("sound manager", () => {
  beforeEach(() => {
    FakeAudioContext.instances = [];
    resetSoundManager();
    window.localStorage.clear();
    resetSoundPreferenceCache();
    vi.stubGlobal("AudioContext", FakeAudioContext);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("caps the celebration at exactly 1500ms, fading into the cut", async () => {
    playSound("celebration");
    await flush();

    const ctx = context();
    const source = ctx.sources[0]!;
    const gain = ctx.gains[0]!;
    const startedAt = ctx.currentTime;
    const stopAt = startedAt + SOUNDS.celebration.maxMs! / 1000;

    expect(source.start).toHaveBeenCalledTimes(1);
    expect(source.stop).toHaveBeenCalledWith(stopAt);
    expect(stopAt - startedAt).toBe(1.5);

    // The ramp ends on the same instant the source is cut, so there is no clip.
    const fadeOut = gain.gain.ramps.at(-1)!;
    expect(fadeOut.time).toBe(stopAt);
    expect(fadeOut.value).toBeLessThan(0.01);
    // ...and it begins fadeMs earlier, not at the start of playback.
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(
      SOUNDS.celebration.gain,
      stopAt - SOUNDS.celebration.fadeMs! / 1000,
    );
  });

  it("lets short sounds run to their natural end", async () => {
    playSound("yes");
    await flush();

    const source = context().sources[0]!;
    expect(source.stop).not.toHaveBeenCalled();
    expect(source.start).toHaveBeenCalledWith(0, 0);
  });

  it("plays only the first transient of the default sound", async () => {
    playSound("default");
    await flush();

    const ctx = context();
    const source = ctx.sources[0]!;
    // Skips the dead air, so the click is immediate...
    expect(source.start).toHaveBeenCalledWith(0, SOUNDS.default.startMs! / 1000);
    expect(source.stop).toHaveBeenCalledWith(
      ctx.currentTime + SOUNDS.default.maxMs! / 1000,
    );

    // ...starts on the first transient at 98ms, and ends inside the silence
    // that follows it, so the next transient at 264ms is never heard.
    expect(SOUNDS.default.startMs!).toBeLessThanOrEqual(98);
    expect(SOUNDS.default.startMs! + SOUNDS.default.maxMs!).toBeGreaterThan(110);
    expect(SOUNDS.default.startMs! + SOUNDS.default.maxMs!).toBeLessThan(264);
  });

  it("plays nothing at all while muted", async () => {
    setSoundEnabled(false);
    playSound("default");
    await flush();

    expect(FakeAudioContext.instances).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("stays silent in a backgrounded tab", async () => {
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    playSound("default");
    await flush();

    expect(FakeAudioContext.instances).toHaveLength(0);
    hidden.mockRestore();
  });

  it("cuts the previous copy when the same sound retriggers", async () => {
    playSound("default");
    await flush();
    playSound("default");
    await flush();

    const ctx = context();
    expect(ctx.sources).toHaveLength(2);

    // The first source is faded out rather than left overlapping itself. It
    // already had its own trim stop scheduled, so the retrigger adds a second,
    // earlier stop; the last call is the one that takes effect.
    const stops = ctx.sources[0]!.stop.mock.calls.map(([when]) => when!);
    expect(stops.at(-1)!).toBeLessThan(stops[0]!);
    expect(ctx.gains[0]!.gain.ramps.at(-1)!.value).toBeLessThan(0.01);
  });

  it("reuses one context and one decode across plays", async () => {
    playSound("yes");
    await flush();
    playSound("yes");
    await flush();

    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(context().decodeAudioData).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when the browser has no Web Audio", async () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", undefined);

    expect(() => playSound("yes")).not.toThrow();
    await flush();
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it("survives a failed fetch without breaking later plays", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) })),
    );

    expect(() => playSound("yes")).not.toThrow();
    await flush();
    expect(context().sources).toHaveLength(0);
  });
});
