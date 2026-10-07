import { describe, expect, it } from "vitest";

import { buildResultsPdf } from "./build-results-pdf";

const input = {
  nickname: "MARI",
  gradeLevel: "11",
  age: "17",
  school: "San Fernando NHS",
  scores: {
    realistic: 6,
    investigative: 7,
    artistic: 5,
    social: 2,
    enterprising: 1,
    conventional: 0,
  },
  code: ["I", "R", "A"] as const,
  maxScore: 7,
  takenOn: new Date(2026, 8, 30),
  password: "MARIIRA",
  ownerPassword: "owner-secret",
};

describe("buildResultsPdf", () => {
  it("encrypts with the student's password using AES-256", () => {
    const doc = buildResultsPdf(input);
    expect(doc.userPassword).toBe("MARIIRA");
    // PDF 1.7 extension level 3 is what makes PDFKit use AES-256.
    expect(doc.version).toBe("1.7ext3");
  });

  it("lets the student print and copy, but not edit", () => {
    const doc = buildResultsPdf(input);
    // A separate owner password, or PDFKit forbids everything.
    expect(doc.ownerPassword).toBe("owner-secret");
    expect(doc.permissions).toMatchObject({
      printing: "highResolution",
      copying: true,
      modifying: false,
    });
  });

  it("includes the Holland Code, every score, and the code's majors", () => {
    const text = JSON.stringify(buildResultsPdf(input).content);
    expect(text).toContain("I-R-A");
    expect(text).toContain("MARI · 17 years old · Grade 11 · San Fernando NHS");
    expect(text).toContain("7 / 7");
    expect(text).toContain("0 / 7");
    // One major from each code letter's pathway sheet entry.
    expect(text).toContain("Marine Biology");
    expect(text).toContain("Construction");
    expect(text).toContain("Photography");
    // Letters outside the code are scored but not expanded.
    expect(text).not.toContain("Accounting");
  });
});
