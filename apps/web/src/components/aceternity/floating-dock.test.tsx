import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import { FloatingDock } from "./floating-dock";

const ITEMS = [
  { title: "Realistic", href: "#trait-r", icon: <svg /> },
  { title: "Investigative", href: "#trait-i", icon: <svg /> },
];

describe("FloatingDock", () => {
  it("names the landmark and gives each item a named link to its anchor", () => {
    render(<FloatingDock label="The six traits" items={ITEMS} />);
    const nav = screen.getByRole("navigation", { name: "The six traits" });
    // Desktop dock and the small-screen row both render; CSS shows one.
    for (const item of ITEMS) {
      const links = within(nav).getAllByRole("link", { name: item.title });
      expect(links).toHaveLength(2);
      for (const link of links) expect(link).toHaveAttribute("href", item.href);
    }
  });
});
