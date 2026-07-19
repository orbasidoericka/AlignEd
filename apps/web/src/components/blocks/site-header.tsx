"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight, Menu } from "lucide-react";

import { BorderBeam } from "@/components/magic/border-beam";
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
import { cn } from "@/lib/utils";

// Floating pill header (Efferd-style block) with an Aceternity-style animated
// active-route indicator and a MagicUI Border Beam on the primary CTA.
const navLinks = [
  { href: "/assessment", label: "Assessment" },
  { href: "/directory", label: "Universities" },
  { href: "/recommendations", label: "My Results" },
] as const;

function BrandMark() {
  return (
    <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
      Align<span className="text-accent-strong">Ed</span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        aria-label="Main"
        className={cn(
          "flex w-full max-w-3xl items-center justify-between rounded-full border px-5 py-2.5 backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-300",
          scrolled
            ? "border-border bg-background/95 shadow-xl shadow-foreground/10"
            : "border-border/70 bg-background/80 shadow-lg shadow-foreground/5",
        )}
      >
        <BrandMark />

        {/* Desktop nav: animated active pill via shared layoutId */}
        <div className="hidden items-center gap-1 text-sm font-medium md:flex">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="active-nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-muted"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {/* Primary CTA — always one click away, beam keeps it alive */}
          <Link
            href="/assessment"
            className={cn(
              buttonVariants({ size: "sm" }),
              "relative hidden overflow-hidden rounded-full bg-brand px-4 font-semibold text-white hover:bg-brand/90 sm:inline-flex",
            )}
          >
            Start free
            <ArrowRight className="size-3.5" />
            <BorderBeam size={36} duration={5} borderWidth={1.5} />
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
                <SheetTitle>
                  Align<span className="text-accent-strong">Ed</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-1 px-4">
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <SheetClose
                      key={link.href}
                      render={
                        <Link
                          href={link.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "rounded-lg px-3 py-2.5 text-base font-medium transition-colors",
                            active
                              ? "bg-muted text-foreground"
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
                      href="/assessment"
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "relative w-full overflow-hidden rounded-full bg-brand font-semibold text-white hover:bg-brand/90",
                      )}
                    />
                  }
                >
                  Start the assessment
                  <ArrowRight className="size-4" />
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
