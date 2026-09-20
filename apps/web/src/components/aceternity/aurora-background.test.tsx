import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuroraBackground } from "./aurora-background";

function field(container: HTMLElement) {
  const el = container.querySelector(".aurora-field");
  if (!(el instanceof HTMLElement)) throw new Error("aurora field not found");
  return el;
}

describe("AuroraBackground", () => {
  it("renders its content, with the field behind and hidden from screen readers", () => {
    const { container } = render(
      <AuroraBackground>
        <p>Tell us where you are</p>
      </AuroraBackground>,
    );

    expect(screen.getByText("Tell us where you are")).toBeInTheDocument();
    // The decorative layer is announced to nobody and never takes a click.
    const layer = field(container).parentElement!;
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer.className).toContain("pointer-events-none");
    expect(layer.className).toContain("-z-10");
  });

  it("drifts only when motion is welcome", () => {
    const { container } = render(<AuroraBackground>content</AuroraBackground>);
    expect(field(container).className).toContain(
      "motion-safe:animate-aurora-drift",
    );
  });

  it("fades out before the content by default, and can be told not to", () => {
    const { container: masked } = render(
      <AuroraBackground>content</AuroraBackground>,
    );
    expect(field(masked).className).toContain("mask-");

    const { container: plain } = render(
      <AuroraBackground showRadialGradient={false}>content</AuroraBackground>,
    );
    expect(field(plain).className).not.toContain("mask-");
  });

  it("keeps the field off printed pages", () => {
    const { container } = render(<AuroraBackground>content</AuroraBackground>);
    expect(field(container).parentElement!.className).toContain("print:hidden");
  });
});
