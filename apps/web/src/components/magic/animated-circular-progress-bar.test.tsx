import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AnimatedCircularProgressBar } from "./animated-circular-progress-bar";

function renderGauge(value: number, max = 42) {
  return render(
    <AnimatedCircularProgressBar
      value={value}
      max={max}
      gaugePrimaryColor="var(--stage-assessment-strong)"
      gaugeSecondaryColor="transparent"
      label="Assessment progress"
      valueText={`${value} of ${max} statements answered`}
    />,
  );
}

describe("AnimatedCircularProgressBar", () => {
  it("exposes progressbar semantics", () => {
    renderGauge(21);
    const bar = screen.getByRole("progressbar", {
      name: "Assessment progress",
    });
    expect(bar).toHaveAttribute("aria-valuenow", "21");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "42");
    expect(bar).toHaveAttribute(
      "aria-valuetext",
      "21 of 42 statements answered",
    );
  });

  it("shows the value as a percentage of the range", () => {
    renderGauge(21);
    expect(screen.getByRole("progressbar")).toHaveTextContent("50%");
  });

  it("clamps values outside the range", () => {
    const { unmount } = renderGauge(60);
    expect(screen.getByRole("progressbar")).toHaveTextContent("100%");
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "42",
    );
    unmount();

    renderGauge(-5);
    expect(screen.getByRole("progressbar")).toHaveTextContent("0%");
  });

  it("drops the secondary track above 90 percent", () => {
    const { container } = renderGauge(40);
    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });

  it("keeps the secondary track at or below 90 percent", () => {
    const { container } = renderGauge(10);
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });
});
