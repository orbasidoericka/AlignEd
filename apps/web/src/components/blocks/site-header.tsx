// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LockIcon } from "lucide-react";

import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  Navbar,
  NavBody,
  NavItems,
  NavbarLogo,
  type NavItem,
} from "@/components/aceternity/resizable-navbar";
import { Wordmark } from "@/components/blocks/wordmark";
import { SoundToggle } from "@/components/sound-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  selectIsAssessmentComplete,
  useAssessmentStore,
} from "@/store/useAssessmentStore";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

const MOBILE_MENU_ID = "site-mobile-menu";

const ctaClasses =
  "rounded-full bg-stage-profile px-5 font-heading font-semibold text-stage-profile-foreground hover:bg-stage-profile/85";

// Journey-aware site header on Aceternity's Resizable Navbar: full-width at
// the top, a floating pill once scrolled. Assessment carries its stage
// color; My Results was dropped from the link list (kept in the footer)
// because the CTA already says "View My Results" once it unlocks, and a
// second link to the same page read as two copies of the same button.
export function SiteHeader() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const assessmentComplete = useAssessmentStore(selectIsAssessmentComplete);
  // Tie the open menu to the path it was opened on, so navigating closes it
  // without an effect.
  const [menuOpenOnPath, setMenuOpenOnPath] = useState<string | null>(null);
  const menuOpen = menuOpenOnPath === pathname;
  const closeMenu = () => setMenuOpenOnPath(null);

  const resultsUnlocked = hydrated && assessmentComplete;
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const ctaHref = resultsUnlocked ? "/results" : "/assessment/profile";
  // Each surface gets its own CTA wording: nav is the plain utility label,
  // the hero invites, the closing section promises the payoff.
  const ctaLabel = resultsUnlocked ? "View My Results" : "Take Assessment";

  const items: NavItem[] = [
    {
      name: "Assessment",
      link: "/assessment",
      active: isActive("/assessment"),
      activeClassName: "text-stage-assessment-strong",
      indicatorClassName: "bg-stage-assessment",
    },
    { name: "How it works", link: "/#how-it-works" },
  ];

  return (
    <TooltipProvider>
      <Navbar>
        <NavBody>
          <NavbarLogo>
            <Wordmark className="h-9" priority />
          </NavbarLogo>
          <NavItems items={items} />
          <div className="relative z-20 flex items-center gap-2">
            <SoundToggle />
            <ThemeToggle />
            <Link
              href={ctaHref}
              className={cn(buttonVariants({ size: "lg" }), ctaClasses)}
            >
              {ctaLabel}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo>
              <Wordmark className="h-8" priority />
            </NavbarLogo>
            <div className="flex items-center gap-1">
              <SoundToggle />
              <ThemeToggle />
              <MobileNavToggle
                isOpen={menuOpen}
                menuId={MOBILE_MENU_ID}
                onClick={() => setMenuOpenOnPath(menuOpen ? null : pathname)}
              />
            </div>
          </MobileNavHeader>

          <MobileNavMenu
            id={MOBILE_MENU_ID}
            isOpen={menuOpen}
            onClose={closeMenu}
          >
            {items.map((item) =>
              item.lockedHint ? (
                <span
                  key={item.link}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-base font-medium text-muted-foreground/70"
                >
                  <LockIcon className="size-4" aria-hidden />
                  {item.name}
                  <span className="sr-only">
                    (finish the assessment to unlock)
                  </span>
                </span>
              ) : (
                <Link
                  key={item.link}
                  href={item.link}
                  onClick={closeMenu}
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "rounded-xl px-3 py-3 text-base font-semibold transition-colors",
                    item.active
                      ? cn("bg-muted", item.activeClassName)
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  {item.name}
                </Link>
              ),
            )}
            <Link
              href={ctaHref}
              onClick={closeMenu}
              className={cn(
                buttonVariants({ size: "lg" }),
                ctaClasses,
                "mt-2 w-full",
              )}
            >
              {ctaLabel}
              <ArrowRight className="size-4" />
            </Link>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </TooltipProvider>
  );
}
