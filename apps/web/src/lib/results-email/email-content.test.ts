import { describe, expect, it } from "vitest";

import {
  buildResultsEmail,
  normalizeEmail,
  validateRequest,
} from "./email-content";

const scores = {
  realistic: 6,
  investigative: 7,
  artistic: 5,
  social: 2,
  enterprising: 1,
  conventional: 0,
};

const valid = {
  email: "  Mari@Example.com ",
  consent: true,
  website: "",
  results: { nickname: "MARI", code: ["I", "R", "A"], scores, maxScore: 7 },
};

describe("validateRequest", () => {
  it("accepts a well-formed request and trims the address", () => {
    const result = validateRequest(valid);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.email).toBe("Mari@Example.com");
  });

  it("rejects a bad address, missing consent, or a non-object body", () => {
    expect(validateRequest({ ...valid, email: "not-an-email" }).ok).toBe(false);
    expect(validateRequest({ ...valid, consent: false }).ok).toBe(false);
    expect(validateRequest("hello").ok).toBe(false);
  });

  it("rejects results that could smuggle in arbitrary text", () => {
    const withResults = (results: object) =>
      validateRequest({ ...valid, results: { ...valid.results, ...results } });
    expect(withResults({ nickname: "<b>hi</b>" }).ok).toBe(false);
    expect(withResults({ code: ["I", "R", "X"] }).ok).toBe(false);
    expect(withResults({ code: ["I", "I", "A"] }).ok).toBe(false);
    expect(withResults({ scores: { ...scores, social: 8 } }).ok).toBe(false);
    expect(withResults({ scores: { ...scores, social: "lots" } }).ok).toBe(false);
  });

  it("passes the honeypot through so the route can quietly drop bots", () => {
    const result = validateRequest({ ...valid, website: "spam.example" });
    expect(result.ok && result.value.website).toBe("spam.example");
  });
});

describe("normalizeEmail", () => {
  it("treats case and spaces as the same address for rate limiting", () => {
    expect(normalizeEmail(" Mari@Example.COM ")).toBe("mari@example.com");
  });
});

describe("buildResultsEmail", () => {
  const email = buildResultsEmail({
    nickname: "MARI",
    code: ["I", "R", "A"],
    scores,
    maxScore: 7,
  });

  it("puts the Holland Code in the subject and greets the student", () => {
    expect(email.subject).toBe("Your AlignEd results: I-R-A");
    expect(email.html).toContain("Hi MARI,");
    expect(email.text).toContain("Hi MARI,");
  });

  it("lists every score and the majors for the code's letters only", () => {
    for (const body of [email.html, email.text]) {
      expect(body).toContain("7 / 7");
      expect(body).toContain("0 / 7");
      expect(body).toContain("Marine Biology");
      expect(body).toContain("Construction");
      expect(body).toContain("Photography");
      expect(body).not.toContain("Accounting");
    }
  });

  it("tells the student the address was not kept", () => {
    expect(email.text).toContain("did not keep your address");
  });
});
