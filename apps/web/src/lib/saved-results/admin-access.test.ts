// Copyright (c) 2026 EdTech. All rights reserved.

import { describe, expect, it } from "vitest";

import {
  ADMIN_SESSION_MS,
  createAdminSession,
  isAdminPassword,
  isValidAdminSession,
} from "./admin-access";

const PASSWORD = "k3J9xQ2mP7vR4tW8";
const NOW = 1_800_000_000_000;

describe("isAdminPassword", () => {
  it("accepts only the exact password", () => {
    expect(isAdminPassword(PASSWORD, PASSWORD)).toBe(true);
    expect(isAdminPassword(PASSWORD.slice(0, -1), PASSWORD)).toBe(false);
    expect(isAdminPassword(`${PASSWORD}x`, PASSWORD)).toBe(false);
    expect(isAdminPassword("", PASSWORD)).toBe(false);
  });

  it("stays locked when the password is unset or too short", () => {
    expect(isAdminPassword("anything", undefined)).toBe(false);
    expect(isAdminPassword("", "")).toBe(false);
    expect(isAdminPassword("short", "short")).toBe(false);
  });
});

describe("admin sessions", () => {
  const session = createAdminSession(NOW, PASSWORD);

  it("accepts a session it issued until it expires", () => {
    expect(isValidAdminSession(session, NOW, PASSWORD)).toBe(true);
    expect(isValidAdminSession(session, NOW + ADMIN_SESSION_MS - 1, PASSWORD)).toBe(true);
    expect(isValidAdminSession(session, NOW + ADMIN_SESSION_MS, PASSWORD)).toBe(false);
  });

  it("rejects an edited signature or expiry", () => {
    const [expires, sig] = session.split(".");
    const flipped = sig!.slice(0, -1) + (sig!.endsWith("A") ? "B" : "A");
    expect(isValidAdminSession(`${expires}.${flipped}`, NOW, PASSWORD)).toBe(false);
    expect(isValidAdminSession(`${Number(expires) + 1000}.${sig}`, NOW, PASSWORD)).toBe(false);
  });

  it("rejects a session that claims to last longer than any issued", () => {
    const far = createAdminSession(NOW + ADMIN_SESSION_MS, PASSWORD);
    expect(isValidAdminSession(far, NOW, PASSWORD)).toBe(false);
  });

  it("signs everyone out when the password changes", () => {
    expect(isValidAdminSession(session, NOW, "another-password-16")).toBe(false);
  });

  it("rejects garbage and refuses to work without a usable password", () => {
    for (const value of [undefined, "", "abc", "1.2", `${NOW}.`, "x.".repeat(30)]) {
      expect(isValidAdminSession(value, NOW, PASSWORD)).toBe(false);
    }
    expect(isValidAdminSession(session, NOW, undefined)).toBe(false);
    expect(() => createAdminSession(NOW, "short")).toThrow();
  });
});
