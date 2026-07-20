// Copyright (c) 2026 EdTech. All rights reserved.

import type { Metadata } from "next";

import { ProfileForm } from "@/components/journey/profile-form";

export const metadata: Metadata = {
  title: "Profile Setup",
  description:
    "Tell us your grade level and SHS strand so we can check how your strand matches your results.",
};

export default function ProfilePage() {
  return <ProfileForm />;
}
