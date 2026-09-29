// Copyright (c) 2026 EdTech. All rights reserved.
//
// Self-hosts the MediaPipe trackers for the career look filter, so the
// camera feature never calls a third-party CDN at runtime. Copies the WASM
// runtime out of node_modules and downloads the face and pose models once.
// Runs before `dev` and `build`; the output folder is gitignored.

import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "..", "public", "mediapipe");
const wasmOut = path.join(outDir, "wasm");

// Face tracking for every look; pose (shoulders) only for looks that dress
// the body, loaded by the page on demand.
const MODELS = {
  "face_landmarker.task":
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  "pose_landmarker_lite.task":
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
};

// Only the SIMD and no-SIMD script builds; the ES-module build is unused.
const WASM_FILES = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];

async function exists(file) {
  try {
    return (await stat(file)).size > 0;
  } catch {
    return false;
  }
}

const require = createRequire(import.meta.url);
// The package's exports hide package.json; its entry file sits at the root.
const pkgDir = path.dirname(require.resolve("@mediapipe/tasks-vision"));

await mkdir(wasmOut, { recursive: true });
for (const file of WASM_FILES) {
  await copyFile(path.join(pkgDir, "wasm", file), path.join(wasmOut, file));
}

for (const [file, url] of Object.entries(MODELS)) {
  const out = path.join(outDir, file);
  if (await exists(out)) continue;
  console.log(`Downloading ${file}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Model download failed (${file}): ${response.status}`);
  }
  await writeFile(out, Buffer.from(await response.arrayBuffer()));
}

console.log("MediaPipe trackers ready in public/mediapipe");
