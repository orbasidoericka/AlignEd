// Copyright (c) 2026 EdTech. All rights reserved.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CareerLookDialog } from "@/components/career-look/career-look-dialog";
import type { RiasecLetter } from "@/lib/riasec/types";

// Development-only preview of every career look filter, so the artwork can
// be checked without taking the assessment. Production builds 404 here.

export const metadata: Metadata = {
  title: "Career looks preview",
  robots: { index: false },
};

const ALL_LETTERS: RiasecLetter[] = ["R", "I", "A", "S", "E", "C"];

export default function CareerLooksPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10 sm:px-6">
      <p className="font-heading text-sm font-bold text-primary-strong">
        Development preview
      </p>
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Career looks
      </h1>
      <p className="text-muted-foreground">
        All six filters, without taking the assessment. Open the camera and
        switch looks with the letter buttons. This page does not exist in
        production builds.
      </p>
      <CareerLookDialog code={ALL_LETTERS} />
    </div>
  );
}
