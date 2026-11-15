// Copyright (c) 2026 EdTech. All rights reserved.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// The admin page's sign-in (PRD FR-10). One shared password, no accounts:
// a correct password earns a signed cookie that says only "admin until
// <time>". The signing key comes from the password, so changing the
// password signs everyone out. Nothing about a session is stored.
//
// Server-only setting in apps/web/.env.local:
//   ADMIN_PASSWORD  at least 16 characters, e.g. from
//                   node -e "console.log(require('crypto').randomBytes(15).toString('base64url'))"

export const MIN_ADMIN_PASSWORD_LENGTH = 16;
export const ADMIN_COOKIE = "aligned_admin";
export const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function usable(password: string | undefined): password is string {
  return !!password && password.length >= MIN_ADMIN_PASSWORD_LENGTH;
}

// False when ADMIN_PASSWORD is unset or too short, so a missing or weak
// setting locks the page instead of opening it.
export function isAdminPassword(
  candidate: string,
  expected: string | undefined = process.env.ADMIN_PASSWORD,
): boolean {
  if (!usable(expected)) return false;
  // Hashing first makes the comparison constant-time whatever the lengths.
  return timingSafeEqual(digest(candidate), digest(expected));
}

function signature(expires: number, password: string): string {
  const key = digest(`aligned-admin-session-key:${password}`);
  return createHmac("sha256", key)
    .update(`admin-session:${expires}`)
    .digest("base64url");
}

// The cookie value: "<expiry in ms>.<signature>".
export function createAdminSession(
  now = Date.now(),
  password: string | undefined = process.env.ADMIN_PASSWORD,
): string {
  if (!usable(password)) throw new Error("ADMIN_PASSWORD is not set up.");
  const expires = now + ADMIN_SESSION_MS;
  return `${expires}.${signature(expires, password)}`;
}

export function isValidAdminSession(
  value: string | undefined,
  now = Date.now(),
  password: string | undefined = process.env.ADMIN_PASSWORD,
): boolean {
  if (!value || !usable(password)) return false;
  const match = /^(\d{1,16})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match) return false;
  const expires = Number(match[1]);
  // Expired, or further out than any session this server issues.
  if (!(expires > now && expires <= now + ADMIN_SESSION_MS)) return false;
  return timingSafeEqual(
    Buffer.from(match[2]!),
    Buffer.from(signature(expires, password)),
  );
}
