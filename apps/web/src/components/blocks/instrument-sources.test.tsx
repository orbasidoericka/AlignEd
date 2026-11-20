// Copyright (c) 2026 EdTech. All rights reserved.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InstrumentSources } from "./instrument-sources";

describe("InstrumentSources", () => {
  it("renders the section heading", () => {
    render(<InstrumentSources />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Where the questions come from",
      }),
    ).toBeInTheDocument();
  });

  it("lists the instrument facts in order", () => {
    const { container } = render(<InstrumentSources />);
    const terms = Array.from(container.querySelectorAll("dt")).map(
      (dt) => dt.textContent,
    );
    expect(terms).toEqual([
      "Assessment",
      "Original source",
      "Framework",
      "Purpose",
    ]);
    const values = Array.from(container.querySelectorAll("dd")).map(
      (dd) => dd.textContent ?? "",
    );
    expect(values[0]).toBe("42-item RIASEC Interest Test");
    expect(values[1]).toBe("Hawai'i Department of Education");
    expect(values[2]).toBe("Holland's RIASEC Theory");
    expect(values[3]).toBe("Career interest exploration");
  });

  it("does not offer a language option while Filipino is held back", () => {
    render(<InstrumentSources />);
    expect(screen.queryByText("Language options")).not.toBeInTheDocument();
    expect(screen.queryByText("Filipino")).not.toBeInTheDocument();
    expect(screen.queryByText(/psychometrician/)).not.toBeInTheDocument();
  });
});
