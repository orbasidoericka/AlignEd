import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuroraText } from "./aurora-text";

function painted(container: HTMLElement) {
  const el = container.querySelector("[aria-hidden='true']");
  if (!(el instanceof HTMLElement)) throw new Error("painted copy not found");
  return el;
}

describe("AuroraText", () => {
  it("exposes the word to assistive tech exactly once", () => {
    const { container } = render(<AuroraText>Align</AuroraText>);
    // The visible copy is aria-hidden, so only the sr-only copy is read.
    expect(screen.getByText("Align", { selector: ".sr-only" })).toBeInTheDocument();
    expect(painted(container)).toHaveTextContent("Align");
    expect(container).toHaveTextContent("AlignAlign");
  });

  it("builds the gradient from the lighter blue/gold pair, not the small-text strong tokens", () => {
    const { container } = render(<AuroraText>Align</AuroraText>);
    const style = painted(container).getAttribute("style") ?? "";
    // --align-a/--align-b are dedicated, lighter stops (blended toward each
    // hue's pastel base); --primary-strong/--stage-profile-strong are tuned
    // for small colored text and read too dark at 72px. No unrelated hue.
    expect(style).toContain("var(--align-a)");
    expect(style).toContain("var(--align-b)");
    expect(style).not.toContain("var(--primary-strong)");
    expect(style).not.toContain("var(--stage-profile-strong)");
    expect(style).not.toContain("var(--success-strong)");
    expect(style).not.toMatch(/#[0-9a-f]{3,6}/i);
  });

  it("never animates the text itself, only the gradient", () => {
    const { container } = render(<AuroraText>Align</AuroraText>);
    const el = painted(container);
    expect(el.className).toContain("motion-safe:animate-aurora");
    expect(el.getAttribute("style")).not.toContain("transform");
  });

  it("maps speed to the loop duration", () => {
    const { container } = render(<AuroraText speed={0.8}>Align</AuroraText>);
    expect(painted(container).getAttribute("style")).toContain(
      "--aurora-duration: 12.5s",
    );
  });
});
