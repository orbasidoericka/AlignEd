import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { computeHollandCode, formatHollandCode } from "@/lib/riasec/scoring";
import type { RiasecScores } from "@/store/useAssessmentStore";

import { POINTS_PER_TRAIT, ScoringExample } from "./scoring-example";

const MIKA: RiasecScores = {
  realistic: 2,
  investigative: 5,
  artistic: 6,
  social: 5,
  enterprising: 3,
  conventional: 1,
};

describe("ScoringExample", () => {
  it("shows the code the real scoring gives for these scores", () => {
    render(<ScoringExample name="Mika" scores={MIKA} />);
    const code = formatHollandCode(computeHollandCode(MIKA));
    expect(code).toBe("A-I-S");
    expect(screen.getByText(code)).toBeInTheDocument();
  });

  it("reads every trait's score out of seven", () => {
    render(<ScoringExample name="Mika" scores={MIKA} />);
    expect(
      screen.getByText("Artistic: 6 out of 7, in the top three"),
    ).toBeInTheDocument();
    expect(screen.getByText("Realistic: 2 out of 7")).toBeInTheDocument();
  });

  it("draws seven pips per trait, filled for each point", () => {
    const { container } = render(<ScoringExample name="Mika" scores={MIKA} />);
    const rows = container.querySelectorAll("li");
    expect(rows).toHaveLength(6);
    const scores = Object.values(MIKA);
    rows.forEach((row, i) => {
      expect(row.querySelectorAll("svg[viewBox='0 0 10 11.5']")).toHaveLength(
        POINTS_PER_TRAIT,
      );
      expect(row.querySelectorAll("[data-filled]")).toHaveLength(scores[i]!);
    });
  });

  it("marks exactly the three traits in the code", () => {
    const { container } = render(<ScoringExample name="Mika" scores={MIKA} />);
    expect(container.querySelectorAll("li[data-in-code]")).toHaveLength(3);
  });

  it("explains the tie with the fixed R-I-A-S-E-C order", () => {
    render(<ScoringExample name="Mika" scores={MIKA} />);
    expect(
      screen.getByText(
        /Investigative and Social both scored 5\. I comes before S in R-I-A-S-E-C, so I goes first\./,
      ),
    ).toBeInTheDocument();
  });

  it("says nothing about ties when there are none in the code", () => {
    render(
      <ScoringExample
        name="Ana"
        scores={{ ...MIKA, investigative: 4, social: 3 }}
      />,
    );
    expect(screen.queryByText(/both scored/)).toBeNull();
  });
});
