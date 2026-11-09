// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const saveResult = vi.fn();
const deleteResult = vi.fn();
const createSupabaseAdminClient = vi.fn();

vi.mock("@/lib/saved-results/repository", () => ({
  saveResult,
  deleteResult,
}));
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

// Fresh modules per test, so each starts with empty rate limiters.
async function load() {
  vi.resetModules();
  const [collection, item] = await Promise.all([
    import("./route"),
    import("./[id]/route"),
  ]);
  return { collection, item };
}

const context = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/results", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSupabaseAdminClient.mockReturnValue({});
    saveResult.mockResolvedValue("ALGN-7KQ2-MX9P");
  });

  it("saves the scores and answers with the results ID", async () => {
    const { collection } = await load();
    const response = await collection.POST(
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
    const { collection } = await load();
    const response = await collection.POST(
      request("POST", "/api/results", { ...results, strand: "Others" }),
    );
    expect(response.status).toBe(200);
    expect(saveResult.mock.calls[0]![1].strand).toBe("Others");
    const typed = await collection.POST(
      request("POST", "/api/results", { ...results, strand: "Cookery" }),
    );
    expect(typed.status).toBe(400);
  });

  it("saves without a strand when none is given, and rejects any other text", async () => {
    const { collection } = await load();
    await collection.POST(request("POST", "/api/results", results));
    expect(saveResult.mock.calls[0]![1].strand).toBeNull();
    for (const strand of ["STEM", "", "My school club", 3]) {
      const response = await collection.POST(
        request("POST", "/api/results", { ...results, strand }),
      );
      expect(response.status).toBe(400);
    }
    expect(saveResult).toHaveBeenCalledTimes(1);
  });

  it("saves without an age when none is given, and rejects a bad one", async () => {
    const { collection } = await load();
    await collection.POST(request("POST", "/api/results", { ...results, age: "" }));
    expect(saveResult.mock.calls[0]![1].age).toBeNull();
    for (const age of ["9", "31", "16.5", "sixteen"]) {
      const response = await collection.POST(
        request("POST", "/api/results", { ...results, age }),
      );
      expect(response.status).toBe(400);
    }
    expect(saveResult).toHaveBeenCalledTimes(1);
  });

  it("never saves a name or other free text it is sent", async () => {
    const { collection } = await load();
    await collection.POST(
      request("POST", "/api/results", { ...results, nickname: "MARI", school: "X High" }),
    );
    const saved = saveResult.mock.calls[0]![1];
    expect(saved).not.toHaveProperty("nickname");
    expect(saved).not.toHaveProperty("school");
  });

  it("rejects invalid results without saving", async () => {
    const { collection } = await load();
    const response = await collection.POST(
      request("POST", "/api/results", { ...results, code: ["I", "I", "A"] }),
    );
    expect(response.status).toBe(400);
    expect(saveResult).not.toHaveBeenCalled();
  });

  it("says it is not set up when Supabase is not configured", async () => {
    createSupabaseAdminClient.mockReturnValue(null);
    const { collection, item } = await load();
    const saved = await collection.POST(request("POST", "/api/results", results));
    expect(saved.status).toBe(500);
    expect(await saved.json()).toEqual({ error: "not_configured" });
    const deleted = await item.DELETE(request("DELETE", "/api/results/x"), context("ALGN-7KQ2-MX9P"));
    expect(await deleted.json()).toEqual({ error: "not_configured" });
  });

  it("reports a database failure", async () => {
    saveResult.mockRejectedValueOnce(Object.assign(new Error("db"), { code: "XX000" }));
    const { collection } = await load();
    const response = await collection.POST(request("POST", "/api/results", results));
    expect(response.status).toBe(502);
  });

  it("deletes a saved result", async () => {
    deleteResult.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const { item } = await load();
    expect((await item.DELETE(request("DELETE", "/x"), context("ALGN-7KQ2-MX9P"))).status).toBe(200);
    expect((await item.DELETE(request("DELETE", "/x"), context("ALGN-7KQ2-MX9P"))).status).toBe(404);
  });

  it("rate-limits ID lookups per network, so IDs cannot be guessed", async () => {
    deleteResult.mockResolvedValue(false);
    const { item } = await load();
    for (let i = 0; i < 60; i++) {
      await item.DELETE(request("DELETE", "/x"), context("ALGN-7KQ2-MX9P"));
    }
    const blocked = await item.DELETE(request("DELETE", "/x"), context("ALGN-7KQ2-MX9P"));
    expect(blocked.status).toBe(429);
    const otherNetwork = await item.DELETE(
      request("DELETE", "/x", undefined, "198.51.100.1"),
      context("ALGN-7KQ2-MX9P"),
    );
    expect(otherNetwork.status).toBe(404);
  });
});
