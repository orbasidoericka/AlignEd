// Copyright (c) 2026 EdTech. All rights reserved.

import { SiteFooter } from "@/components/blocks/site-footer";
import { SiteHeader } from "@/components/blocks/site-header";

// Full-chrome pages: landing and results. The (focus) group renders its own
// minimal shell instead so the profile + quiz corridor stays distraction-free.
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </>
  );
}
