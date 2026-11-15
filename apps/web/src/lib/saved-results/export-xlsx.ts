// Copyright (c) 2026 EdTech. All rights reserved.

import { crc32, deflateRawSync } from "node:zlib";

import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { TRAIT_META, TRAIT_ORDER } from "@/lib/riasec/scoring";
import {
  strandShortName,
  type GradeLevel,
  type RiasecLetter,
} from "@/lib/riasec/types";

import type { SavedResult } from "./repository";
import { summarize } from "./summary";

// The admin export: an Excel workbook in the classic Excel table look (blue
// header row with white bold text, banded rows, thin borders on every cell,
// a bold Total row), with two sheets mirroring the admin page.
//   Summary         the page's cards and charts as tables: an Overview
//                   (saved results by grade, last 30 days, average age, most
//                   common code), then strongest interest area, most common
//                   codes, strand and age, each with Students and Share.
//                   Built with summarize(), the page's own totals.
//   Latest results  the "Latest results" table: the same columns, the code as
//                   three cells in the trait colours, short strand names,
//                   scores in the code bold and the rest grey, real dates,
//                   frozen header, filters.
// Still no names: the saved rows hold none. Server only.
//
// The trait fills copy the Vivid theme's --trait-* tokens in globals.css (a
// spreadsheet cannot read CSS); change them together. The table blues are
// Excel's own default table colours.

export const XLSX_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const RESULTS_HEADER_ROW = 5;

const INK = "FF000000";
const GREY_INK = "FF595959";
const WHITE = "FFFFFFFF";
const HEADER_FILL = "FF4472C4";
const BAND_FILL = "FFD9E1F2";
const TOTAL_FILL = "FFB4C6E7";
const BORDER = "FFBFBFBF";
const TRAIT_FILL: Record<RiasecLetter, string> = {
  R: "FFFF9AA2",
  I: "FFA37CFF",
  A: "FFE8D5B5",
  S: "FFA6C8E2",
  E: "FFFF7F4D",
  C: "FF1FD8C8",
};
const LETTERS: RiasecLetter[] = ["R", "I", "A", "S", "E", "C"];

// ---------------------------------------------------------------------------
// Cells and styles

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  size?: number;
  color?: string;
  font?: "Calibri" | "Consolas";
  fill?: string;
  border?: boolean;
  h?: "left" | "center" | "right";
  numFmt?: string;
}

export type Cell =
  | { kind: "text"; value: string; style?: CellStyle | undefined }
  | { kind: "number"; value: number; style?: CellStyle | undefined }
  | null;

const text = (value: string, style?: CellStyle): Cell => ({ kind: "text", value, style });
const num = (value: number, style?: CellStyle): Cell => ({ kind: "number", value, style });

const TITLE: CellStyle = { bold: true, size: 16 };
const NOTE: CellStyle = { italic: true, color: GREY_INK };
const SECTION: CellStyle = { bold: true, size: 13 };
const HEAD: CellStyle = { bold: true, color: WHITE, fill: HEADER_FILL, border: true, h: "center" };
const HEAD_LEFT: CellStyle = { ...HEAD, h: "left" };
const PERCENT = "0%";

// A body cell: bordered, shaded on every other row.
const body = (row: number, extra: CellStyle = {}): CellStyle => ({
  border: true,
  ...(row % 2 === 1 ? { fill: BAND_FILL } : {}),
  ...extra,
});
const total = (extra: CellStyle = {}): CellStyle => ({
  bold: true,
  border: true,
  fill: TOTAL_FILL,
  ...extra,
});
const letterCell = (letter: RiasecLetter): CellStyle => ({
  bold: true,
  border: true,
  fill: TRAIT_FILL[letter],
  h: "center",
});

interface Sheet {
  name: string;
  rows: Cell[][];
  merges: string[];
  widths: number[];
  // Freeze and filter below this header row (1-based).
  header?: { row: number; lastColumn: number };
}

const dateFormat = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function scopeLine(
  count: number,
  grade: GradeLevel | null,
  exportedOn: string,
): string {
  const scope = grade ? `Grade ${grade} only` : "All grades";
  const counted = `${count.toLocaleString("en-PH")} ${count === 1 ? "result" : "results"}`;
  return `${scope} · ${counted} · exported ${dateFormat.format(new Date(`${exportedOn}T00:00:00Z`))}`;
}

