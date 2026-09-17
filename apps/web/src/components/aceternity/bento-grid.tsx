import { GlowingEffect } from "@/components/aceternity/glowing-effect";
import { cn } from "@/lib/utils";

// Vendored from Aceternity UI (ui.aceternity.com/components/bento-grid).
// Adapted: design tokens instead of neutral/black, auto-height rows and a
// children slot for data-heavy cells, section semantics, and no hover
// translate on content (lists must not move under the pointer). Each cell
// uses Aceternity's Glowing Effect frame: an outer bordered ring whose
// border lights up in a palette arc that follows the pointer, around an
// inner card.
export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full grid-cols-1 gap-4 md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface BentoGridItemProps {
  /** Classes for the inner card (background, layout, height). */
  className?: string;
  /** Classes for the outer glowing frame. */
  frameClassName?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  // id of the cell's heading; rendered on the h2 when `title` is given,
  // otherwise it must match a heading inside `children`.
  headingId?: string;
}

export function BentoGridItem({
  className,
  frameClassName,
  title,
  description,
  header,
  icon,
  children,
  headingId,
}: BentoGridItemProps) {
  return (
    <div
      className={cn(
        "relative h-full rounded-[1.75rem] border border-border p-1.5 md:p-2 print:break-inside-avoid print:border-0 print:p-0",
        frameClassName,
      )}
    >
      <GlowingEffect
        disabled={false}
        glow
        spread={48}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={3}
        className="print:hidden"
      />
      <section
        aria-labelledby={headingId}
        className={cn(
          "group/bento relative flex h-full flex-col gap-4 rounded-[1.25rem] bg-card p-5 shadow-bento sm:p-6 print:shadow-none",
          className,
        )}
      >
        {header}
        {title && (
          <div className="flex items-center gap-2">
            {icon}
            <h2
              id={headingId}
              className="font-heading text-lg font-bold text-foreground"
            >
              {title}
            </h2>
          </div>
        )}
        {description && (
          <p className="-mt-2 text-sm text-muted-foreground">{description}</p>
        )}
        {children}
      </section>
    </div>
  );
}
