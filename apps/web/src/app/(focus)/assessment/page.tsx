// Copyright (c) 2026 EdTech. All rights reserved.

import type { Metadata } from "next";

import { AssessmentRunner } from "@/components/journey/assessment-runner";
import { JourneyGuard } from "@/components/journey/journey-guard";

export const metadata: Metadata = {
  title: "Assessment",
  description:
    "Answer honest questions about what you enjoy and get your Holland Code in about 8 minutes.",
};

export default function AssessmentPage() {
  return (
    <JourneyGuard require="profile">
      <AssessmentRunner />
    </JourneyGuard>
  );
}