// Excel counts days from 1899-12-30.
function excelDate(isoDay: string): number {
  return Date.parse(`${isoDay}T00:00:00Z`) / 86_400_000 + 25_569;
}

function columnName(index: number): string {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  }
  return name;
}

// ---------------------------------------------------------------------------
// Summary sheet: columns A Letter, B Name, C Students/Value, D Share, E Notes.

const SUMMARY_WIDTHS = [10, 26, 12, 12, 40];

export function summarySheet(
  results: readonly SavedResult[],
  { grade, exportedOn, now = Date.now() }: { grade: GradeLevel | null; exportedOn: string; now?: number },
): { rows: Cell[][]; merges: string[] } {
  const summary = summarize(results, now);
  const count = summary.count;
  const rows: Cell[][] = [];
  const merges: string[] = [];
  const at = () => rows.length + 1; // the 1-based number of the next row
  const mergeAB = () => merges.push(`A${at()}:B${at()}`);
  const shareOf = (n: number) => (count ? n / count : 0);

  rows.push(
    [text("Saved results summary", TITLE)],
    [text(`${scopeLine(count, grade, exportedOn)}. No names or other identifiers are stored.`, NOTE)],
    [],
  );

  // Overview: the page's cards.
  const top = summary.topCodes[0];
  const percent = (n: number) => `${count ? Math.round((n / count) * 100) : 0}%`;
  const overview: [string, Cell, string][] = [
    ["Saved results", num(count), "All saved results in this file."],
    ...summary.byGrade.map((row): [string, Cell, string] => [
      row.grade === "Not given" ? "Grade not given" : `Grade ${row.grade}`,
      num(row.count),
      `${percent(row.count)} of saved results.`,
    ]),
    ["Last 30 days", num(summary.last30Days), "Results saved in the past month."],
    [
      "Average age",
      summary.averageAge === null ? text("N/A") : num(summary.averageAge),
      "Of students who gave their age.",
    ],
    [
      "Most common code",
      text(top ? top.code : "N/A"),
      top ? `${top.count} ${top.count === 1 ? "student" : "students"}, ${percent(top.count)}.` : "No results yet.",
    ],
  ];
  rows.push([text("Overview", SECTION)]);
  mergeAB();
  merges.push(`D${at()}:E${at()}`);
  rows.push([text("Measure", HEAD_LEFT), text("", HEAD_LEFT), text("Value", HEAD), text("Notes", HEAD_LEFT), text("", HEAD_LEFT)]);
  overview.forEach(([label, value, note], i) => {
    mergeAB();
    merges.push(`D${at()}:E${at()}`);
    const isAverage = label === "Average age";
    rows.push([
      text(label, body(i, { bold: true })),
      text("", body(i)),
      value && { ...value, style: body(i, { h: "center", ...(isAverage ? { numFmt: "0.0" } : {}) }) },
      text(note, body(i, { color: GREY_INK })),
      text("", body(i)),
    ]);
  });

  // A count table: a header, banded rows, an optional Total row.
  const table = (
    title: string,
    note: string,
    nameHeader: string,
    entries: { letter?: RiasecLetter; name: string; count: number; muted?: boolean }[],
    withTotal: boolean,
  ) => {
    rows.push([], [text(title, SECTION)], [text(note, NOTE)]);
    const lettered = entries.some((entry) => entry.letter);
    if (!lettered) mergeAB();
    rows.push([
      text(lettered ? "Letter" : nameHeader, lettered ? HEAD : HEAD_LEFT),
      text(lettered ? nameHeader : "", HEAD_LEFT),
      text("Students", HEAD),
      text("Share", HEAD),
    ]);
    if (entries.length === 0) {
      mergeAB();
      rows.push([text("No results yet.", body(0, { color: GREY_INK })), text("", body(0)), text("", body(0)), text("", body(0))]);
      return;
    }
    entries.forEach((entry, i) => {
      if (!entry.letter) mergeAB();
      const nameStyle = body(i, entry.muted ? { color: GREY_INK, italic: true } : {});
      rows.push([
        entry.letter ? text(entry.letter, letterCell(entry.letter)) : text(entry.name, nameStyle),
        entry.letter ? text(entry.name, nameStyle) : text("", body(i)),
        num(entry.count, body(i, { h: "center" })),
        num(shareOf(entry.count), body(i, { h: "center", numFmt: PERCENT })),
      ]);
    });
    if (withTotal) {
      mergeAB();
      const sum = entries.reduce((n, entry) => n + entry.count, 0);
      rows.push([
        text("Total", total()),
        text("", total()),
        num(sum, total({ h: "center" })),
        num(shareOf(sum), total({ h: "center", numFmt: PERCENT })),
      ]);
    }
  };

  table(
    "Strongest interest area",
    "Each student counted once, under the first letter of their code.",
    "Interest area",
    summary.byTopLetter.map((row) => ({ letter: row.letter, name: RIASEC_PATHWAYS[row.letter].name, count: row.count })),
    true,
  );
  table(
    "Most common codes",
    "Full three-letter codes, most frequent first (top 10).",
    "Code",
    summary.topCodes.map((row) => ({ name: row.code, count: row.count })),
    false,
  );
  table(
    "Strand",
    "Students per SHS strand, most common first.",
    "Strand",
    [
      ...summary.byStrand.map((row) => ({ name: strandShortName(row.strand), count: row.count })),
      ...(summary.strandNotGiven ? [{ name: "Not given", count: summary.strandNotGiven, muted: true }] : []),
    ],
    true,
  );
  table(
    "Age",
    "Students per age, youngest first.",
    "Age",
    [
      ...summary.byAge.map((row) => ({ name: String(row.age), count: row.count })),
      ...(summary.ageNotGiven ? [{ name: "Not given", count: summary.ageNotGiven, muted: true }] : []),
    ],
    true,
  );
  return { rows, merges };
}

