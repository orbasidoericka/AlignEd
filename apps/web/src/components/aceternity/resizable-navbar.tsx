"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type Transition,
} from "framer-motion";
import { LockIcon, Menu, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { scrollToSection } from "@/lib/scroll-to-section";
import { cn } from "@/lib/utils";

// Vendored from Aceternity UI (ui.aceternity.com/components/resizable-navbar).
// Adapted:
// - framer-motion + lucide-react instead of motion/react + @tabler/icons-react.
// - Sticky at top-0 as a <header>; bars are <nav> landmarks.
// - Token surfaces (background/popover, ring, shadow-bento) instead of fixed
//   white/neutral colors, so both themes work.
// - NavItems no longer swallows clicks on the right-side controls, renders
//   Next links with aria-current + an active underline, and supports locked
//   items with a tooltip.
// - MobileNavToggle is a real button with aria-expanded/controls; the menu
//   closes on Escape. Mobile radius now grows when floating (was inverted).
// - Reduced motion: size/radius/padding springs are not transforms, so
//   MotionConfig would not stop them; transitions become instant instead.
// - NavbarButton not vendored (the app's buttonVariants is the button system).

const FLOATING_SHADOW =
  "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05)";

// Injected by Navbar via cloneElement.
interface ScrollStateProps {
  visible?: boolean;
  transition?: Transition;
}

const DEFAULT_TRANSITION: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 50,
};

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

export function Navbar({ children, className }: NavbarProps) {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 100);
  });

  const transition: Transition = reduceMotion
    ? { duration: 0 }
    : DEFAULT_TRANSITION;

  return (
    <header
      className={cn(
        "sticky inset-x-0 top-0 z-50 w-full py-2 transition-colors duration-300",
        // Glass chrome at rest so the header reads as a distinct surface over
        // the hexagon field; the floating pill carries its own surface.
        visible
          ? "border-b border-transparent bg-transparent"
          : "border-b border-chrome-border bg-chrome/85 backdrop-blur-md",
        className,
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<ScrollStateProps>,
              { visible, transition },
            )
          : child,
      )}
    </header>
  );
}

interface NavBodyProps extends ScrollStateProps {
  children: React.ReactNode;
  className?: string;
}

export function NavBody({
  children,
  className,
  visible,
  transition = DEFAULT_TRANSITION,
}: NavBodyProps) {
  return (
    <motion.nav
      aria-label="Main"
      animate={{
        backdropFilter: visible ? "blur(10px)" : "blur(0px)",
        boxShadow: visible ? FLOATING_SHADOW : "none",
        width: visible ? "48%" : "100%",
        y: visible ? 16 : 0,
      }}
      transition={transition}
      className={cn(
        "relative z-60 mx-auto hidden w-full max-w-6xl min-w-200 flex-row items-center justify-between gap-4 self-start rounded-full px-4 py-2 lg:flex",
        visible && "bg-chrome/90 shadow-bento ring-1 ring-chrome-border",
        className,
      )}
    >
      {children}
    </motion.nav>
  );
}

export interface NavItem {
  name: string;
  link: string;
  active?: boolean;
  /** When set, the item is locked: shown with a lock icon and this tooltip. */
  lockedHint?: string | undefined;
  activeClassName?: string;
  indicatorClassName?: string;
}

interface NavItemsProps {
  items: readonly NavItem[];
  className?: string;
  onItemClick?: () => void;
}

export function NavItems({ items, className, onItemClick }: NavItemsProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  return (
    <div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        // In flow, not an absolute overlay: upstream centred the links across
        // the whole bar, so once it shrank into the pill they sat on top of
        // the theme toggle and CTA.
        "hidden min-w-0 flex-1 flex-row items-center justify-center gap-1 text-base font-semibold lg:flex",
        className,
      )}
    >
      {items.map((item, idx) => {
        if (item.lockedHint) {
          return (
            <Tooltip key={item.link}>
              <TooltipTrigger
                render={
                  <span
                    className="flex cursor-not-allowed items-center gap-1.5 px-4 py-2 whitespace-nowrap text-muted-foreground/70"
                    tabIndex={0}
                  />
                }
              >
                <LockIcon className="size-3.5" aria-hidden />
                {item.name}
              </TooltipTrigger>
              <TooltipContent>{item.lockedHint}</TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Link
            key={item.link}
            href={item.link}
            onClick={(event) => {
              onItemClick?.();
              // Section links must scroll on every click, not only when the
              // hash changes.
              const hash = item.link.split("#")[1];
              if (hash && scrollToSection(hash, !reduceMotion)) {
                event.preventDefault();
              }
            }}
            onMouseEnter={() => setHovered(idx)}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "relative px-4 py-2 whitespace-nowrap transition-colors",
              item.active
                ? item.activeClassName
                : "text-foreground/80 hover:text-foreground",
            )}
          >
            {hovered === idx && (
              <motion.span
                layoutId="nav-hover"
                className="absolute inset-0 rounded-full bg-muted"
              />
            )}
            {item.active && (
              <motion.span
                layoutId="active-nav-underline"
                className={cn(
                  "absolute inset-x-4 -bottom-0.5 h-1 rounded-full",
                  item.indicatorClassName ?? "bg-primary",
                )}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-20">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

interface MobileNavProps extends ScrollStateProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileNav({
  children,
  className,
  visible,
  transition = DEFAULT_TRANSITION,
}: MobileNavProps) {
  return (
    <motion.nav
      aria-label="Main"
      animate={{
        backdropFilter: visible ? "blur(10px)" : "blur(0px)",
        boxShadow: visible ? FLOATING_SHADOW : "none",
        width: visible ? "92%" : "100%",
        paddingRight: visible ? "12px" : "0px",
        paddingLeft: visible ? "12px" : "0px",
        borderRadius: visible ? "1.5rem" : "0.75rem",
        y: visible ? 8 : 0,
      }}
      transition={transition}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between py-2 lg:hidden",
        visible && "bg-chrome/90 shadow-bento ring-1 ring-chrome-border",
        className,
      )}
    >
      {children}
    </motion.nav>
  );
}

export function MobileNavHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface MobileNavMenuProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavMenu({
  id,
  children,
  className,
  isOpen,
  onClose,
}: MobileNavMenuProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id={id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-stretch gap-2 rounded-2xl bg-popover px-4 py-5 text-popover-foreground shadow-xl ring-1 ring-border",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface MobileNavToggleProps {
  isOpen: boolean;
  menuId: string;
  onClick: () => void;
}

export function MobileNavToggle({
  isOpen,
  menuId,
  onClick,
}: MobileNavToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      aria-controls={menuId}
      className={buttonVariants({ variant: "ghost", size: "icon" })}
    >
      {isOpen ? <X aria-hidden /> : <Menu aria-hidden />}
    </button>
  );
}

export function NavbarLogo({
  children,
  href = "/",
  className,
}: {
  children: React.ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("relative z-20 flex items-center px-2 py-1", className)}
    >
      {children}
    </Link>
  );
}
