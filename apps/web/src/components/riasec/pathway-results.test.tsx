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

  it("never labels match strength or shows percentages", () => {
    const { container } = render(
      <PathwayResults topThreeLetters={["S", "E", "C"]} />,
    );
    expect(container.textContent).not.toMatch(
      /match|strongest|weakest|top choice|best fit|%/i,
    );
  });
});
