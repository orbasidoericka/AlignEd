import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuroraBackground } from "./aurora-background";

// The moving field, the wrapper that masks it, and the decorative layer that
// holds both, in that order outward.
function parts(container: HTMLElement) {
  const field = container.querySelector(".aurora-field");
  if (!(field instanceof HTMLElement)) throw new Error("aurora field not found");
  const mask = field.parentElement!;
  const layer = mask.parentElement!;
  return { field, mask, layer };
}

describe("AuroraBackground", () => {
  it("renders its content, with the field behind and hidden from screen readers", () => {
    const { container } = render(
      <AuroraBackground>
        <p>Tell us about yourself</p>
      </AuroraBackground>,
    );

    expect(screen.getByText("Tell us about yourself")).toBeInTheDocument();
    // The decorative layer is announced to nobody and never takes a click.
    const { layer } = parts(container);
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer.className).toContain("pointer-events-none");
    expect(layer.className).toContain("-z-10");
  });

  // Phones and reduced motion get the field painted once; only mouse devices
  // get the drift, and it moves the layer by transform (a double-width field
  // the GPU slides), never by repainting its background.
  it("drifts only on mouse devices that welcome motion", () => {
    const { container } = render(<AuroraBackground>content</AuroraBackground>);
    const { field } = parts(container);
    expect(field.className).toContain("fancy:animate-aurora-drift");
    expect(field.className).not.toContain("motion-safe:animate-aurora-drift");
    expect(field.className).toContain("w-[200%]");
  });

  it("fades out before the content by default, and can be told not to", () => {
    const { container: masked } = render(
      <AuroraBackground>content</AuroraBackground>,
    );
    expect(parts(masked).mask.className).toContain("mask-");

    const { container: plain } = render(
      <AuroraBackground showRadialGradient={false}>content</AuroraBackground>,
    );
    expect(parts(plain).mask.className).not.toContain("mask-");
  });

  it("keeps the field off printed pages", () => {
    const { container } = render(<AuroraBackground>content</AuroraBackground>);
    expect(parts(container).layer.className).toContain("print:hidden");
  });
});
