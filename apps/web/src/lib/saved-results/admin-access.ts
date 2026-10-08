// Copyright (c) 2026 EdTech. All rights reserved.

import { createHash, timingSafeEqual } from "node:crypto";

// The admin page has no login: it lives at /admin/<ADMIN_TOKEN>, and the
// link itself is the key. Share it only with program admins; to revoke it,
// change ADMIN_TOKEN and restart the server.
//
// Server-only setting in apps/web/.env.local:
//   ADMIN_TOKEN  at least 32 random characters, e.g. from
//                node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"

export const MIN_ADMIN_TOKEN_LENGTH = 32;

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

// False when ADMIN_TOKEN is unset or too short, so a missing or weak
// setting locks the page instead of opening it.
export function isAdminToken(
  candidate: string,
  expected: string | undefined = process.env.ADMIN_TOKEN,
): boolean {
  if (!expected || expected.length < MIN_ADMIN_TOKEN_LENGTH) return false;
  // Hashing first makes the comparison constant-time whatever the lengths.
  return timingSafeEqual(digest(candidate), digest(expected));
}
