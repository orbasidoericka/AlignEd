// Copyright (c) 2026 EdTech. All rights reserved.
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MILESTONE_CHEERS } from "@/lib/riasec/encouragement";

// The exit fade runs on animation frames, which fake timers never advance, so
// a dismissed pill would linger in the DOM forever. The tests cover when the
// cheer shows and clears, not how it fades, so presence becomes a plain
// conditional render.
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

import { MilestoneCheer } from "./milestone-cheer";

describe("MilestoneCheer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires each milestone once as the count crosses it", () => {
    const { rerender } = render(
      <MilestoneCheer answeredCount={0} language="en" />,
    );
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    for (const cheer of MILESTONE_CHEERS) {
      rerender(<MilestoneCheer answeredCount={cheer.at} language="en" />);
      expect(screen.getByRole("status")).toHaveTextContent(cheer.en);
      // Let it clear so the next milestone is the only thing showing.
      act(() => vi.runAllTimers());
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    }
  });

  it("does not refire after the count dips back under a passed threshold", () => {
    const { rerender } = render(
      <MilestoneCheer answeredCount={11} language="en" />,
    );
    // 11 was already passed on mount, so nothing fires (resume behaviour).
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    // The rapid-answer guard clears an answer, then the student re-answers.
    rerender(<MilestoneCheer answeredCount={10} language="en" />);
    rerender(<MilestoneCheer answeredCount={11} language="en" />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("resuming past earlier milestones never flashes them", () => {
    const { rerender } = render(
      <MilestoneCheer answeredCount={30} language="en" />,
    );
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    // The next band still fires normally.
    rerender(<MilestoneCheer answeredCount={32} language="en" />);
    expect(screen.getByRole("status")).toHaveTextContent(
      MILESTONE_CHEERS[2].en,
    );
  });

  it("clears after its visible window", () => {
    const { rerender } = render(
      <MilestoneCheer answeredCount={10} language="en" />,
    );
    rerender(<MilestoneCheer answeredCount={11} language="en" />);
    expect(screen.getByRole("status")).not.toBeEmptyDOMElement();

    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("renders nothing while suppressed", () => {
    const { rerender } = render(
      <MilestoneCheer answeredCount={10} language="en" />,
    );
    rerender(<MilestoneCheer answeredCount={11} language="en" suppressed />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("shows Filipino copy with a lang attribute", () => {
    const { rerender } = render(
      <MilestoneCheer answeredCount={20} language="fil" />,
    );
    rerender(<MilestoneCheer answeredCount={21} language="fil" />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(MILESTONE_CHEERS[1].fil);
    expect(status.querySelector("[lang='fil']")).not.toBeNull();
  });
});
