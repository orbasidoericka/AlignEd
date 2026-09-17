// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";

import { scrollToSection } from "@/lib/scroll-to-section";

interface SectionLinkProps {
  /** "/#how-it-works" or "#how-it-works". */
  href: string;
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}

// Link to a section of a page. On the page that owns the section it scrolls
// on every click; from another route it navigates normally.
export function SectionLink({
  href,
  className,
  children,
  onNavigate,
}: SectionLinkProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [path, hash] = href.split("#");
  const targetPath = path === "" || path === undefined ? pathname : path;
  const onSamePage = hash !== undefined && targetPath.replace(/\/$/, "") === pathname.replace(/\/$/, "");

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        onNavigate?.();
        if (!onSamePage || event.defaultPrevented) return;
        if (scrollToSection(hash, !reduceMotion)) event.preventDefault();
      }}
    >
      {children}
    </Link>
  );
}
