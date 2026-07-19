#!/usr/bin/env node
// Builds supabase/seed.sql from the CSVs in data/.
//
//   node scripts/build-seed.mjs
//
// Zero dependencies. Validates slugs, RIASEC tags, enums, tuition bands, and
// referential integrity across files before emitting SQL, so bad content
// fails here — not inside Postgres. Functions are exported for unit tests.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- CSV ---------------------------------------------------------------

/** Minimal RFC-4180-ish CSV parser (quoted fields, embedded commas/newlines). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  const src = text.replace(/\r\n/g, "\n").replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((cell) => cell !== "")) rows.push(row);

  const [header, ...records] = rows;
  return records.map((cells) =>
    Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ""])),
  );
}

// --- Validation --------------------------------------------------------

export function isSlug(value) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}

/** 1-3 letter Holland code, letters from RIASEC, no repeats. */
export function isRiasecTag(value) {
  return /^[RIASEC]{1,3}$/.test(value) && new Set(value).size === value.length;
}

export function validateData({
  universities,
  courses,
  careers,
  universityCourses,
  courseCareers,
}) {
  const errors = [];
  const err = (file, row, message) =>
    errors.push(`${file} row ${row + 2}: ${message}`); // +2: header + 1-based

  const uniqueSlugs = (file, rows, key = "slug") => {
    const seen = new Set();
    rows.forEach((r, i) => {
      const slug = r[key];
      if (!isSlug(slug)) err(file, i, `invalid slug "${slug}"`);
      if (seen.has(slug)) err(file, i, `duplicate slug "${slug}"`);
      seen.add(slug);
    });
    return seen;
  };

  const universitySlugs = uniqueSlugs("universities.csv", universities);
  const courseSlugs = uniqueSlugs("courses.csv", courses);
  const careerSlugs = uniqueSlugs("careers.csv", careers);

  universities.forEach((u, i) => {
    if (!u.name) err("universities.csv", i, "missing name");
    if (!u.city || !u.province)
      err("universities.csv", i, "missing city/province");
    if (!["public", "private"].includes(u.type))
      err("universities.csv", i, `type must be public|private, got "${u.type}"`);
  });

  courses.forEach((c, i) => {
    if (!c.name) err("courses.csv", i, "missing name");
    if (!isRiasecTag(c.riasec_tag))
      err("courses.csv", i, `invalid RIASEC tag "${c.riasec_tag}"`);
  });

  careers.forEach((c, i) => {
    if (!c.title) err("careers.csv", i, "missing title");
    if (!isRiasecTag(c.riasec_tag))
      err("careers.csv", i, `invalid RIASEC tag "${c.riasec_tag}"`);
    if (!c.day_in_life)
      err("careers.csv", i, "missing day_in_life (Future Self needs it)");
  });

  const seenLinks = new Set();
  universityCourses.forEach((link, i) => {
    if (!universitySlugs.has(link.university_slug))
      err("university_courses.csv", i, `unknown university "${link.university_slug}"`);
    if (!courseSlugs.has(link.course_slug))
      err("university_courses.csv", i, `unknown course "${link.course_slug}"`);
    const key = `${link.university_slug}::${link.course_slug}`;
    if (seenLinks.has(key)) err("university_courses.csv", i, `duplicate link ${key}`);
    seenLinks.add(key);
    const low = Number(link.estimated_tuition_low);
    const high = Number(link.estimated_tuition_high);
    if (!Number.isInteger(low) || low < 0)
      err("university_courses.csv", i, `tuition_low must be a non-negative integer`);
    if (!Number.isInteger(high) || high < low)
      err("university_courses.csv", i, `tuition_high must be an integer >= tuition_low`);
  });

  const seenPairs = new Set();
  courseCareers.forEach((link, i) => {
    if (!courseSlugs.has(link.course_slug))
      err("course_careers.csv", i, `unknown course "${link.course_slug}"`);
    if (!careerSlugs.has(link.career_slug))
      err("course_careers.csv", i, `unknown career "${link.career_slug}"`);
    const key = `${link.course_slug}::${link.career_slug}`;
    if (seenPairs.has(key)) err("course_careers.csv", i, `duplicate link ${key}`);
    seenPairs.add(key);
  });

  return errors;
}

// --- SQL emission ------------------------------------------------------

const sq = (value) => `'${String(value).replace(/'/g, "''")}'`;

