// Copyright (c) 2026 EdTech. All rights reserved.
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAssessmentStore } from "@/store/useAssessmentStore";

import { ResultsExpiryNote } from "./results-expiry-note";

const hydrated = vi.hoisted(() => ({ current: true }));
vi.mock("@/hooks/use-hydrated", () => ({ useHydrated: () => hydrated.current }));

const NOW = new Date("2026-10-01T12:00:00Z");

describe("ResultsExpiryNote", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    hydrated.current = true;
    useAssessmentStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const stamp = (agoMs: number) =>
    useAssessmentStore.setState({
      lastUpdated: new Date(NOW.getTime() - agoMs).toISOString(),
    });

  it("shows the time left and counts down", () => {
    stamp(5 * 60 * 1000);
    render(<ResultsExpiryNote />);
    const note = screen.getByTestId("results-expiry-note");
    expect(note.textContent).toContain("25:00");

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(note.textContent).toContain("24:57");
  });

  it("renders nothing before hydration", () => {
    hydrated.current = false;
    stamp(0);
    render(<ResultsExpiryNote />);
    expect(screen.queryByTestId("results-expiry-note")).toBeNull();
  });

  it("renders nothing without a session", () => {
    render(<ResultsExpiryNote />);
    expect(screen.queryByTestId("results-expiry-note")).toBeNull();
  });
});
