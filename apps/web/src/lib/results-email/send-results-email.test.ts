import { afterEach, describe, expect, it, vi } from "vitest";

import { sendResultsEmail } from "./send-results-email";

const input = {
  email: "mari@example.com",
  consent: true,
  website: "",
  nickname: "MARI",
  gradeLevel: "11" as const,
  code: ["I", "R", "A"] as const,
  scores: {
    realistic: 6,
    investigative: 7,
    artistic: 5,
    social: 2,
    enterprising: 1,
    conventional: 0,
  },
  maxScore: 7,
  // Late evening local time: the date sent must still be the 30th.
  takenOn: new Date(2026, 8, 30, 23, 30),
  resultsId: "ALGN-7KQ2-MX9P",
};

function reply(status: number, body: object = {}) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status }),
  );
}

describe("sendResultsEmail", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts only letters, numbers and the nickname to the app's route", async () => {
    const fetchMock = reply(200, { ok: true });
    vi.stubGlobal("fetch", fetchMock);

    expect(await sendResultsEmail(input)).toBe("sent");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/send-results");
    expect(JSON.parse(init.body)).toEqual({
      email: "mari@example.com",
      consent: true,
      website: "",
      results: {
        nickname: "MARI",
        gradeLevel: "11",
        code: ["I", "R", "A"],
        scores: input.scores,
        maxScore: 7,
        takenOn: "2026-09-30",
        resultsId: "ALGN-7KQ2-MX9P",
      },
    });
  });

  it("maps each server reply to what the dialog should say", async () => {
    vi.stubGlobal("fetch", reply(429, { error: "rate_limited" }));
    expect(await sendResultsEmail(input)).toBe("rate_limited");

    vi.stubGlobal("fetch", reply(400, { error: "invalid" }));
    expect(await sendResultsEmail(input)).toBe("invalid");

    vi.stubGlobal("fetch", reply(500, { error: "not_configured" }));
    expect(await sendResultsEmail(input)).toBe("not_configured");

    vi.stubGlobal("fetch", reply(502, { error: "failed" }));
    expect(await sendResultsEmail(input)).toBe("failed");
  });

  it("reports failure when offline instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect(await sendResultsEmail(input)).toBe("failed");
  });
});