const textArray = (piped) => {
  const items = piped.split("|").map((s) => s.trim()).filter(Boolean);
  if (items.length === 0) return "'{}'::text[]";
  return `array[${items.map(sq).join(", ")}]::text[]`;
};

export function buildSeedSql(data) {
  const bySlug = (a, b) => a.slug.localeCompare(b.slug);
  const lines = [
    "-- Generated by scripts/build-seed.mjs — DO NOT EDIT BY HAND.",
    "-- Source of truth: data/*.csv. Rebuild with: node scripts/build-seed.mjs",
    "",
    "truncate table public.university_courses, public.course_careers,",
    "  public.universities, public.courses, public.careers",
    "  restart identity cascade;",
    "",
  ];

  lines.push(
    "insert into public.careers (slug, title, riasec_tag, summary, work_environment, typical_tools, day_in_life) values",
  );
  lines.push(
    [...data.careers]
      .sort(bySlug)
      .map(
        (c) =>
          `  (${sq(c.slug)}, ${sq(c.title)}, ${sq(c.riasec_tag)}, ${sq(c.summary)}, ${sq(c.work_environment)}, ${textArray(c.typical_tools)}, ${sq(c.day_in_life)})`,
      )
      .join(",\n") + ";",
    "",
  );

  lines.push(
    "insert into public.courses (slug, name, degree_type, field, riasec_tag, overview, core_subjects, pros, cons) values",
  );
  lines.push(
    [...data.courses]
      .sort(bySlug)
      .map(
        (c) =>
          `  (${sq(c.slug)}, ${sq(c.name)}, ${sq(c.degree_type)}, ${sq(c.field)}, ${sq(c.riasec_tag)}, ${sq(c.overview)}, ${textArray(c.core_subjects)}, ${textArray(c.pros)}, ${textArray(c.cons)})`,
      )
      .join(",\n") + ";",
    "",
  );

  lines.push(
    "insert into public.universities (slug, name, city, province, type, description, website, admission_link) values",
  );
  lines.push(
    [...data.universities]
      .sort(bySlug)
      .map(
        (u) =>
          `  (${sq(u.slug)}, ${sq(u.name)}, ${sq(u.city)}, ${sq(u.province)}, ${sq(u.type)}, ${sq(u.description)}, ${sq(u.website)}, ${sq(u.admission_link)})`,
      )
      .join(",\n") + ";",
    "",
  );

  const linkSort = (a, b) =>
    `${a.university_slug ?? a.course_slug}::${a.course_slug ?? a.career_slug}`.localeCompare(
      `${b.university_slug ?? b.course_slug}::${b.course_slug ?? b.career_slug}`,
    );

  lines.push(
    "insert into public.university_courses (university_id, course_id, estimated_tuition_low, estimated_tuition_high) values",
  );
  lines.push(
    [...data.universityCourses]
      .sort(linkSort)
      .map(
        (l) =>
          `  ((select id from public.universities where slug = ${sq(l.university_slug)}), (select id from public.courses where slug = ${sq(l.course_slug)}), ${Number(l.estimated_tuition_low)}, ${Number(l.estimated_tuition_high)})`,
      )
      .join(",\n") + ";",
    "",
  );

  lines.push(
    "insert into public.course_careers (course_id, career_id) values",
  );
  lines.push(
    [...data.courseCareers]
      .sort(linkSort)
      .map(
        (l) =>
          `  ((select id from public.courses where slug = ${sq(l.course_slug)}), (select id from public.careers where slug = ${sq(l.career_slug)}))`,
      )
      .join(",\n") + ";",
    "",
  );

  return lines.join("\n");
}

// --- Main --------------------------------------------------------------

export function loadData(root = ROOT) {
  const read = (name) =>
    parseCsv(readFileSync(join(root, "data", name), "utf8"));
  return {
    universities: read("universities.csv"),
    courses: read("courses.csv"),
    careers: read("careers.csv"),
    universityCourses: read("university_courses.csv"),
    courseCareers: read("course_careers.csv"),
  };
}

function main() {
  const data = loadData();
  const errors = validateData(data);
  if (errors.length > 0) {
    console.error(`Seed validation failed (${errors.length} error(s)):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  const outPath = join(ROOT, "supabase", "seed.sql");
  writeFileSync(outPath, buildSeedSql(data) + "\n", "utf8");
  const counts = Object.entries(data)
    .map(([k, v]) => `${k}=${v.length}`)
    .join(", ");
  console.log(`Wrote ${outPath} (${counts})`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
