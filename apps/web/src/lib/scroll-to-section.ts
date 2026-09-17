// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

/**
 * Scrolls to an in-page section and returns whether it handled the click.
 *
 * A plain `#hash` link only scrolls when the hash actually changes, so a
 * second click on the same link (or any click once the URL already ends in
 * that hash) does nothing. Anchor links call this instead.
 */
export function scrollToSection(hash: string, smooth: boolean): boolean {
  const id = hash.replace(/^#/, "");
  const target = document.getElementById(id);
  if (!target) return false;

  target.scrollIntoView({
    behavior: smooth ? "smooth" : "auto",
    block: "start",
  });

  // Keep the URL shareable without adding a history entry per click, and move
  // focus so keyboard and screen reader users land in the section too.
  window.history.replaceState(null, "", `#${id}`);
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  return true;
}
