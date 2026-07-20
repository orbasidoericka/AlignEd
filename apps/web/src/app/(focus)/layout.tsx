// Copyright (c) 2026 EdTech. All rights reserved.

import { FocusBar } from "@/components/journey/focus-bar";

// Focus Mode shell (Design Vision §2.3): from Profile Setup through quiz
// completion the global chrome disappears so the journey feels like one
// continuous corridor. No footer, no nav links.
export default function FocusLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <FocusBar />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
