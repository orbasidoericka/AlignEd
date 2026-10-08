import { describe, expect, it } from "vitest";

import { isAdminToken } from "./admin-access";

const TOKEN = "k3J9xQ2mP7vR4tW8yZ1bN6cF5dH0gL2s";

describe("isAdminToken", () => {
  it("accepts only the exact token", () => {
    expect(isAdminToken(TOKEN, TOKEN)).toBe(true);
    expect(isAdminToken(TOKEN.slice(0, -1), TOKEN)).toBe(false);
    expect(isAdminToken(`${TOKEN}x`, TOKEN)).toBe(false);
    expect(isAdminToken("", TOKEN)).toBe(false);
  });

  it("stays locked when the token is unset or too short", () => {
    expect(isAdminToken("anything", undefined)).toBe(false);
    expect(isAdminToken("", "")).toBe(false);
    expect(isAdminToken("short", "short")).toBe(false);
  });
});
