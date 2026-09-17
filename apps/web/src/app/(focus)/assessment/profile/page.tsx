// Copyright (c) 2026 EdTech. All rights reserved.

import type { Metadata } from "next";

import { ProfileForm } from "@/components/journey/profile-form";

export const metadata: Metadata = {
  title: "Profile Setup",
  description:
    "Tell us your grade level so we can match you to careers and college programs.",
};

export default function ProfilePage() {
  return <ProfileForm />;
}
