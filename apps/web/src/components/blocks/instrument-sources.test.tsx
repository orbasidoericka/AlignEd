// Copyright (c) 2026 EdTech. All rights reserved.

import { render, screen, within } from "@testing-library/react";
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
      "Language options",
      "Purpose",
    ]);
    const values = Array.from(container.querySelectorAll("dd")).map(
      (dd) => dd.textContent ?? "",
    );
    expect(values[0]).toBe("42-item RIASEC Interest Test");
    expect(values[1]).toBe("Hawai'i Department of Education");
    expect(values[2]).toBe("Holland's RIASEC Theory");
    expect(values[4]).toBe("Career interest exploration");
  });

  it("offers English and Filipino and credits the translation review", () => {
    render(<InstrumentSources />);
    const languages = within(
      screen.getByRole("list", { name: "Languages" }),
    ).getAllByRole("listitem");
    expect(languages.map((item) => item.textContent)).toEqual([
      "English",
      "Filipino",
    ]);
    expect(
      screen.getByText(
        "The Filipino translation was reviewed by a psychometrician and a Filipino professor.",
      ),
    ).toBeInTheDocument();
  });
});
