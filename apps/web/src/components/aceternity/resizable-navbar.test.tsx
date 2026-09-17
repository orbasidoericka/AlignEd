import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import {
  MobileNavMenu,
  MobileNavToggle,
  NavItems,
} from "./resizable-navbar";

function MobileHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <MobileNavToggle
        isOpen={open}
        menuId="test-menu"
        onClick={() => setOpen((o) => !o)}
      />
      <MobileNavMenu id="test-menu" isOpen={open} onClose={() => setOpen(false)}>
        <a href="/assessment">Assessment</a>
      </MobileNavMenu>
    </>
  );
}

describe("MobileNavToggle + MobileNavMenu", () => {
  it("is a labelled button that reflects and controls the menu state", async () => {
    const user = userEvent.setup();
    render(<MobileHarness />);

    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "test-menu");
    expect(screen.queryByRole("link", { name: "Assessment" })).toBeNull();

    await user.click(toggle);
    expect(
      screen.getByRole("button", { name: "Close menu" }),
    ).toHaveAttribute("aria-expanded", "true");
    // Presence, not visibility: jsdom doesn't run the menu's fade-in.
    expect(screen.getByRole("link", { name: "Assessment" })).toBeInTheDocument();
  });

  it("opens from the keyboard and closes on Escape", async () => {
    const user = userEvent.setup();
    render(<MobileHarness />);

    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      await screen.findByRole("button", { name: "Open menu" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});

describe("NavItems", () => {
  it("marks the active link and renders locked items as non-links", () => {
    render(
      <TooltipProvider>
        <NavItems
          items={[
            { name: "Assessment", link: "/assessment", active: true },
            {
              name: "My Results",
              link: "/results",
              lockedHint: "Finish the assessment to unlock your results.",
            },
          ]}
        />
      </TooltipProvider>,
    );

    expect(screen.getByRole("link", { name: "Assessment" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("link", { name: /My Results/ })).toBeNull();
    expect(screen.getByText("My Results")).toBeInTheDocument();
  });

  it("lays the links out in flow so the pill cannot overlap its controls", () => {
    const { container } = render(
      <TooltipProvider>
        <NavItems items={[{ name: "Assessment", link: "/assessment" }]} />
      </TooltipProvider>,
    );
    const row = container.firstElementChild;
    expect(row?.className).not.toMatch(/\babsolute\b/);
    expect(row?.className).not.toMatch(/pointer-events-none/);
    expect(row?.className).toMatch(/flex-1/);
  });
});
