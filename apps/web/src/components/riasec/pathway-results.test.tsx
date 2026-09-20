import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";

import { PathwayResults } from "./pathway-results";

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

  it("gives each card the mascot for its own letter", () => {
    const { container } = render(<PathwayResults topThreeLetters={["R", "I", "A"]} />);
    const cards = Array.from(container.querySelectorAll("section"));

    // The files are named by trait while the cards are keyed by letter, so
    // this is the mapping most likely to silently drift.
    const expected = ["realistic", "investigative", "artistic"];
    cards.forEach((card, i) => {
      const img = card.querySelector("img");
      expect(img).not.toBeNull();
      // next/image rewrites src to /_next/image?url=..., so match the name.
      expect(img!.getAttribute("src")).toContain(expected[i]!);
    });
  });

  it("keeps the mascots decorative, so the card reads the same aloud", () => {
    const { container } = render(<PathwayResults topThreeLetters={["R", "I", "A"]} />);
    for (const img of Array.from(container.querySelectorAll("img"))) {
      expect(img.getAttribute("alt")).toBe("");
    }
  });

  it("gives the first letter of the code a more prominent mascot", () => {
    const { container } = render(<PathwayResults topThreeLetters={["R", "I", "A"]} />);
    const [first, ...rest] = Array.from(
      container.querySelectorAll("section"),
    ).map((card) => card.querySelector("img")!.parentElement!.className);

    // Height is one of three primacy signals; the badge and the trait-colored
    // border are asserted separately below. Colors are expected to differ
    // between all three, since each card wears its own trait wash.
    expect(first).toContain("h-36");
    for (const other of rest) {
      expect(other).toContain("h-28");
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

  it("borders only the top card, in that letter's own color", () => {
    const { container } = render(
      <PathwayResults topThreeLetters={["S", "E", "C"]} />,
    );
    const frames = Array.from(container.querySelectorAll("section")).map(
      (card) => card.parentElement!.className,
    );

    expect(frames[0]).toContain("border-trait-s");
    expect(frames[0]).toContain("border-2");
    for (const frame of frames.slice(1)) {
      expect(frame).not.toMatch(/border-trait-/);
    }
  });
});
