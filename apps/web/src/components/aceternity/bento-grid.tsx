import { cn } from "@/lib/utils";

// Vendored from Aceternity UI (ui.aceternity.com/components/bento-grid).
// Adapted to AlignEd design tokens (bg-card, border-border, text tokens).
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
        "mx-auto grid max-w-5xl grid-cols-1 gap-4 md:auto-rows-[minmax(14rem,auto)] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group/bento row-span-1 flex flex-col justify-between space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition duration-200 hover:shadow-xl dark:shadow-none",
        className,
      )}
    >
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-2">
        {icon}
        <div className="mt-2 mb-1 font-semibold text-card-foreground">
          {title}
        </div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}