// ---------------------------------------------------------------------------
// Latest results sheet

// The code takes three narrow columns under one "Code" heading.
const COLUMNS: { header: string | null; width: number; h?: "left" | "center" }[] = [
  { header: "Taken", width: 15, h: "left" },
  { header: "Results ID", width: 19, h: "left" },
  { header: "Code", width: 5 },
  { header: null, width: 5 },
  { header: null, width: 5 },
  { header: "Grade", width: 11 },
  { header: "Strand", width: 16, h: "left" },
  { header: "Age", width: 8 },
  ...TRAIT_ORDER.map((trait) => ({ header: TRAIT_META[trait].letter, width: 7 })),
];

export function resultsSheetRows(
  results: readonly SavedResult[],
  { grade, exportedOn }: { grade: GradeLevel | null; exportedOn: string },
): Cell[][] {
  const maxScore = results[0]?.maxScore ?? 7;
  const key = LETTERS.map((letter) => `${letter} ${RIASEC_PATHWAYS[letter].name}`).join(", ");
  const missing = (i: number, h?: "center") => text("Not given", body(i, { color: GREY_INK, italic: true, ...(h ? { h } : {}) }));
  return [
    [text("Latest results", TITLE)],
    [text(`${scopeLine(results.length, grade, exportedOn)}. Newest first, with each student's score in every interest area.`, NOTE)],
    [text(`Scores run from 0 to ${maxScore}. Bold scores are the letters in that student's code. ${key}.`, NOTE)],
    [],
    COLUMNS.map((column) => text(column.header ?? "", column.h === "left" ? HEAD_LEFT : HEAD)),
    ...results.map((result, i) => [
      num(excelDate(result.takenOn), body(i, { numFmt: "mmm d, yyyy", h: "left" })),
      text(result.resultsId, body(i, { font: "Consolas", color: GREY_INK })),
      ...result.code.map((letter) => text(letter, letterCell(letter))),
      result.gradeLevel ? num(Number(result.gradeLevel), body(i, { numFmt: '"Grade "0', h: "center" })) : missing(i, "center"),
      result.strand ? text(strandShortName(result.strand), body(i)) : missing(i),
      result.age === null ? missing(i, "center") : num(result.age, body(i, { h: "center" })),
      ...TRAIT_ORDER.map((trait) =>
        num(
          result.scores[trait],
          body(
            i,
            result.code.includes(TRAIT_META[trait].letter)
              ? { bold: true, h: "center" }
              : { color: GREY_INK, h: "center" },
          ),
        ),
      ),
    ]),
  ];
}

