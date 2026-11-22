// Copyright (c) 2026 EdTech. All rights reserved.

import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";

import { resultsSheetRows, resultsToXlsx, summarySheet } from "./export-xlsx";
import type { SavedResult } from "./repository";

const RESULT: SavedResult = {
  resultsId: "ALGN-7KQ2-MX9P",
  code: ["I", "R", "A"],
  scores: {
    realistic: 5,
    investigative: 7,
    artistic: 4,
    social: 1,
    enterprising: 2,
    conventional: 0,
  },
  maxScore: 7,
  gradeLevel: "11",
  strand: "Science, Technology, Engineering, and Mathematics (STEM)",
  age: 16,
  takenOn: "2026-10-01",
  createdAt: "2026-10-01T03:04:05.000Z",
};

const options = { grade: null, exportedOn: "2026-11-11" };

// Reads the parts back out of the zip, following its central directory.
function unzip(bytes: Uint8Array): Map<string, string> {
  const buf = Buffer.from(bytes);
  const end = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  let at = buf.readUInt32LE(end + 16);
  const files = new Map<string, string>();
  for (let i = 0; i < buf.readUInt16LE(end + 10); i++) {
    const nameLength = buf.readUInt16LE(at + 28);
    const name = buf.toString("utf8", at + 46, at + 46 + nameLength);
    const local = buf.readUInt32LE(at + 42);
    const size = buf.readUInt32LE(at + 20);
    const start = local + 30 + buf.readUInt16LE(local + 26);
    files.set(name, inflateRawSync(buf.subarray(start, start + size)).toString("utf8"));
    at += 46 + nameLength;
  }
  return files;
}

const values = (row: ReturnType<typeof resultsSheetRows>[number]) =>
  row.map((cell) => cell?.value);


describe("resultsSheetRows", () => {
  const rows = resultsSheetRows(
    [RESULT, { ...RESULT, gradeLevel: null, strand: null, age: null }],
    options,
  );

  it("opens with the table's title, a scope line and a key to the letters", () => {
    expect(values(rows[0]!)).toEqual(["Latest results"]);
    expect(values(rows[1]!)[0]).toMatch(/^All grades · All time · 2 results · exported Nov 11, 2026\. Newest first/);
    expect(values(rows[2]!)[0]).toMatch(/from 0 to 7/);
    expect(values(rows[2]!)[0]).toContain("R Realistic, I Investigative, A Artistic");
  });

  it("uses the admin table's columns under a classic blue header", () => {
    expect(values(rows[4]!)).toEqual([
      "Taken", "Code", "", "", "Grade", "Strand", "Age",
      "R", "I", "A", "S", "E", "C",
    ]);
    for (const cell of rows[4]!) {
      expect(cell?.style).toMatchObject({ bold: true, fill: "FF4472C4", color: "FFFFFFFF", border: true });
    }
    // 2026-10-01 as an Excel date serial; the strand by its short name.
    expect(values(rows[5]!)).toEqual([
      46296, "I", "R", "A", 11, "STEM", 16, 5, 7, 4, 1, 2, 0,
    ]);
  });

  it("bands every other row and borders every cell", () => {
    const first = rows[5]!.map((cell) => cell?.style);
    const second = rows[6]!.map((cell) => cell?.style);
    expect(first.every((style) => style?.border)).toBe(true);
    expect(first[0]?.fill).toBeUndefined();
    expect(second[0]?.fill).toBe("FFD9E1F2");
  });

  it("colours each code letter by its trait", () => {
    const fills = rows[5]!.slice(1, 4).map((cell) => cell?.style?.fill);
    expect(new Set(fills).size).toBe(3);
    const other = resultsSheetRows([{ ...RESULT, code: ["R", "I", "A"] }], options)[5]!;
    expect(other.slice(1, 4).map((cell) => cell?.style?.fill)).toEqual([fills[1], fills[0], fills[2]]);
  });

  it("bolds only the scores for letters in the code", () => {
    const bold = rows[5]!.slice(7).map((cell) => Boolean(cell?.style?.bold));
    expect(bold).toEqual([true, true, true, false, false, false]);
  });

  it("says when grade, strand or age was not given", () => {
    expect(values(rows[6]!).slice(4, 7)).toEqual(["Not given", "Not given", "Not given"]);
  });

  it("names the period filter in the subtitle", () => {
    const recent = resultsSheetRows([RESULT], { grade: "11", period: "Last 30 days", exportedOn: "2026-11-11" });
    expect(values(recent[1]!)[0]).toMatch(/^Grade 11 only · Last 30 days · 1 result ·/);
  });

  it("names the grade filter in the subtitle", () => {
    const filtered = resultsSheetRows([RESULT], { grade: "12", exportedOn: "2026-11-11" });
    expect(values(filtered[1]!)[0]).toMatch(/^Grade 12 only · All time · 1 result ·/);
  });
});

