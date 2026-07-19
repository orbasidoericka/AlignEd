import Link from "next/link";

// Efferd-style footer block, adapted to AlignEd tokens. Server component.
const footerLinks = [
  { href: "/assessment", label: "RIASEC Assessment" },
  { href: "/directory", label: "Universities" },
  { href: "/recommendations", label: "My Results" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-border bg-background/60">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-2">
          <p className="text-lg font-bold tracking-tight text-foreground">
            Align<span className="text-accent-strong">Ed</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Data-driven academic and career guidance for Senior High School
            students in Central Luzon — anonymous, free, and built around who
            you actually are.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">Explore</p>
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-border/60 py-5 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 AlignEd · Polytechnic University of the Philippines — Santa
          Maria Campus
        </p>
      </div>
    </footer>
  );
}
