// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useRef, useState } from "react";
import type {
  FaceLandmarker,
  FilesetResolver,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import {
  CameraIcon,
  DownloadIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
  Share2Icon,
} from "lucide-react";

import { ShimmerButton } from "@/components/magic/shimmer-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  computeFaceAnchor,
  computeShoulders,
  smoothAnchor,
  smoothShoulders,
  toFaceSpace,
  type FaceAnchor,
  type Shoulders,
} from "@/lib/career-look/face-anchor";
import { CAREER_LOOKS, type CareerLook } from "@/lib/career-look/looks";
import { useCareerLookPhoto } from "@/lib/career-look/photo-store";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { TraitEmblem } from "@/components/riasec/trait-emblem";
import type { RiasecLetter } from "@/lib/riasec/types";
import { cn } from "@/lib/utils";

// WebAR career look: a Snapchat-style filter for the student's code. The
// camera feed and face tracking stay entirely on the device. Nothing is
// recorded or uploaded; a photo exists only if the student takes one, as a
// local file they choose to save or share, and it leaves the device only
// if they email their results with it attached.
//
// MediaPipe (~3.7 MB face model + WASM, self-hosted under /mediapipe) is
// imported only once the dialog opens, so the results page pays nothing for
// it. The pose model (~5.8 MB) loads only when a look that dresses the body
// is picked.

const WASM_PATH = "/mediapipe/wasm";
const MODEL_PATH = "/mediapipe/face_landmarker.task";
const POSE_MODEL_PATH = "/mediapipe/pose_landmarker_lite.task";

// MediaPipe does not export this type, only the function that returns it.
type WasmFileset = Awaited<
  ReturnType<typeof FilesetResolver.forVisionTasks>
>;

export function CareerLookDialog({
  code,
}: {
  code: readonly RiasecLetter[];
}) {
  // Opens on the student's strongest letter; the picker switches between
  // the letters of their code without restarting the camera.
  const [letter, setLetter] = useState<RiasecLetter | null>(null);
  const current = letter && code.includes(letter) ? letter : code[0];
  const look = CAREER_LOOKS[current ?? "R"];

  return (
    <Dialog>
      <DialogTrigger
        render={
          // All three layers stay in the blue family. The component's default
          // spark and rail are the palette yellow, which over a blue fill
          // composites to green along the whole rim; the rail's midpoint is
          // --primary so the pale pill still has a 3.17:1 edge on the card.
          <ShimmerButton
            background="var(--primary-soft)"
            shimmerColor="var(--primary-spark)"
            rail="linear-gradient(145deg, var(--primary-spark), var(--primary) 55%, var(--primary-spark))"
            className="mb-1 self-start print:hidden"
            data-print-hidden
          />
        }
      >
        <CameraIcon aria-hidden />
        Try your career look
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Your career look</DialogTitle>
          <DialogDescription>
            Each letter of your code has its own look. Your camera stays on
            this device. A photo you take is added to your results email.
          </DialogDescription>
        </DialogHeader>
        {code.length > 1 && (
          <div
            role="group"
            aria-label="Choose a look"
            className="flex flex-wrap gap-2"
          >
            {code.map((option) => {
              const selected = option === current;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setLetter(option)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border-2 py-1 pr-3 pl-1 font-heading text-sm font-semibold transition-colors",
                    selected
                      ? "border-foreground bg-card text-foreground"
                      : "border-transparent bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  <TraitEmblem letter={option} className="size-7" />
                  {RIASEC_PATHWAYS[option].name}
                </button>
              );
            })}
          </div>
        )}
        {/* The popup unmounts when closed, which stops the camera. */}
        <CareerLookCamera look={look} />
      </DialogContent>
    </Dialog>
  );
}

type Status =
  | { kind: "starting" }
  | { kind: "live"; faceFound: boolean }
  | { kind: "error"; message: string };

