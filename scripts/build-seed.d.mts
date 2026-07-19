// Hand-written types for build-seed.mjs (TypeScript picks this .d.mts up
// automatically when the .mjs is imported). Keep in sync with the exports.
export type CsvRow = Record<string, string>;

export interface SeedData {
  universities: CsvRow[];
  courses: CsvRow[];
  careers: CsvRow[];
  universityCourses: CsvRow[];
  courseCareers: CsvRow[];
}

export function parseCsv(text: string): CsvRow[];
export function isSlug(value: string): boolean;
export function isRiasecTag(value: string): boolean;
export function validateData(data: SeedData): string[];
export function buildSeedSql(data: SeedData): string;
export function loadData(root?: string): SeedData;
