---
name: frontend-component
description: Create an accessible, responsive AlignEd React component using shadcn/ui (Base UI), Tailwind v4, and motion/react behind the reduced-motion gate, with typed props and client-side zod validation for forms. Use when building or changing UI components, pages, or forms.
disable-model-invocation: true
---

# Frontend Component

## Steps
1. Decide Server vs Client Component; add "use client" only for interactivity,
   at the lowest leaf possible.
2. Define a typed props interface; no any.
3. Compose from the vendored set in `apps/web/src/components/`: shadcn/ui
   (`ui/`, Base UI-based) for controls; MagicUI (`magic/`) for
   micro-interactions; Aceternity (`aceternity/`) for identity moments;
   Efferd (`blocks/`) for page structure. Style with Tailwind v4 utilities;
   tokens live in `@theme` in `globals.css` (no tailwind.config.ts).
4. For forms, validate with the same zod schema used server-side; show inline
   errors with aria-invalid. Enum fields (grade level, strand) are pickers,
   never free text.
5. Handle loading, empty, and error states for async data.
6. Motion via `motion/react` under the root `LazyMotion` provider; every
   animation consumes the global `useReducedMotion` gate and triggers on
   viewport entry, not mount.
7. Verify accessibility (labels, focus order, focus ring, contrast in both
   themes, keyboard completable) and responsiveness (mobile-first from
   360 px; primary actions in the thumb zone).
8. Add a Vitest + Testing Library test for render and key interaction.

## Template

```tsx
"use client";

import { m } from "motion/react";
import { Button } from "@/components/ui/button";
import { useReducedMotionGate } from "@/components/providers";

interface TraitCardProps {
  title: string;
  onSelect: () => void;
}

export function TraitCard({ title, onSelect }: TraitCardProps) {
  const reduced = useReducedMotionGate();
  return (
    <m.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.2 }}
      className="rounded-lg border p-4"
    >
      <h3 className="text-sm font-medium">{title}</h3>
      <Button onClick={onSelect} className="mt-3 w-full">Select</Button>
    </m.div>
  );
}
```

## Checklist
- [ ] Server/Client boundary correct
- [ ] typed props; vendored components + Tailwind v4 only
- [ ] client-side zod validation for forms; enums as pickers
- [ ] loading/empty/error states
- [ ] reduced-motion gated animation
- [ ] accessible, both themes, thumb-zone responsive
- [ ] render/interaction test
