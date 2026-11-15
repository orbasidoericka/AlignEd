// Copyright (c) 2026 EdTech. All rights reserved.

import { cookies } from "next/headers";

import { ADMIN_COOKIE, isValidAdminSession } from "./admin-access";

// True when this request carries a valid admin session cookie. Server
// components and route handlers only.
export async function hasAdminSession(): Promise<boolean> {
  const store = await cookies();
  return isValidAdminSession(store.get(ADMIN_COOKIE)?.value);
}