export function resultsToXlsx(
  results: readonly SavedResult[],
  options: { grade: GradeLevel | null; exportedOn: string; now?: number },
): Uint8Array {
  const codeColumn = COLUMNS.findIndex((column) => column.header === "Code");
  const summary = summarySheet(results, options);
  const sheets: Sheet[] = [
    { name: "Summary", rows: summary.rows, merges: summary.merges, widths: SUMMARY_WIDTHS },
    {
      name: "Latest results",
      rows: resultsSheetRows(results, options),
      merges: [`${columnName(codeColumn)}${RESULTS_HEADER_ROW}:${columnName(codeColumn + 2)}${RESULTS_HEADER_ROW}`],
      widths: COLUMNS.map((column) => column.width),
      header: { row: RESULTS_HEADER_ROW, lastColumn: COLUMNS.length - 1 },
    },
  ];
  const styles = new StyleSheet();
  const sheetFiles = sheets.map((sheet, i): [string, string] => [
    `xl/worksheets/sheet${i + 1}.xml`,
    sheetXml(sheet, styles),
  ]);
  return zip([
    ["[Content_Types].xml", contentTypes(sheets.length)],
    ["_rels/.rels", ROOT_RELS],
    ["xl/workbook.xml", workbookXml(sheets)],
    ["xl/_rels/workbook.xml.rels", workbookRels(sheets.length)],
    ["xl/styles.xml", styles.xml()],
    ...sheetFiles,
  ]);
}

// ---------------------------------------------------------------------------
// OOXML

// Collects every distinct cell style and gives each an index, so cells only
// describe how they look.
class StyleSheet {
  private fonts = [fontXml({})];
  private fills = [
    `<fill><patternFill patternType="none"/></fill>`,
    `<fill><patternFill patternType="gray125"/></fill>`,
  ];
  private borders = [`<border><left/><right/><top/><bottom/><diagonal/></border>`];
  private numFmts: string[] = [];
  private xfs = [`<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>`];
  private seen = new Map<string, number>();

  private static add(list: string[], xml: string): number {
    const found = list.indexOf(xml);
    if (found >= 0) return found;
    list.push(xml);
    return list.length - 1;
  }

  index(style: CellStyle | undefined): number {
    if (!style) return 0;
    const key = JSON.stringify(style, Object.keys(style).sort());
    const known = this.seen.get(key);
    if (known !== undefined) return known;

    const font = StyleSheet.add(this.fonts, fontXml(style));
    const fill = style.fill
      ? StyleSheet.add(
          this.fills,
          `<fill><patternFill patternType="solid"><fgColor rgb="${style.fill}"/><bgColor indexed="64"/></patternFill></fill>`,
        )
      : 0;
    const side = (name: string) => `<${name} style="thin"><color rgb="${BORDER}"/></${name}>`;
    const border = style.border
      ? StyleSheet.add(this.borders, `<border>${side("left")}${side("right")}${side("top")}${side("bottom")}<diagonal/></border>`)
      : 0;
    let numFmt = 0;
    if (style.numFmt === PERCENT) numFmt = 9; // built in
    else if (style.numFmt) numFmt = 164 + StyleSheet.add(this.numFmts, style.numFmt);

    const xf =
      `<xf numFmtId="${numFmt}" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0"` +
      `${numFmt ? ' applyNumberFormat="1"' : ""}${font ? ' applyFont="1"' : ""}${fill ? ' applyFill="1"' : ""}${border ? ' applyBorder="1"' : ""}` +
      ` applyAlignment="1"><alignment vertical="center"${style.h ? ` horizontal="${style.h}"` : ""}/></xf>`;
    const index = StyleSheet.add(this.xfs, xf);
    this.seen.set(key, index);
    return index;
  }

  xml(): string {
    const numFmts = this.numFmts.length
      ? `<numFmts count="${this.numFmts.length}">${this.numFmts
          .map((code, i) => `<numFmt numFmtId="${164 + i}" formatCode="${escapeXml(code)}"/>`)
          .join("")}</numFmts>`
      : "";
    return (
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      numFmts +
      `<fonts count="${this.fonts.length}">${this.fonts.join("")}</fonts>` +
      `<fills count="${this.fills.length}">${this.fills.join("")}</fills>` +
      `<borders count="${this.borders.length}">${this.borders.join("")}</borders>` +
      `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
      `<cellXfs count="${this.xfs.length}">${this.xfs.join("")}</cellXfs>` +
      `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
      `</styleSheet>`
    );
  }
}