describe("summarySheet", () => {
  const now = Date.parse("2026-11-11T00:00:00Z");
  const results: SavedResult[] = [
    { ...RESULT, createdAt: "2026-11-10T00:00:00.000Z" },
    {
      ...RESULT,
      code: ["S", "E", "C"],
      gradeLevel: "12",
      age: 18,
      strand: "General Academic Strand (GAS)",
      createdAt: "2026-11-01T00:00:00.000Z",
    },
    {
      ...RESULT,
      code: ["S", "E", "C"],
      gradeLevel: "12",
      age: null,
      strand: null,
      createdAt: "2026-08-01T00:00:00.000Z",
    },
  ];
  const { rows, merges } = summarySheet(results, { grade: null, exportedOn: "2026-11-11", now });
  const find = (label: string, from = 0) =>
    rows.slice(from).find((row) => row[0]?.value === label || row[1]?.value === label);
  const figure = (label: string) => find(label)?.[2]?.value;

  it("puts the page's cards in an Overview table", () => {
    expect(values(rows[0]!)).toEqual(["Saved results summary"]);
    expect(values(rows[1]!)[0]).toMatch(/^All grades · All time · 3 results · exported Nov 11, 2026\./);
    expect(values(find("Measure")!)).toEqual(["Measure", "", "Value", "Notes", ""]);
    expect(figure("Saved results")).toBe(3);
    expect(figure("Grade 11")).toBe(1);
    expect(figure("Grade 12")).toBe(2);
    expect(find("Grade 12")?.[3]?.value).toBe("67% of saved results.");
    expect(figure("Last 30 days")).toBe(2);
    expect(figure("Average age")).toBe(17);
    expect(figure("Most common code")).toBe("S-E-C");
    expect(find("Most common code")?.[3]?.value).toBe("2 students, 67%.");
  });

  it("lists each section the page charts, with shares and a Total row", () => {
    for (const heading of ["Strongest interest area", "Most common codes", "Strand", "Age"]) {
      expect(find(heading)).toBeDefined();
    }
    const social = find("Social");
    expect(social?.[0]?.value).toBe("S");
    expect(social?.[2]?.value).toBe(2);
    expect(social?.[3]?.value).toBeCloseTo(2 / 3);
    expect(social?.[3]?.style?.numFmt).toBe("0%");
    expect(find("STEM")?.[2]?.value).toBe(1);
    // Only Age keeps a "Not given" row; strands saved before they were
    // collected are left out of the Strand table.
    expect(rows.filter((row) => row[0]?.value === "Not given")).toHaveLength(1);

    const totals = rows.filter((row) => row[0]?.value === "Total");
    expect(totals).toHaveLength(3); // interest area, strand, age; not the top-10 codes
    expect(totals.map((row) => row[2]?.value)).toEqual([3, 2, 3]);
    expect(totals[1]?.[3]?.value).toBeCloseTo(2 / 3);
    for (const row of totals) expect(row[0]?.style?.bold).toBe(true);
  });

  it("merges the name columns where a table has no letters", () => {
    const stem = rows.findIndex((row) => row[0]?.value === "STEM") + 1;
    expect(merges).toContain(`A${stem}:B${stem}`);
  });

  it("copes with no results", () => {
    const empty = summarySheet([], { grade: "11", exportedOn: "2026-11-11", now }).rows;
    expect(empty.find((row) => row[0]?.value === "Average age")?.[2]?.value).toBe("N/A");
    expect(empty.find((row) => row[0]?.value === "No results yet.")).toBeDefined();
  });
});

describe("resultsToXlsx", () => {
  const files = unzip(resultsToXlsx([RESULT], options));

  it("packs every part an Excel workbook needs, Summary first", () => {
    expect([...files.keys()]).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/workbook.xml",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/worksheets/sheet1.xml",
      "xl/worksheets/sheet2.xml",
    ]);
    const workbook = files.get("xl/workbook.xml")!;
    expect(workbook.indexOf('name="Summary"')).toBeLessThan(workbook.indexOf('name="Latest results"'));
  });

  it("keeps Excel's gridlines, freezes the header, merges Code, adds filters and escapes text", () => {
    const sheet = files.get("xl/worksheets/sheet2.xml")!;
    expect(sheet).not.toContain("showGridLines");
    expect(sheet).toContain('state="frozen"');
    expect(sheet).toContain('<mergeCell ref="B5:D5"/>');
    expect(sheet).toContain('<autoFilter ref="A5:M6"/>');

    const odd = unzip(resultsToXlsx([{ ...RESULT, strand: "A<&>\u0001" as SavedResult["strand"] }], options));
    expect(odd.get("xl/worksheets/sheet2.xml")).toContain("A&lt;&amp;&gt;<");
  });

  it("declares every style a cell uses, once", () => {
    const styles = files.get("xl/styles.xml")!;
    const declared = Number(/<cellXfs count="(\d+)">/.exec(styles)![1]);
    const xfs = styles.match(/<cellXfs[\s\S]*<\/cellXfs>/)![0].match(/<xf [^>]*>/g)!;
    expect(xfs).toHaveLength(declared);
    expect(new Set(styles.match(/<cellXfs[\s\S]*<\/cellXfs>/)![0].match(/<xf [\s\S]*?(?:\/>|<\/xf>)/g)).size).toBe(declared);
    const used = ["sheet1", "sheet2"].flatMap((name) =>
      [...files.get(`xl/worksheets/${name}.xml`)!.matchAll(/ s="(\d+)"/g)].map((m) => Number(m[1])),
    );
    expect(Math.max(...used)).toBeLessThan(declared);
    for (const tag of ["fonts", "fills", "borders"]) {
      const block = new RegExp(`<${tag} count="(\\d+)">([\\s\\S]*?)</${tag}>`).exec(styles)!;
      const inner = tag.slice(0, -1);
      expect(block[2]!.match(new RegExp(`<${inner}>`, "g"))).toHaveLength(Number(block[1]));
    }
  });
});
