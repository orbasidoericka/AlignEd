// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight, LockIcon, Menu } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  selectIsAssessmentComplete,
  useAssessmentStore,
} from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

// Light, journey-aware header. Each journey link carries its stage color as
// an underline accent so the wayfinding system starts at the very top.
const navLinks = [
  {
    href: "/assessment",
    label: "Assessment",
    accentText: "text-stage-assessment-strong",
    accentBar: "bg-stage-assessment",
  },
  {
    href: "/results",
    label: "My Results",
    accentText: "text-stage-results-strong",
    accentBar: "bg-stage-results",
  },
] as const;

function BrandMark() {
  return (
    <Link
      href="/"
      className="font-heading text-2xl font-bold tracking-tight text-foreground"
    >
      Align<span className="text-stage-profile-strong">Ed</span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const assessmentComplete = useAssessmentStore(selectIsAssessmentComplete);

  useEffect(() => setMounted(true), []);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  const resultsUnlocked = mounted && assessmentComplete;
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const ctaHref = resultsUnlocked ? "/results" : "/assessment/profile";
  const ctaLabel = resultsUnlocked ? "View My Results" : "Begin My Journey!";

  return (
    <TooltipProvider>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm transition-shadow duration-300",
          scrolled ? "border-border shadow-sm" : "border-transparent",
        )}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
        >
          <BrandMark />

          {/* Desktop nav: stage-colored underline accents */}
          <div className="hidden items-center gap-2 text-base font-semibold md:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const locked = link.href === "/results" && !resultsUnlocked;

              if (locked) {
                return (
                  <Tooltip key={link.href}>
                    <TooltipTrigger
                      render={
                        <span
                          className="flex cursor-not-allowed items-center gap-1.5 px-3.5 py-2 text-muted-foreground/70"
                          tabIndex={0}
                        />
                      }
                    >
                      <LockIcon className="size-3.5" aria-hidden />
                      {link.label}
                    </TooltipTrigger>
                    <TooltipContent>
                      Finish the 8-minute assessment to unlock your results.
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-3.5 py-2 transition-colors",
                    active
                      ? link.accentText
                      : "text-foreground/80 hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="active-nav-underline"
                      className={cn(
                        "absolute inset-x-3 -bottom-0.5 h-1 rounded-full",
                        link.accentBar,
                      )}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Link
              href={ctaHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "hidden rounded-full bg-stage-profile px-5 font-heading font-semibold text-stage-profile-foreground hover:bg-stage-profile/85 sm:inline-flex",
              )}
            >
              {ctaLabel}
              <ArrowRight className="size-4" />
            </Link>

            {/* Mobile nav */}
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open menu"
                    className="md:hidden"
                  />
                }
              >
                <Menu />
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="text-xl">
                    Align<span className="text-stage-profile-strong">Ed</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-1 flex-col gap-1 px-4">
                  {navLinks.map((link) => {
                    const active = isActive(link.href);
                    const locked =
                      link.href === "/results" && !resultsUnlocked;

                    if (locked) {
                      return (
                        <span
                          key={link.href}
                          className="flex items-center gap-2 rounded-xl px-3 py-3 text-base font-medium text-muted-foreground/70"
                        >
                          <LockIcon className="size-4" aria-hidden />
                          {link.label}
                          <span className="sr-only">
                            (finish the assessment to unlock)
                          </span>
                        </span>
                      );
                    }

                    return (
                      <SheetClose
                        key={link.href}
                        render={
                          <Link
                            href={link.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "rounded-xl px-3 py-3 text-base font-semibold transition-colors",
                              active
                                ? cn("bg-muted", link.accentText)
                                : "text-foreground hover:bg-muted",
                            )}
                          />
                        }
                      >
                        {link.label}
                      </SheetClose>
                    );
                  })}
                </div>
                <SheetFooter>
                  <SheetClose
                    render={
                      <Link
                        href={ctaHref}
                        className={cn(
                          buttonVariants({ size: "lg" }),
                          "w-full rounded-full bg-stage-profile font-heading font-semibold text-stage-profile-foreground hover:bg-stage-profile/85",
                        )}
                      />
                    }
                  >
                    {ctaLabel}
                    <ArrowRight className="size-4" />
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>
    </TooltipProvider>
  );
}
