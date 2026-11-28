// Copyright (c) 2026 EdTech. All rights reserved.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { hexPolygon } from "@/lib/riasec/hexagon";

import { RiasecRadar } from "./riasec-radar";

const scores = (value: number) => ({
  realistic: value,
  investigative: value,
  artistic: value,
  social: value,
  enterprising: value,
  conventional: value,
});

describe("RiasecRadar", () => {
  it("draws four rings and six spokes under the score shape", () => {
    render(<RiasecRadar scores={scores(3)} max={7} />);

    const grid = screen.getByTestId("score-grid");
    expect(grid.querySelectorAll("polygon")).toHaveLength(4);
    expect(grid.querySelectorAll("line")).toHaveLength(6);
  });

  it("reaches the outermost ring on full scores and the center on none", () => {
    const { rerender } = render(<RiasecRadar scores={scores(7)} max={7} />);
    const shape = () => screen.getByTestId("score-shape").getAttribute("points");
    expect(shape()).toBe(hexPolygon({ x: 50, y: 50 }, 29));

    rerender(<RiasecRadar scores={scores(0)} max={7} />);
    expect(shape()).toBe(hexPolygon({ x: 50, y: 50 }, 0));
  });

  it("shows emblems only, each naming its type to a pointer, keyboard or tap", () => {
    render(<RiasecRadar scores={scores(3)} max={7} />);

    expect(
      screen.getAllByRole("button").map((b) => b.getAttribute("aria-label")),
    ).toEqual([
      "Realistic",
      "Investigative",
      "Artistic",
      "Social",
      "Enterprising",
      "Conventional",
    ]);
    expect(screen.queryByText("3 / 7")).toBeNull();
    // Each name is in the page but hidden until its emblem is hovered or
    // focused.
    expect(screen.getByText("Social").parentElement).toHaveClass(
      "invisible",
      "group-hover:visible",
      "group-focus-within:visible",
    );
  });

  it("keeps the scores readable as a table", () => {
    render(<RiasecRadar scores={scores(3)} max={7} />);

    expect(screen.getByRole("table")).toHaveTextContent(
      "C: Conventional3 out of 7",
    );
  });
});
