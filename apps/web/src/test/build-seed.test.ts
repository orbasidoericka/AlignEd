import { describe, expect, it } from "vitest";

import {
  buildSeedSql,
  isRiasecTag,
  isSlug,
  loadData,
  parseCsv,
  validateData,
  type SeedData,
} from "../../../../scripts/build-seed.mjs";

const emptyData = (): SeedData => ({
  universities: [],
  courses: [],
  careers: [],
  universityCourses: [],
  courseCareers: [],
});

describe("parseCsv", () => {
  it("parses quoted fields containing commas and escaped quotes", () => {
    const rows = parseCsv(
      'slug,description\nfoo,"Hello, ""world"" — with commas"\n',
    );
    expect(rows).toEqual([
      { slug: "foo", description: 'Hello, "world" — with commas' },
    ]);
  });
});

describe("isRiasecTag", () => {
  it.each(["R", "SIA", "IRC"])("accepts %s", (tag) => {
    expect(isRiasecTag(tag)).toBe(true);
  });

  it.each(["", "X", "SS", "RIAS", "sia", "S1A"])("rejects %s", (tag) => {
    expect(isRiasecTag(tag)).toBe(false);
  });
});

describe("isSlug", () => {
  it("accepts kebab-case and rejects everything else", () => {
    expect(isSlug("bs-nursing")).toBe(true);
    expect(isSlug("BS Nursing")).toBe(false);
    expect(isSlug("-leading")).toBe(false);
  });
});

describe("validateData", () => {
  it("rejects an invalid RIASEC tag on a course", () => {
    const data = emptyData();
    data.courses.push({
      slug: "bs-test",
      name: "BS Test",
      riasec_tag: "XYZ",
    });
    const errors = validateData(data);
    expect(errors.some((e) => e.includes('invalid RIASEC tag "XYZ"'))).toBe(
      true,
    );
  });

  it("rejects a link that points at an unknown course", () => {
    const data = emptyData();
    data.careers.push({
      slug: "some-career",
      title: "Some Career",
      riasec_tag: "SIA",
      day_in_life: "A day.",
    });
    data.courseCareers.push({
      course_slug: "ghost-course",
      career_slug: "some-career",
    });
    const errors = validateData(data);
    expect(errors.some((e) => e.includes('unknown course "ghost-course"'))).toBe(
      true,
    );
  });

  it("accepts the real committed dataset", () => {
    expect(validateData(loadData())).toEqual([]);
  });
});

describe("buildSeedSql", () => {
  it("escapes single quotes for SQL", () => {
    const data = emptyData();
    data.careers.push({
      slug: "farmer",
      title: "Farmer's Friend",
      riasec_tag: "R",
      summary: "",
      work_environment: "",
      typical_tools: "",
      day_in_life: "It's a good day.",
    });
    const sql = buildSeedSql(data);
    expect(sql).toContain("'Farmer''s Friend'");
    expect(sql).toContain("'It''s a good day.'");
  });
});
