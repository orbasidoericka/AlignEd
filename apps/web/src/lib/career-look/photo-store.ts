// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { create } from "zustand";

// The last career-look photo the student took, so Email me my results can
// attach it. Memory only, never persisted: a refresh or a new student on a
// shared device starts without one.

export interface CareerLookPhoto {
  // A JPEG, small enough to email.
  blob: Blob;
  // Object URL of the blob, for previews; revoked when replaced.
  url: string;
  caption: string;
}

interface CareerLookPhotoStore {
  photo: CareerLookPhoto | null;
  setPhoto: (photo: { blob: Blob; caption: string } | null) => void;
}

export const useCareerLookPhoto = create<CareerLookPhotoStore>((set, get) => ({
  photo: null,
  setPhoto: (photo) => {
    const previous = get().photo;
    if (previous) URL.revokeObjectURL(previous.url);
    set({
      photo: photo && { ...photo, url: URL.createObjectURL(photo.blob) },
    });
  },
}));

// Base64 of the JPEG, as the email route expects it.
export async function photoToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
