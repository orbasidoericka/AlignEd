// Copyright (c) 2026 EdTech. All rights reserved.

"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MS,
  createAdminSession,
  isAdminPassword,
} from "@/lib/saved-results/admin-access";
import { callerKey, createWindowLimiter } from "@/lib/saved-results/ip-limiter";

// Sign-in and sign-out for /admin (PRD FR-10). Every attempt counts toward
// the limits, right or wrong. The password is never logged or sent back.

const perNetwork = createWindowLimiter(5, 15 * 60 * 1000);
const overall = createWindowLimiter(30, 60 * 60 * 1000);

export type SignInState = { error: string } | null;

export async function signIn(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const key = callerKey(await headers());
  // Both limiters are hit on every attempt so neither can be skipped.
  const networkLimited = perNetwork.hit(key);
  const overallLimited = overall.hit("all");
  if (networkLimited || overallLimited) {
    return { error: "Too many tries. Wait 15 minutes, then try again." };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !isAdminPassword(password)) {
    return { error: "That password is not right." };
  }

  (await cookies()).set(ADMIN_COOKIE, createAdminSession(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: ADMIN_SESSION_MS / 1000,
  });
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin");
}
