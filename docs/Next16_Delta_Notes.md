# Next.js 16 Delta Notes (vs. the Next 15 in everyone's head)

> Team reference for AlignEd. Source of truth: the docs bundled with our exact
> installed version at `node_modules/next/dist/docs/` (hoisted to the repo
> root by npm workspaces). Re-check the relevant guide there before starting
> each phase's framework work — `apps/web/AGENTS.md` is not kidding.

## Verified deltas that affect this repo

1. **Middleware is now Proxy.** The file is `proxy.ts` (project root or `src/`),
   exporting `proxy` (or default). Same `NextRequest`/`NextResponse`/`matcher`
   API, new name. Anything we (or a library README) call "middleware" must be
   written as `proxy.ts`. Relevant later for the strict CSP work in Phase 5.
   (Doc: `01-app/01-getting-started/16-proxy.md`.)

2. **Caching has a new model: Cache Components.** Opt-in via
   `cacheComponents: true` in `next.config.ts`, then per-function/per-component
   `'use cache'` directives with `cacheLife('hours' | 'days' | …)` and
   `cacheTag()` / `revalidateTag()` for invalidation. Uncached async components
   must be wrapped in `<Suspense>` and stream. **The classic
   ISR/`export const revalidate` model still works while `cacheComponents` is
   off** (docs call it the "previous model": guide at
   `01-app/02-guides/caching-without-cache-components`).
   - **Decision for Phase 3 (directory/course pages):** prefer enabling
     `cacheComponents` and using `'use cache'` + `cacheLife('days')` +
     `cacheTag('reference-data')` on the Supabase reference-data fetchers —
     it is the forward model and gives us tag-based invalidation when seed
     data is republished. Validate on a branch first; if it fights us, classic
     ISR remains supported.
   - With Cache Components enabled, **GET route handlers prerender like
     pages** — remember this when the API routes appear.

3. **Fonts, metadata, layouts: no changes that affect us.** `next/font/google`
   with CSS variables, `Metadata`/`Viewport` exports, and the App Router
   layout conventions in the existing `layout.tsx` all match the bundled docs.

4. **`next.config.ts`**: TypeScript config file is first-class (we use it);
   `headers()`, `reactStrictMode`, `poweredByHeader`,
   `experimental.optimizePackageImports` all present in the bundled reference.

## Practical rules of thumb

- When a shadcn/MagicUI/Aceternity/Efferd doc says "add middleware", write
  `proxy.ts`.
- When a tutorial says `export const revalidate = 3600`, that is the previous
  model — fine while `cacheComponents` is off, but our Phase 3 plan is
  `'use cache'` + `cacheLife`.
- Tailwind is v4 in this repo: tokens/keyframes live in `globals.css` under
  `@theme` — there is **no** `tailwind.config.ts` (one was deleted in Phase 1
  because v4 silently ignores it without an `@config` directive). Registry
  snippets written for v3 (`theme.extend`) must be ported into `@theme`.
  Canonical class names changed too (e.g. `bg-linear-to-br`, `bg-size-[…]`);
  the IDE plugin flags the old spellings.
- Docs were only spot-verified for Phase 1 scope (proxy, caching,
  revalidating, css, fonts). Before Phase 2+ work on route handlers, Server
  Actions ("mutating data"), or deploying, read those specific guides.
