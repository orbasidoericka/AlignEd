// Copyright (c) 2026 EdTech. All rights reserved.

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HollandTheory } from "./holland-theory";

describe("HollandTheory", () => {
  it("renders the section heading", () => {
    render(<HollandTheory />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Where your code comes from" }),
    ).toBeInTheDocument();
  });

  it("credits John L. Holland and the year", () => {
    const { container } = render(<HollandTheory />);
    expect(container.textContent).toContain("John L. Holland");
    expect(container.textContent).toContain("1959");
  });

  it("lists the six types in RIASEC order", () => {
    render(<HollandTheory />);
    const list = screen.getByRole("list", { name: "The six RIASEC types" });
    const names = within(list)
      .getAllByRole("listitem")
      .map((item) => item.textContent ?? "");
    expect(names).toHaveLength(6);
    [
      "Realistic",
      "Investigative",
      "Artistic",
      "Social",
      "Enterprising",
      "Conventional",
    ].forEach((name, index) => {
      expect(names[index]).toContain(name);
    });
  });

  it("never ranks or scores a match", () => {
    const { container } = render(<HollandTheory />);
    expect(container.textContent).not.toMatch(/best match|match %|\d+%/i);
  });
});
