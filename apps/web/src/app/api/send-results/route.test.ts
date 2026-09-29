// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Stand-in for Gmail: records what would have been sent.
const sendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail })) },
}));

const body = {
  email: "mari@example.com",
  consent: true,
  website: "",
  results: {
    nickname: "MARI",
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
  },
};

function post(payload: unknown, ip = "203.0.113.7") {
  return new Request("http://localhost/api/send-results", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(payload),
  });
}

// A fresh module per test, so each starts with an empty rate limiter.
async function loadRoute() {
  vi.resetModules();
  return import("./route");
}

describe("POST /api/send-results", () => {
  beforeEach(() => {
    sendMail.mockReset().mockResolvedValue({});
    vi.stubEnv("GMAIL_USER", "aligned.test@gmail.com");
    vi.stubEnv("GMAIL_APP_PASSWORD", "abcd efgh ijkl mnop");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("sends the results email from the configured Gmail account", async () => {
    const { POST } = await loadRoute();
    const response = await POST(post(body));

    expect(response.status).toBe(200);
    expect(sendMail).toHaveBeenCalledOnce();
    const mail = sendMail.mock.calls[0]![0];
    expect(mail.to).toBe("mari@example.com");
    expect(mail.from).toEqual({ name: "AlignEd", address: "aligned.test@gmail.com" });
    expect(mail.subject).toBe("Your AlignEd results: I-R-A");
  });

  it("says it is not set up when the Gmail settings are missing", async () => {
    vi.stubEnv("GMAIL_APP_PASSWORD", "");
    const { POST } = await loadRoute();
    const response = await POST(post(body));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "not_configured" });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rejects invalid requests without sending", async () => {
    const { POST } = await loadRoute();
    const response = await POST(post({ ...body, consent: false }));
    expect(response.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("answers bots that fill the honeypot as if sent, but sends nothing", async () => {
    const { POST } = await loadRoute();
    const response = await POST(post({ ...body, website: "spam.example" }));
    expect(response.status).toBe(200);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rate-limits repeat sends to the same address", async () => {
    const { POST } = await loadRoute();
    // Same address, differently written, from different networks.
    for (const [i, email] of ["mari@example.com", "MARI@example.com", " mari@example.com"].entries()) {
      expect((await POST(post({ ...body, email }, `198.51.100.${i}`))).status).toBe(200);
    }
    const blocked = await POST(post(body, "198.51.100.9"));
    expect(blocked.status).toBe(429);
    expect(sendMail).toHaveBeenCalledTimes(3);
  });

  it("reports a Gmail failure without counting it against the limit", async () => {
    sendMail.mockRejectedValueOnce(Object.assign(new Error("nope"), { code: "EAUTH" }));
    const { POST } = await loadRoute();
    const failed = await POST(post(body));
    expect(failed.status).toBe(502);
    expect(await failed.json()).toEqual({ error: "failed" });
  });
});
