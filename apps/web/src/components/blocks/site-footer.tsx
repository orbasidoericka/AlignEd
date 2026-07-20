// Copyright (c) 2026 EdTech. All rights reserved.

import Link from "next/link";

// Server component. Footer links mirror the journey plus the legal pages.
const footerLinks = [
  { href: "/assessment/profile", label: "Start the assessment" },
  { href: "/results", label: "My Results" },
  { href: "/#how-it-works", label: "How it works" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-2">
          <p className="font-heading text-xl font-bold tracking-tight text-foreground">
            Align<span className="text-stage-profile-strong">Ed</span>
          </p>
          <p className="text-sm text-muted-foreground">
            A free, anonymous guide for Senior High School students: check how
            your strand fits who you are, and see the careers and college
            programs that match.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">Your journey</p>
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-border/60 py-5 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 AlignEd · Polytechnic University of the Philippines — Santa
          Maria Campus · No accounts, no tracking of who you are.
        </p>
      </div>
    </footer>
  );
}
