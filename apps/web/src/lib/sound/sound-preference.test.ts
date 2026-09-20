import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getSoundEnabled,
  resetSoundPreferenceCache,
  setSoundEnabled,
  SOUND_STORAGE_KEY,
  subscribeSound,
} from "./sound-preference";

describe("sound preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetSoundPreferenceCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to on, so the feedback ships audible", () => {
    expect(getSoundEnabled()).toBe(true);
  });

  it("round-trips the choice through localStorage", () => {
    setSoundEnabled(false);
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe("off");
    resetSoundPreferenceCache();
    expect(getSoundEnabled()).toBe(false);

    setSoundEnabled(true);
    resetSoundPreferenceCache();
    expect(getSoundEnabled()).toBe(true);
  });

  it("notifies subscribers and stops after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSound(listener);

    setSoundEnabled(false);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    setSoundEnabled(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stays on when storage throws, rather than failing closed", () => {
    resetSoundPreferenceCache();
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(getSoundEnabled()).toBe(true);
  });
});
