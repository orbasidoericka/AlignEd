import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const reduced = vi.hoisted(() => ({ value: false }));

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: () => reduced.value };
});

import { EncryptedText } from "./encrypted-text";

const TEXT = "Answer 42 quick statements.";

function animatedCopy(container: HTMLElement): HTMLElement {
  const copies = container.querySelectorAll("[aria-hidden='true']");
  const el = copies[copies.length - 1];
  if (!(el instanceof HTMLElement)) throw new Error("animated copy not found");
  return el;
}

describe("EncryptedText", () => {
  afterEach(() => {
    reduced.value = false;
  });

  it("exposes the sentence to assistive tech exactly once", () => {
    render(<EncryptedText text={TEXT} />);
    expect(screen.getByText(TEXT, { selector: ".sr-only" })).toBeInTheDocument();
    expect(screen.getAllByText(TEXT)).toHaveLength(2);
    for (const copy of screen.getAllByText(TEXT)) {
      if (!copy.classList.contains("sr-only")) {
        expect(copy).toHaveAttribute("aria-hidden", "true");
      }
    }
  });

  it("starts scrambled, keeping spaces and the sentence length", () => {
    const { container } = render(<EncryptedText text={TEXT} />);
    const shown = animatedCopy(container).textContent ?? "";
    expect(shown).toHaveLength(TEXT.length);
    expect(shown).not.toBe(TEXT);
    expect([...shown].map((c, i) => (c === " " ? i : -1)).filter((i) => i >= 0)).toEqual(
      [...TEXT].map((c, i) => (c === " " ? i : -1)).filter((i) => i >= 0),
    );
  });

  it("shows the real text at once under reduced motion", () => {
    reduced.value = true;
    const { container } = render(<EncryptedText text={TEXT} />);
    expect(animatedCopy(container).textContent).toBe(TEXT);
  });
});