function CareerLookCamera({ look }: { look: CareerLook }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // While a photo is on screen the loop stops redrawing, so the canvas
  // keeps the exact frame that was captured.
  const frozenRef = useRef(false);
  // Read by the render loop, so switching looks never restarts the camera.
  const lookRef = useRef(look);
  useEffect(() => {
    lookRef.current = look;
  }, [look]);
  const [status, setStatus] = useState<Status>({ kind: "starting" });
  const [attempt, setAttempt] = useState(0);
  const [photo, setPhoto] = useState<{ url: string; file: File } | null>(
    null,
  );
  const setEmailPhoto = useCareerLookPhoto((state) => state.setPhoto);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let landmarker: FaceLandmarker | null = null;
    let frame = 0;
    let anchor: FaceAnchor | null = null;
    let faceFound = false;
    let lastVideoTime = -1;
    const restoreConsole = filterInfoLogs();

    // Pose tracker for looks that dress the body. Loaded the first time
    // one is picked; if it cannot load, those looks fall back to the face.
    let vision: typeof import("@mediapipe/tasks-vision") | null = null;
    let fileset: WasmFileset | null = null;
    let pose: PoseLandmarker | null = null;
    let poseRequested = false;
    let shoulders: Shoulders | null = null;

    const loadPose = () => {
      if (poseRequested || !vision || !fileset) return;
      poseRequested = true;
      const tasks = vision;
      const files = fileset;
      const options = (delegate: "GPU" | "CPU") => ({
        baseOptions: { modelAssetPath: POSE_MODEL_PATH, delegate },
        runningMode: "VIDEO" as const,
        numPoses: 1,
      });
      tasks.PoseLandmarker.createFromOptions(files, options("GPU"))
        .catch(() => tasks.PoseLandmarker.createFromOptions(files, options("CPU")))
        .then((created) => {
          if (cancelled) created.close();
          else pose = created;
        })
        .catch((error: unknown) => {
          console.warn("Pose tracker unavailable; using the face only:", error);
        });
    };

    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!video || !canvas || !ctx || !landmarker) return;

      if (!frozenRef.current && video.readyState >= 2) {
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;

        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const result = landmarker.detectForVideo(video, performance.now());
          const face = result.faceLandmarks[0];
          const next = face ? computeFaceAnchor(face, width, height) : null;
          anchor = next ? smoothAnchor(anchor, next) : null;
          if (Boolean(anchor) !== faceFound) {
            faceFound = Boolean(anchor);
            setStatus({ kind: "live", faceFound });
          }

          // Shoulders, only while a look that dresses the body is on.
          const wantsBody = lookRef.current.usesBody === true;
          if (wantsBody && !pose) loadPose();
          if (wantsBody && pose) {
            const bodyResult = pose.detectForVideo(video, performance.now());
            const body = bodyResult.landmarks[0];
            const nextShoulders = body
              ? computeShoulders(body, width, height)
              : null;
            shoulders = nextShoulders
              ? smoothShoulders(shoulders, nextShoulders)
              : null;
          } else {
            shoulders = null;
          }
        }

        drawFrame(ctx, video, anchor, lookRef.current, shoulders);
      }
      frame = requestAnimationFrame(render);
    };

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new DOMException("insecure", "SecurityError");
      }
      const [mediaStream, tasks] = await Promise.all([
        openCamera(() => cancelled),
        import("@mediapipe/tasks-vision"),
      ]);
      vision = tasks;
      if (!mediaStream) return;
      // Closed while the permission prompt was up: cleanup has already run,
      // so this stream must be stopped here or the camera light stays on.
      if (cancelled) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = mediaStream;

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      const files = await tasks.FilesetResolver.forVisionTasks(WASM_PATH);
      fileset = files;
      const options = (delegate: "GPU" | "CPU") => ({
        baseOptions: { modelAssetPath: MODEL_PATH, delegate },
        runningMode: "VIDEO" as const,
        numFaces: 1,
      });
      let created: FaceLandmarker;
      try {
        created = await tasks.FaceLandmarker.createFromOptions(
          files,
          options("GPU"),
        );
      } catch {
        // Some laptops and older phones have no usable WebGL2.
        created = await tasks.FaceLandmarker.createFromOptions(
          files,
          options("CPU"),
        );
      }
      if (cancelled) {
        created.close();
        return;
      }
      landmarker = created;
      setStatus({ kind: "live", faceFound: false });
      frame = requestAnimationFrame(render);
    }

    start().catch((error: unknown) => {
      if (cancelled) return;
      // The friendly message has to generalize; the console keeps the
      // browser's exact reason for whoever is debugging.
      console.warn("Career look could not start:", error);
      setStatus({ kind: "error", message: cameraError(error) });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      landmarker?.close();
      pose?.close();
      restoreConsole();
    };
  }, [attempt]);

  // Photo URLs are revoked when replaced or when the dialog closes.
  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url);
    };
  }, [photo]);

  const takePhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    frozenRef.current = true;
    canvas.toBlob((blob) => {
      if (!blob) {
        frozenRef.current = false;
        return;
      }
      const file = new File([blob], "aligned-career-look.png", {
        type: "image/png",
      });
      setPhoto({ url: URL.createObjectURL(blob), file });
    }, "image/png");
    // A JPEG copy for Email me my results; the PNG is too big to mail.
    canvas.toBlob(
      (blob) => {
        if (blob) setEmailPhoto({ blob, caption: look.caption });
      },
      "image/jpeg",
      0.85,
    );
  };

  const retake = () => {
    frozenRef.current = false;
    setPhoto(null);
    setEmailPhoto(null);
  };

  const canShare =
    photo !== null &&
    typeof navigator !== "undefined" &&
    navigator.canShare?.({ files: [photo.file] }) === true;

  const share = async () => {
    if (!photo) return;
    try {
      await navigator.share({ files: [photo.file], title: look.caption });
    } catch {
      // Closing the share sheet rejects; there is nothing to report.
    }
  };

  const live = status.kind === "live";

  return (
    <div className="flex flex-col gap-4">
      {/* Sized by the camera's own shape (landscape on laptops, portrait on
          phones), capped so a portrait feed still fits the viewport. */}
      <div className="relative flex min-h-64 w-full items-center justify-center overflow-hidden rounded-2xl bg-black">
        {/* Feeds the canvas; never shown itself. */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="pointer-events-none absolute size-px opacity-0"
        />
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Camera preview with ${look.propsLabel}`}
          className={cn(
            "block h-auto max-h-[65vh] w-auto max-w-full",
            // The canvas is a blank 300×150 until the first frame lands.
            status.kind !== "live" && "invisible",
          )}
        />
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob URL
          <img
            src={photo.url}
            alt={`Your career look photo: ${look.caption}`}
            className="absolute inset-0 size-full bg-black object-contain"
          />
        )}
        <CameraOverlay status={status} look={look} hidden={photo !== null} />
      </div>

      {status.kind === "error" ? (
        <Button
          size="lg"
          onClick={() => {
            setStatus({ kind: "starting" });
            setAttempt((n) => n + 1);
          }}
          className="self-center rounded-full"
        >
          <RotateCcwIcon className="size-4" />
          Try again
        </Button>
      ) : photo ? (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            size="lg"
            className="rounded-full"
            nativeButton={false}
            render={<a href={photo.url} download={photo.file.name} />}
          >
            <DownloadIcon className="size-4" />
            Save photo
          </Button>
          {canShare && (
            <Button
              variant="outline"
              size="lg"
              onClick={share}
              className="rounded-full bg-card"
            >
              <Share2Icon className="size-4" />
              Share
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            onClick={retake}
            className="rounded-full bg-card"
          >
            <RotateCcwIcon className="size-4" />
            Retake
          </Button>
        </div>
      ) : (
        <Button
          size="lg"
          onClick={takePhoto}
          disabled={!live}
          className="self-center rounded-full font-heading font-semibold"
        >
          <CameraIcon className="size-4" />
          Take photo
        </Button>
      )}
    </div>
  );
}

function CameraOverlay({
  status,
  look,
  hidden,
}: {
  status: Status;
  look: CareerLook;
  hidden: boolean;
}) {
  let message: string | null = null;
  if (status.kind === "starting") message = "Starting your camera…";
  else if (status.kind === "error") message = status.message;
  else if (!status.faceFound)
    message = `Look at the camera to try on ${look.propsLabel}.`;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-0 flex items-center justify-center p-6"
    >
      {message && !hidden && (
        <p className="flex max-w-sm items-center gap-2 rounded-2xl bg-black/65 px-4 py-3 text-center text-sm font-medium text-white">
          {status.kind === "starting" && (
            <LoaderCircleIcon className="size-4 shrink-0 animate-spin" />
          )}
          {message}
        </p>
      )}
    </div>
  );
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  anchor: FaceAnchor | null,
  look: CareerLook,
  shoulders: Shoulders | null,
) {
  const { width, height } = ctx.canvas;

  // Mirrored like a selfie camera. Landmarks are in the unmirrored frame,
  // so the props are drawn under the same flip and land on the face.
  ctx.setTransform(-1, 0, 0, 1, width, 0);
  ctx.drawImage(video, 0, 0, width, height);
  if (anchor) {
    ctx.save();
    ctx.translate(anchor.x, anchor.y);
    ctx.rotate(anchor.angle);
    ctx.scale(anchor.width, anchor.width);
    const face = {
      ...anchor,
      shoulders: shoulders && {
        near: toFaceSpace(shoulders.near, anchor),
        far: toFaceSpace(shoulders.far, anchor),
      },
    };
    look.draw(ctx, face, performance.now() / 1000);
    ctx.restore();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawBanner(ctx, look.caption);
}

// Caption pill along the bottom edge, drawn unmirrored so it stays legible
// in the saved photo.
function drawBanner(ctx: CanvasRenderingContext2D, caption: string) {
  const { width, height } = ctx.canvas;
  const family = getComputedStyle(ctx.canvas).fontFamily || "sans-serif";
  const text = `${caption} · AlignEd`;

  // Shrink long captions to fit: a portrait phone frame is narrow, and
  // "You are Investigative" would otherwise run off both edges.
  let size = Math.round(height * 0.05);
  ctx.font = `800 ${size}px ${family}`;
  const fitWidth = width * 0.88 - size * 1.8;
  const measured = ctx.measureText(text).width;
  if (measured > fitWidth) {
    size = Math.floor((size * fitWidth) / measured);
    ctx.font = `800 ${size}px ${family}`;
  }
  const textWidth = ctx.measureText(text).width;
  const padX = size * 0.9;
  const pillW = textWidth + padX * 2;
  const pillH = size * 1.9;
  const x = (width - pillW) / 2;
  const y = height - pillH - height * 0.05;

  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.beginPath();
  ctx.roundRect(x, y, pillW, pillH, pillH / 2);
  ctx.fill();

  ctx.fillStyle = "#1b2a4a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, y + pillH / 2);
}

// MediaPipe's WASM prints "INFO: Created TensorFlow Lite XNNPACK delegate"
// through console.error on its first inference. It is not an error, but the
// Next.js dev overlay counts it as one. The WASM runtime binds console.error
// when it loads, so the filter must be in place from before the import
// until the camera closes. Only lines starting "INFO:" are dropped.
function filterInfoLogs(): () => void {
  const original = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("INFO:")) return;
    original(...args);
  };
  return () => {
    console.error = original;
  };
}

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: false,
};

// One camera request at a time. React StrictMode mounts effects twice in
// development, and many Windows webcams refuse a second open while the
// first is still starting (NotReadableError). Queued, the StrictMode
// throwaway mount is already cancelled when its turn comes and never
// touches the camera. Resolves null when cancelled before its turn.
let cameraQueue: Promise<unknown> = Promise.resolve();

function openCamera(isCancelled: () => boolean): Promise<MediaStream | null> {
  const request = cameraQueue.then(() =>
    isCancelled() ? null : requestCamera(),
  );
  cameraQueue = request.catch(() => {});
  return request;
}

// The camera is there but would not start: held by another app or tab
// (NotReadableError), or it never sent a frame (Chromium's AbortError,
// "Timeout starting video source").
function isCameraBusy(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "NotReadableError" || error.name === "AbortError")
  );
}

// Windows can take a moment to release a camera after track.stop(), so a
// quick close-and-reopen gets NotReadableError; a short retry rides it out.
async function requestCamera(): Promise<MediaStream> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
    } catch (error) {
      if (!isCameraBusy(error) || attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }
}

function cameraError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  switch (name) {
    case "NotAllowedError":
      return "Camera access was blocked. Allow the camera for this site in your browser settings, then try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device.";
    case "NotReadableError":
    case "AbortError":
      // Also raised when Windows privacy settings block the camera or a
      // driver is stuck, so the message lists the likely causes rather
      // than asserting one.
      return "Your camera couldn't start. It may be open in another app or tab (a video call, Discord, another browser). Close those, then try again. If it still fails, restart your browser.";
    case "SecurityError":
      return "The camera only works on a secure (https) connection.";
    default:
      return "The career look could not start in this browser.";
  }
}