function fontXml(style: CellStyle): string {
  const name = style.font ?? "Calibri";
  return (
    `<font>${style.bold ? "<b/>" : ""}${style.italic ? "<i/>" : ""}<sz val="${style.size ?? 11}"/>` +
    `<color rgb="${style.color ?? INK}"/><name val="${name}"/><family val="${name === "Consolas" ? 3 : 2}"/></font>`
  );
}

function escapeXml(value: string): string {
  return value
    // Characters XML 1.0 cannot carry at all.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sheetXml(sheet: Sheet, styles: StyleSheet): string {
  const widest = Math.max(sheet.widths.length, ...sheet.rows.map((row) => row.length));
  const lastColumn = columnName(widest - 1);
  const lastRow = Math.max(sheet.rows.length, 1);
  const body = sheet.rows
    .map((cells, r) => {
      const rowNumber = r + 1;
      const height = r === 0 ? ' ht="26" customHeight="1"' : cells.length > 1 ? ' ht="20" customHeight="1"' : "";
      const xml = cells
        .map((cell, c) => {
          if (!cell) return "";
          const ref = `${columnName(c)}${rowNumber}`;
          const index = styles.index(cell.style);
          const style = index ? ` s="${index}"` : "";
          if (cell.kind === "number") return `<c r="${ref}"${style}><v>${cell.value}</v></c>`;
          if (cell.value === "") return `<c r="${ref}"${style}/>`;
          return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell.value)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowNumber}"${height}>${xml}</row>`;
    })
    .join("");
  const cols = sheet.widths
    .map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`)
    .join("");
  const header = sheet.header;
  const pane = header
    ? `<pane ySplit="${header.row}" topLeftCell="A${header.row + 1}" activePane="bottomLeft" state="frozen"/>` +
      `<selection pane="bottomLeft" activeCell="A${header.row + 1}" sqref="A${header.row + 1}"/>`
    : "";
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>` +
    `<dimension ref="A1:${lastColumn}${lastRow}"/>` +
    `<sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    `<cols>${cols}</cols>` +
    `<sheetData>${body}</sheetData>` +
    (header
      ? `<autoFilter ref="A${header.row}:${columnName(header.lastColumn)}${Math.max(sheet.rows.length, header.row)}"/>`
      : "") +
    (sheet.merges.length
      ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>`
      : "") +
    `<pageMargins left="0.5" right="0.5" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>` +
    `<pageSetup orientation="${header ? "landscape" : "portrait"}" fitToWidth="1" fitToHeight="0"/>` +
    `</worksheet>`
  );
}

function contentTypes(sheetCount: number): string {
  const sheets = Array.from(
    { length: sheetCount },
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("");
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    sheets +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `</Types>`
  );
}

const ROOT_RELS =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
  `</Relationships>`;

function workbookXml(sheets: readonly Sheet[]): string {
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets>${sheets.map((sheet, i) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>` +
    `</workbook>`
  );
}

function workbookRels(sheetCount: number): string {
  const sheets = Array.from(
    { length: sheetCount },
    (_, i) =>
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
  ).join("");
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    sheets +
    `<Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`
  );
}

// A minimal ZIP writer (deflate, no extras): an .xlsx file is a zip of the
// XML parts above.
function zip(files: [string, string][]): Uint8Array {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  // 1980-01-01 00:00, the earliest DOS timestamp.
  const dosTime = 0;
  const dosDate = (0 << 9) | (1 << 5) | 1;

  for (const [name, content] of files) {
    const nameBytes = Buffer.from(name, "utf8");
    const raw = Buffer.from(content, "utf8");
    const packed = deflateRawSync(raw);
    const crc = crc32(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);

    locals.push(local, nameBytes, packed);
    centrals.push(central, nameBytes);
    offset += local.length + nameBytes.length + packed.length;
  }

  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...locals, directory, end]));
}
