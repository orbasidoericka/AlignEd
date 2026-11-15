// Copyright (c) 2026 EdTech. All rights reserved.

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SavedResult } from "@/lib/saved-results/repository";

import { LatestResults } from "./latest-results";

function rows(count: number): SavedResult[] {
  return Array.from({ length: count }, (_, i) => ({
    resultsId: `ALGN-TEST-${String(i).padStart(4, "0")}`,
    takenOn: "2026-11-10",
    code: ["R", "I", "A"],
    gradeLevel: "11",
    strand: "GAS",
    age: 17,
    scores: {
      realistic: 5,
      investigative: 4,
      artistic: 3,
      social: 2,
      enterprising: 1,
      conventional: 0,
    },
  })) as unknown as SavedResult[];
}

const bodyRows = () =>
  within(screen.getAllByRole("rowgroup")[1]!).getAllByRole("row");

describe("LatestResults", () => {
  it("shows ten rows per page and moves between pages", () => {
    render(<LatestResults results={rows(21)} />);
    const previous = screen.getByRole("button", { name: "Previous" });
    const next = screen.getByRole("button", { name: "Next" });

    expect(bodyRows()).toHaveLength(10);
    expect(previous).toBeDisabled();
    expect(screen.getByText(/Page/)).toHaveTextContent("Page 1 of 3");

    fireEvent.click(next);
    fireEvent.click(next);
    expect(bodyRows()).toHaveLength(1);
    expect(screen.getByText("ALGN-TEST-0020")).toBeInTheDocument();
    expect(next).toBeDisabled();
    expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 21–21 of 21");

    fireEvent.click(previous);
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText("ALGN-TEST-0010")).toBeInTheDocument();
  });

  it("hides the page controls when everything fits on one page", () => {
    render(<LatestResults results={rows(4)} />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(bodyRows()).toHaveLength(4);
  });
});
