# AlignEd web app

Anonymous RIASEC career guidance for Philippine Senior High School students (Next.js 16 App Router, React 19, Tailwind v4). Read the repository-root `CLAUDE.md` and `docs/` before changing anything: `docs/AlignEd_PRD.md` is the scope, `docs/FRONTEND.md`, `docs/BACKEND.md` and `docs/DESIGN.md` describe the code.

## Run it

From the repository root (npm workspaces):

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint && npm run typecheck && npm test
npm -w apps/web run test:e2e   # Playwright is configured; no specs written yet
```

`predev` and `prebuild` download the MediaPipe models used by the career look (`scripts/prepare-face-model.mjs`). Server settings (Supabase, Gmail, admin password, optional PostHog) go in `apps/web/.env.local`; the variables are listed in `docs/BACKEND.md`.

## Where things are

- `src/app`: `(site)` landing, About Us and results; `(focus)/assessment` profile and quiz; `admin`; `api/results` and `api/send-results`.
- `src/lib/riasec`: questions, scoring, career pathways.
- `src/store/useAssessmentStore.ts`: the persisted session.

Fonts are Poppins (headings) and Nunito Sans (body), loaded with `next/font/google` in `src/app/layout.tsx`.
