// Copyright (c) 2026 EdTech. All rights reserved.

import { buildResultsPdf, type ResultsPdfInput } from "./build-results-pdf";

// pdfmake and its embedded Roboto fonts (~1.9 MB together) load only when a
// student downloads, so the results page itself pays nothing for them.
// Everything runs in the browser: results never leave the device.

// The builds are CommonJS; bundlers expose them under `default`.
function commonJs<T>(module: T): T {
  return (module as { default?: T }).default ?? module;
}

// A throwaway owner password: it only guards the print/copy permissions, so
// it is random and never shown.
function randomOwnerPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function downloadResultsPdf(
  input: Omit<ResultsPdfInput, "ownerPassword">,
): Promise<void> {
  const [pdfModule, fontsModule] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  const pdfMake = commonJs(pdfModule);
  pdfMake.addVirtualFileSystem(fontsModule.default);
  pdfMake.addFonts({
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf",
    },
  });

  const fileName = `AlignEd-results-${input.nickname || "student"}.pdf`;
  const doc = buildResultsPdf({ ...input, ownerPassword: randomOwnerPassword() });
  await pdfMake.createPdf(doc).download(fileName);
}
