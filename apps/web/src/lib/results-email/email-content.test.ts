import { describe, expect, it } from "vitest";

import {
  buildResultsEmail,
  MAX_PHOTO_BYTES,
  normalizeEmail,
  parseTakenOn,
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
  results: {
    nickname: "MARI",
    gradeLevel: "11",
    code: ["I", "R", "A"],
    scores,
    maxScore: 7,
    takenOn: "2026-09-30",
  },
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

describe("career look photo", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9]);
  const withPhoto = (photo: unknown) => validateRequest({ ...valid, photo });

  it("is optional", () => {
    const result = validateRequest(valid);
    expect(result.ok && result.value.photo).toBeNull();
  });

  it("accepts a base64 JPEG", () => {
    const result = withPhoto(jpeg.toString("base64"));
    expect(result.ok && result.value.photo?.equals(jpeg)).toBe(true);
  });

  it("rejects anything that is not a JPEG, or is too big", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0xff, 0xd9]);
    expect(withPhoto(png.toString("base64")).ok).toBe(false);
    expect(withPhoto("not base64!").ok).toBe(false);
    expect(withPhoto(42).ok).toBe(false);
    const huge = Buffer.alloc(MAX_PHOTO_BYTES + 10);
    huge.set([0xff, 0xd8, 0xff]);
    huge.set([0xff, 0xd9], huge.length - 2);
    expect(withPhoto(huge.toString("base64")).ok).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("treats case and spaces as the same address for rate limiting", () => {
    expect(normalizeEmail(" Mari@Example.COM ")).toBe("mari@example.com");
  });
});

describe("assessment date", () => {
  const withTakenOn = (takenOn: unknown) =>
    validateRequest({ ...valid, results: { ...valid.results, takenOn } });

  it("accepts a real calendar date and rejects anything else", () => {
    expect(withTakenOn("2026-09-30").ok).toBe(true);
    expect(withTakenOn("2026-02-30").ok).toBe(false); // no 30 February
    expect(withTakenOn("09/30/2026").ok).toBe(false);
    expect(withTakenOn(undefined).ok).toBe(false);
  });

  it("parses to local midnight, so the password date is the student's day", () => {
    const date = parseTakenOn("2026-09-30")!;
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([
      2026, 8, 30,
    ]);
  });

  it("only allows the grades the app offers", () => {
    const withGrade = (gradeLevel: unknown) =>
      validateRequest({ ...valid, results: { ...valid.results, gradeLevel } });
    expect(withGrade("12").ok).toBe(true);
    expect(withGrade(null).ok).toBe(true);
    expect(withGrade("Grade <b>11</b>").ok).toBe(false);
  });
});

describe("buildResultsEmail", () => {
  const email = buildResultsEmail({
    nickname: "MARI",
    gradeLevel: "11",
    code: ["I", "R", "A"],
    scores,
    maxScore: 7,
    takenOn: "2026-09-30",
  });

  it("greets the student and names the PDF attachment", () => {
    expect(email.subject).toBe("Your AlignEd results (PDF)");
    expect(email.html).toContain("Hi MARI,");
    expect(email.text).toContain("Hi MARI,");
    expect(email.attachmentName).toBe("AlignEd-results-MARI.pdf");
  });

  it("explains the password rule without giving away the password", () => {
    for (const body of [email.html, email.text]) {
      expect(body).toContain("three-letter RIASEC code");
      // This student's real password must never be in the email.
      expect(body).not.toContain("MARIIRA");
    }
  });

  it("mentions the career look photo only when it is attached", () => {
    expect(email.text).not.toContain("career look photo");
    const withPhoto = buildResultsEmail(
      {
        nickname: "MARI",
        gradeLevel: "11",
        code: ["I", "R", "A"],
        scores,
        maxScore: 7,
        takenOn: "2026-09-30",
      },
      { withPhoto: true },
    );
    expect(withPhoto.text).toContain("career look photo");
    expect(withPhoto.photoName).toBe("AlignEd-career-look-MARI.jpg");
  });

  it("keeps the results themselves inside the locked PDF", () => {
    for (const body of [email.html, email.text]) {
      expect(body).not.toContain("I-R-A");
      expect(body).not.toContain("7 / 7");
      expect(body).not.toContain("Marine Biology");
    }
  });

  it("tells the student the address was not kept", () => {
    expect(email.text).toContain("did not keep your address");
  });
});
