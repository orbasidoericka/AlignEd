// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const saveResult = vi.fn();
const createSupabaseAdminClient = vi.fn();

vi.mock("@/lib/saved-results/repository", () => ({ saveResult }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient }));

const results = {
  gradeLevel: "11",
  takenOn: "2026-09-30",
  code: ["I", "R", "A"],
  scores: {
    realistic: 6,
    investigative: 7,
    artistic: 5,
    social: 2,
    enterprising: 1,
    conventional: 0,
  },
  maxScore: 7,
};

function request(method: string, path: string, body?: unknown, ip = "203.0.113.7") {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

// Fresh module per test, so each starts with an empty rate limiter.
async function load() {
  vi.resetModules();
  return import("./route");
}

describe("/api/results", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSupabaseAdminClient.mockReturnValue({});
    saveResult.mockResolvedValue("ALGN-7KQ2-MX9P");
  });

  it("saves the scores and answers with the results ID", async () => {
    const { POST } = await load();
    const response = await POST(
      request("POST", "/api/results", {
        ...results,
        age: "16",
        strand: "Sports",
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ resultsId: "ALGN-7KQ2-MX9P" });
    expect(saveResult).toHaveBeenCalledWith(
      {},
      { ...results, age: 16, strand: "Sports" },
    );
  });

  it("saves the word Others as a strand, never typed text", async () => {
    const { POST } = await load();
    const response = await POST(
      request("POST", "/api/results", { ...results, strand: "Others" }),
    );
    expect(response.status).toBe(200);
    expect(saveResult.mock.calls[0]![1].strand).toBe("Others");
    const typed = await POST(
      request("POST", "/api/results", { ...results, strand: "Cookery" }),
    );
    expect(typed.status).toBe(400);
  });

  it("saves without a strand when none is given, and rejects any other text", async () => {
    const { POST } = await load();
    await POST(request("POST", "/api/results", results));
    expect(saveResult.mock.calls[0]![1].strand).toBeNull();
    for (const strand of ["STEM", "", "My school club", 3]) {
      const response = await POST(
        request("POST", "/api/results", { ...results, strand }),
      );
      expect(response.status).toBe(400);
    }
    expect(saveResult).toHaveBeenCalledTimes(1);
  });

  it("saves without an age when none is given, and rejects a bad one", async () => {
    const { POST } = await load();
    await POST(request("POST", "/api/results", { ...results, age: "" }));
    expect(saveResult.mock.calls[0]![1].age).toBeNull();
    for (const age of ["9", "31", "16.5", "sixteen"]) {
      const response = await POST(
        request("POST", "/api/results", { ...results, age }),
      );
      expect(response.status).toBe(400);
    }
    expect(saveResult).toHaveBeenCalledTimes(1);
  });

  it("never saves a name or other free text it is sent", async () => {
    const { POST } = await load();
    await POST(
      request("POST", "/api/results", { ...results, nickname: "MARI", school: "X High" }),
    );
    const saved = saveResult.mock.calls[0]![1];
    expect(saved).not.toHaveProperty("nickname");
    expect(saved).not.toHaveProperty("school");
  });

  it("rejects invalid results without saving", async () => {
    const { POST } = await load();
    const response = await POST(
      request("POST", "/api/results", { ...results, code: ["I", "I", "A"] }),
    );
    expect(response.status).toBe(400);
    expect(saveResult).not.toHaveBeenCalled();
  });

  it("says it is not set up when Supabase is not configured", async () => {
    createSupabaseAdminClient.mockReturnValue(null);
    const { POST } = await load();
    const saved = await POST(request("POST", "/api/results", results));
    expect(saved.status).toBe(500);
    expect(await saved.json()).toEqual({ error: "not_configured" });
  });

  it("reports a database failure", async () => {
    saveResult.mockRejectedValueOnce(Object.assign(new Error("db"), { code: "XX000" }));
    const { POST } = await load();
    const response = await POST(request("POST", "/api/results", results));
    expect(response.status).toBe(502);
  });

  it("rate-limits saves per network, so a school lab can't flood the table", async () => {
    const { POST } = await load();
    for (let i = 0; i < 200; i++) {
      await POST(request("POST", "/api/results", results));
    }
    const blocked = await POST(request("POST", "/api/results", results));
    expect(blocked.status).toBe(429);
    const otherNetwork = await POST(
      request("POST", "/api/results", results, "198.51.100.1"),
    );
    expect(otherNetwork.status).toBe(200);
  });
});
