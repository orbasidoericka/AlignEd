// Copyright (c) 2026 EdTech. All rights reserved.

import type { Metadata } from "next";

import { JourneyGuard } from "@/components/journey/journey-guard";
import { ResultsDashboard } from "@/components/journey/results-dashboard";

export const metadata: Metadata = {
  title: "My Results",
  description:
    "Your Holland Code, strand verdict, and matched careers and college programs.",
};

export default function ResultsPage() {
  return (
    <JourneyGuard require="results">
      <ResultsDashboard />
    </JourneyGuard>
  );
}
