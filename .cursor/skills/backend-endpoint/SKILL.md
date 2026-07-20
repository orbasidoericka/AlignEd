---
name: backend-endpoint
description: Create a typed AlignEd backend write path - the anonymous assessments insert or a Supabase Edge Function - with zod validation, insert-only RLS, and the canonical response shape. Use when adding or changing server-side data access or the email delivery flow.
disable-model-invocation: true
---

# Backend Endpoint

AlignEd has exactly two kinds of write paths (PRD §6): the anonymous
`assessments` insert on quiz completion, and Supabase Edge Functions (today:
`send-results`). No user sessions exist — never build auth-scoped endpoints.

## Steps
1. Define a zod schema for input and infer its TypeScript type; constrain
   enums exactly (grade level 11/12, the seven strands).
2. Choose the path: client-side anon insert (RLS insert-only) for assessment
   completion; an Edge Function (Deno, service role) for anything needing
   secrets, rate limiting, or email.
3. Parse and validate input first; return an error result on failure.
4. Return the canonical shape { data, error, meta }; map failures to
   { code, message }; never leak stack traces, secrets, or raw emails.
5. Edge Functions: enforce consent, rate-limit per IP + salted email hash,
   check the honeypot, and discard the raw address after sending.
6. Insert failures never block the student's results — render client-side and
   retry the insert in the background (PRD E10).
7. Add a Vitest unit test for validation and an integration/e2e test for the
   flow (Resend mocked).
8. Document the endpoint with a one-line rationale and a request/response
   example.

## Template (anonymous completion insert)

```ts
// Copyright (c) 2026 EdTech. All rights reserved.
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";

const completionSchema = z.object({
  scores: z.object({
    realistic: z.number().int().min(0),
    investigative: z.number().int().min(0),
    artistic: z.number().int().min(0),
    social: z.number().int().min(0),
    enterprising: z.number().int().min(0),
    conventional: z.number().int().min(0),
  }),
  hollandCode: z.string().regex(/^[RIASEC]{3}$/),
  gradeLevel: z.union([z.literal(11), z.literal(12)]),
  strand: z.enum(["STEM", "ABM", "HUMSS", "GAS", "TVL", "Arts & Design", "Sports"]),
  school: z.string().max(120).optional(),
});

type Result<T> = { data: T | null; error: { code: string; message: string } | null; meta: Record<string, unknown> };

export async function recordCompletion(raw: unknown): Promise<Result<{ id: string }>> {
  const parsed = completionSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: { code: "invalid_input", message: parsed.error.message }, meta: {} };
  }
  const { data, error } = await supabase.from("assessments").insert(toRow(parsed.data)).select("id").single();
  if (error) return { data: null, error: { code: "db_error", message: error.message }, meta: {} };
  return { data, error: null, meta: {} };
}
```

## Checklist
- [ ] zod validation at the boundary (enums exact)
- [ ] correct path: anon insert vs Edge Function (service role never in Next.js)
- [ ] canonical { data, error, meta } shape
- [ ] explicit error handling; no leaked secrets or raw emails
- [ ] rate limiting + consent + send-and-discard for email paths
- [ ] unit + integration test
