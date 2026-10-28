import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";

import { PathwayResults } from "./pathway-results";

// The crown badge is a lucide <svg aria-hidden> as well, so the art is
// addressed by its own viewBox rather than by being decorative: the mascot
// keeps the authored 800x600 canvas, the emblem crops it to the badge.
const MASCOT = "svg[viewBox='0 0 800 600']";
const EMBLEM = "svg[viewBox='176 32 448 534']";

describe("PathwayResults", () => {
  it("renders one card per top letter, in code order", () => {
    render(<PathwayResults topThreeLetters={["R", "I", "A"]} />);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(["Realistic", "Investigative", "Artistic"]);
  });

  it("lists every major and related pathway for each letter, in sheet order", () => {
    render(<PathwayResults topThreeLetters={["R", "I", "A"]} />);
    for (const letter of ["R", "I", "A"] as const) {
      const profile = RIASEC_PATHWAYS[letter];
      const card = screen
        .getByRole("heading", { level: 2, name: profile.name })
        .closest("section");
      expect(card).not.toBeNull();
      const [majorsList, pathwaysList] = within(card!).getAllByRole("list");
      expect(
        within(majorsList!).getAllByRole("listitem").map((li) => li.textContent),
      ).toEqual([...profile.majors]);
      expect(
        within(pathwaysList!)
          .getAllByRole("listitem")
          .map((li) => li.textContent),
      ).toEqual([...profile.relatedPathways]);
      expect(card).toHaveTextContent(profile.description);
    }
  });

  it("omits letters outside the code", () => {
    const { container } = render(
      <PathwayResults topThreeLetters={["R", "I", "A"]} />,
    );
    for (const letter of ["S", "E", "C"] as const) {
      expect(container).not.toHaveTextContent(RIASEC_PATHWAYS[letter].name);
    }
  });

  // Careers are never ranked against each other, and no fake match score is
  // ever shown. The top-trait badge below is deliberately outside this rule:
  // it names the student's own highest trait, which the page already reports
  // with real numbers, and says nothing about how well a career fits them.
  it("never labels match strength or shows percentages", () => {
    const { container } = render(
      <PathwayResults topThreeLetters={["S", "E", "C"]} />,
    );
    expect(container.textContent).not.toMatch(
      /match|strongest|weakest|top choice|best fit|%/i,
    );
  });

  it("gives each card the mascot cover and the emblem icon for its own letter", () => {
    const { container } = render(<PathwayResults topThreeLetters={["R", "I", "A"]} />);
    const cards = Array.from(container.querySelectorAll("section"));

    // Both paint from `currentColor`, so the letter -> trait token mapping is
    // the thing most likely to silently drift.
    const expected = ["var(--trait-r)", "var(--trait-i)", "var(--trait-a)"];
    cards.forEach((card, i) => {
      for (const selector of [MASCOT, EMBLEM]) {
        const art = card.querySelector(selector);
        expect(art).not.toBeNull();
        expect(art!.getAttribute("style")).toContain(expected[i]!);
      }
    });
  });

  it("shows no bare letter chip beside the trait name", () => {
    render(<PathwayResults topThreeLetters={["R", "I", "A"]} />);
    // The emblem replaced the letter; the heading is the only text label.
    for (const letter of ["R", "I", "A"]) {
      expect(screen.queryByText(letter, { exact: true })).toBeNull();
    }
  });

  it("keeps the art decorative, so the card reads the same aloud", () => {
    const { container } = render(<PathwayResults topThreeLetters={["R", "I", "A"]} />);
    const art = Array.from(container.querySelectorAll(`${MASCOT}, ${EMBLEM}`));
    expect(art).toHaveLength(6);
    for (const svg of art) {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("never lets two cards share an SVG id", () => {
    const { container } = render(<PathwayResults topThreeLetters={["S", "E", "C"]} />);
    // Every mascot clips its neck with an id; unscoped, the three would
    // collide and two figures would clip against the wrong shape.
    const ids = Array.from(container.querySelectorAll("[id]"))
      .map((el) => el.id)
      .filter((id) => id.endsWith("neckclip") || id.endsWith("s-l"));
    expect(ids.length).toBeGreaterThan(3);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every cover the same height, so the cards' text lines up", () => {
    const { container } = render(<PathwayResults topThreeLetters={["R", "I", "A"]} />);
    const mascots = Array.from(container.querySelectorAll("section")).map(
      (card) => card.querySelector(MASCOT)!,
    );

    // The top trait is marked by its badge and colored edge, never by size.
    for (const mascot of mascots) {
      expect(mascot.parentElement!.className).toContain("h-32 sm:h-36");
    }
    expect(mascots[0]!.getAttribute("class")).toContain("drop-shadow-sm");
  });

  it("aligns the cards' rows on a shared subgrid", () => {
    const { container } = render(<PathwayResults topThreeLetters={["R", "I", "A"]} />);
    for (const card of Array.from(container.querySelectorAll("section"))) {
      expect(card.className).toContain("md:grid-rows-subgrid");
      expect(card.parentElement!.className).toContain("md:grid-rows-subgrid");
    }
  });

  it("names the top trait in words, not only in size and color", () => {
    render(<PathwayResults topThreeLetters={["R", "I", "A"]} />);

    // One badge, and it belongs to the first letter of the code.
    const badges = screen.getAllByText("Your top trait");
    expect(badges).toHaveLength(1);
    expect(badges[0]!.closest("section")).toBe(
      screen.getByRole("heading", { level: 2, name: "Realistic" }).closest(
        "section",
      ),
    );
  });

  it("edges only the top card, in that letter's own color, without resizing it", () => {
    const { container } = render(
      <PathwayResults topThreeLetters={["S", "E", "C"]} />,
    );
    const frames = Array.from(container.querySelectorAll("section")).map(
      (card) => card.parentElement!.className,
    );

    expect(frames[0]).toContain("border-trait-s");
    expect(frames[0]).toContain("ring-trait-s");
    // A wider border would shrink the top card's content box.
    expect(frames[0]).not.toContain("border-2");
    for (const frame of frames.slice(1)) {
      expect(frame).not.toMatch(/(border|ring)-trait-/);
    }
  });
});
