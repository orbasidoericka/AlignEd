// Copyright (c) 2026 EdTech. All rights reserved.

"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { signIn, type SignInState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// The admin page's sign-in (PRD FR-10): one shared password, no username.

export function AdminLoginForm({
  action = signIn,
}: {
  action?: (state: SignInState, formData: FormData) => Promise<SignInState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [visible, setVisible] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const errorId = `${id}-error`;

  // After a wrong try, put the cursor back so the next one is quick.
  useEffect(() => {
    if (state?.error) input.current?.select();
  }, [state]);

  return (
    <form
      action={formAction}
      className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-bento sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <LockKeyhole className="size-5" aria-hidden />
        </span>
        <h2 className="font-heading text-xl font-bold text-foreground">
          Admin sign in
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-foreground">
          Password
        </label>
        <div className="relative">
          <Input
            ref={input}
            id={id}
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            autoFocus
            disabled={pending}
            aria-invalid={state?.error ? true : undefined}
            aria-describedby={state?.error ? errorId : undefined}
            className="h-11 rounded-xl pr-12 text-base"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="absolute top-1 right-1 rounded-lg"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((shown) => !shown)}
          >
            {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </Button>
        </div>
        {state?.error && (
          <p id={errorId} role="alert" className="text-sm font-semibold text-destructive">
            {state.error}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-11 rounded-full text-base font-bold hover:bg-primary/85"
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
