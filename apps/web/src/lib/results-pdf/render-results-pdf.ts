// Copyright (c) 2026 EdTech. All rights reserved.

import { randomBytes } from "node:crypto";
import pdfmake from "pdfmake";
import robotoFonts from "pdfmake/build/vfs_fonts";

import { buildResultsPdf, type ResultsPdfInput } from "./build-results-pdf";

// Server-side twin of download-results-pdf.ts: renders the same encrypted
// results PDF to bytes, for attaching to the results email. Server only
// (Node.js): the route that emails results imports it.

// pdfmake's Node build keeps a virtual file system like the browser build,
// but its types leave it out. Fonts are loaded into it from the bundled
// Roboto module, so no font files need to exist on disk in production.
const printer = pdfmake as typeof pdfmake & {
  virtualfs: { writeFileSync(name: string, content: Buffer): void };
};

let fontsReady = false;
function ensureFonts() {
  if (fontsReady) return;
  for (const [name, base64] of Object.entries(robotoFonts)) {
    printer.virtualfs.writeFileSync(name, Buffer.from(base64, "base64"));
  }
  printer.setFonts({
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf",
    },
  });
  // Only the fonts above are ever read; block everything else on disk.
  printer.setLocalAccessPolicy(() => false);
  fontsReady = true;
}

export async function renderResultsPdf(
  input: Omit<ResultsPdfInput, "ownerPassword">,
): Promise<Buffer> {
  ensureFonts();
  const doc = buildResultsPdf({
    ...input,
    // Guards print/copy permissions only; random and never shown.
    ownerPassword: randomBytes(24).toString("hex"),
  });
  return Buffer.from(await printer.createPdf(doc).getBuffer());
}
