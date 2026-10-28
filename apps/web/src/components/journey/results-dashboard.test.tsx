import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QUESTIONS } from "@/lib/riasec/questions";
import { useAssessmentStore } from "@/store/useAssessmentStore";

import { ResultsDashboard } from "./results-dashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function completeAssessment(nickname: string) {
  const { reset, setProfile, setAnswer } = useAssessmentStore.getState();
  reset();
  setProfile({ nickname, gradeLevel: "11", school: "" });
  for (const question of QUESTIONS) {
    setAnswer(question.id, { trait: question.trait, value: 1 });
  }
}

describe("ResultsDashboard greeting", () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset();
  });

  it("greets the student by the nickname they chose", () => {
    completeAssessment("MARI-EL");
    render(<ResultsDashboard />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Here are your results, MARI-EL");
  });

  it("is the page's only h1, so every card sits beneath it as an h2", () => {
    completeAssessment("FERF");
    render(<ResultsDashboard />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    // The Holland Code card is the payoff, but it is still a section of the
    // page, not a second title for it.
    expect(
      screen.getByRole("heading", { level: 2, name: /You are an/ }),
    ).toBeInTheDocument();
  });

  it("offers the career look from the Holland Code card", () => {
    completeAssessment("FERF");
    render(<ResultsDashboard />);

    expect(
      screen.getByRole("button", { name: /Try your career look/ }),
    ).toBeInTheDocument();
  });

  it("puts the keepsake actions in the Holland Code card as named icon buttons", () => {
    completeAssessment("FERF");
    render(<ResultsDashboard />);

    const codeCard = screen
      .getByRole("heading", { level: 2, name: /You are an/ })
      .closest("section")!;
    for (const name of [
      "Download PDF",
      "Email me my results",
      "Retake assessment",
    ]) {
      const button = within(codeCard).getByRole("button", { name });
      // Icon only: the name comes from aria-label, not visible text.
      expect(button.textContent).toBe("");
    }
  });

  it("centers each trait name under its own emblem", () => {
    completeAssessment("FERF");
    render(<ResultsDashboard />);

    const codeCard = screen
      .getByRole("heading", { level: 2, name: /You are an/ })
      .closest("section")!;
    const items = within(codeCard).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.querySelector("svg")).not.toBeNull();
      expect(item.className).toContain("items-center");
    }
  });

  it("drops the name, not the greeting, when there is no nickname", () => {
    // A v1-v3 payload that predates the nickname field rehydrates with "".
    const { reset, setAnswer } = useAssessmentStore.getState();
    reset();
    for (const question of QUESTIONS) {
      setAnswer(question.id, { trait: question.trait, value: 1 });
    }
    render(<ResultsDashboard />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Here are your results");
    expect(heading.textContent).not.toMatch(/,\s*$/);
  });
});
