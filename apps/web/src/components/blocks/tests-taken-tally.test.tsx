import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const reduced = vi.hoisted(() => ({ value: false }));

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: () => reduced.value };
});

import { TestsTakenTally } from "./tests-taken-tally";

describe("TestsTakenTally", () => {
  afterEach(() => {
    reduced.value = false;
  });

  // The count-up mutates textContent after mount; the figure in the markup
  // has to be the real one so no-JS and headless renders are correct.
  it("renders the formatted figure, not a zero", () => {
    render(<TestsTakenTally value={1248} />);
    expect(screen.getByText("1,248")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("keeps the figure under reduced motion", () => {
    reduced.value = true;
    render(<TestsTakenTally value={1248} />);
    expect(screen.getByText("1,248")).toBeInTheDocument();
  });

  it("reads as one sentence to assistive tech", () => {
    const { container } = render(<TestsTakenTally value={307} />);
    const row = container.querySelector("p");
    expect(row?.textContent).toBe("307tests taken");
  });

  it("says test taken for a single result", () => {
    render(<TestsTakenTally value={1} />);
    expect(screen.getByText("test taken")).toBeInTheDocument();
  });

  it("marks the hexagon tally as decoration", () => {
    const { container } = render(<TestsTakenTally value={42} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg?.querySelectorAll("polygon")).toHaveLength(3);
  });
});
