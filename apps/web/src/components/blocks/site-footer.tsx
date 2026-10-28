// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import Link from "next/link";

import { SectionLink } from "@/components/blocks/section-link";
import { Wordmark } from "@/components/blocks/wordmark";
import { PrivacyPolicyDialog } from "@/components/journey/privacy-consent";
import { cn } from "@/lib/utils";

const linkClassName =
  "text-sm text-muted-foreground transition-colors hover:text-foreground";

// Not the journey (that belongs to the navbar CTA): About Us, how the
// assessment works, and the legal notice, in that order.
const footerLinks = [
  { href: "/about", label: "About Us" },
  { href: "/#how-it-works", label: "How it works" },
] as const;

export function SiteFooter() {
  return (
    // Glass chrome, matching the header, so the page ends on a distinct
    // surface instead of blending into the body background.
    <footer className="mt-auto w-full border-t border-chrome-border bg-chrome/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-2">
          <Wordmark className="h-8" />
          <p className="text-sm text-muted-foreground">
            A free, anonymous guide for Senior High School students: discover
            your Holland Code and see the careers and college programs that
            match.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">AlignEd</p>
          {footerLinks.map((link) =>
            link.href.includes("#") ? (
              <SectionLink
                key={link.href}
                href={link.href}
                className={linkClassName}
              >
                {link.label}
              </SectionLink>
            ) : (
              <Link key={link.href} href={link.href} className={linkClassName}>
                {link.label}
              </Link>
            ),
          )}
          <PrivacyPolicyDialog
            trigger={
              <button type="button" className={cn(linkClassName, "text-left")} />
            }
          >
            Privacy Policy
          </PrivacyPolicyDialog>
        </nav>
      </div>
      <div className="border-t border-chrome-border/60 bg-chrome-border/25 py-5 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 AlignEd · Polytechnic University of the Philippines — Santa
          Maria Campus
        </p>
      </div>
    </footer>
  );
}
