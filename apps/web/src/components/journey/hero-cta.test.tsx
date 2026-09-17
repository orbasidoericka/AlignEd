import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { QUESTIONS } from "@/lib/riasec/questions";
import { useAssessmentStore } from "@/store/useAssessmentStore";

import { HeroCta } from "./hero-cta";

describe("HeroCta", () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset();
  });

  it("invites the student to start, pointing at the profile step", () => {
    render(<HeroCta />);
    const link = screen.getByRole("link", { name: /Begin your journey/ });
    expect(link).toHaveAttribute("href", "/assessment/profile");
  });

  it("takes a per-placement label so one CTA is not repeated verbatim", () => {
    render(<HeroCta label="Find your path" />);
    expect(
      screen.getByRole("link", { name: /Find your path/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Begin your journey/)).toBeNull();
  });

  it("switches to the results once the assessment is complete", () => {
    const { setAnswer } = useAssessmentStore.getState();
    for (const question of QUESTIONS) {
      setAnswer(question.id, { trait: question.trait, value: 1 });
    }
    render(<HeroCta label="Find your path" />);
    const link = screen.getByRole("link", { name: /View my results/ });
    expect(link).toHaveAttribute("href", "/results");
  });
});
