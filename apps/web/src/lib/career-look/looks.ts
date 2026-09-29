// Copyright (c) 2026 EdTech. All rights reserved.

import type { FacePoint } from "@/lib/career-look/face-anchor";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import type { RiasecLetter } from "@/lib/riasec/types";

// Career look filters, one per RIASEC letter, each based on a major from the
// official pathway sheet. Each look draws its props on a canvas that has
// already been moved to the face anchor (top of the forehead), rotated with
// the head, and scaled so 1 unit = 1 face width. Up is negative y; `face`
// says where the eyes and chin sit in the same units.
//
// The canvas is mirrored like a selfie camera, so props must never contain
// text: it would come out backwards.
//
// Placeholder art, drawn in code. Swap any look for a PNG by drawing an
// image here with ctx.drawImage once final art exists.

export interface FaceShape {
  eyeY: number;
  chinY: number;
  rightEye: FacePoint;
  leftEye: FacePoint;
  eyeSize: number;
  // Real shoulders in the same units, image-left first; only for looks with
  // `usesBody`, and null when they are not confidently in frame.
  shoulders: { near: FacePoint; far: FacePoint } | null;
}

export interface CareerLook {
  letter: RiasecLetter;
  // Shown on the photo banner, e.g. "You are Realistic".
  caption: string;
  // The props, with their article, for prompts and alt text: "a hard hat".
  propsLabel: string;
  // `time` is seconds, for props that bob gently.
  draw: (ctx: CanvasRenderingContext2D, face: FaceShape, time: number) => void;
  // Dresses the body, so the camera also runs the pose tracker (loaded only
  // when a look like this is picked) to find the shoulders.
  usesBody?: boolean;
}

// ---------------------------------------------------------------------------
// Shared bits

function outline(ctx: CanvasRenderingContext2D, color: string, width = 0.014) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
}

function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string | CanvasGradient,
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// Slow up-and-down drift for floating props, offset per prop so they do not
// move in lockstep.
function bob(time: number, phase: number) {
  return Math.sin(time * 2 + phase) * 0.03;
}

// Draws a floating prop scaled up around its own centre. Props are authored
// small and near the face; this sizes them to read at arm's length.
function floating(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  draw: () => void,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(-x, -y);
  draw();
  ctx.restore();
}

function heart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.beginPath();
  ctx.moveTo(0, 0.35);
  ctx.bezierCurveTo(-0.6, -0.05, -0.35, -0.6, 0, -0.25);
  ctx.bezierCurveTo(0.35, -0.6, 0.6, -0.05, 0, 0.35);
  ctx.closePath();
  ctx.restore();
  ctx.fill();
  ctx.stroke();
}

// Where eyewear goes, from the student's real eyes: one lens centred on each
// eye, sized from the eye's own width (`width`/`height` are multiples of
// it). Lenses shrink on close-set eyes so a bridge always shows between
// them. `sideX` is where the strap or arms end: roughly the side of the head.
interface EyewearLayout {
  lenses: [FacePoint, FacePoint]; // image-left first
  w: number;
  h: number;
  sideX: [number, number];
}

function eyewearLayout(
  face: FaceShape,
  width: number,
  height: number,
): EyewearLayout {
  const [near, far]: [FacePoint, FacePoint] =
    face.rightEye.x <= face.leftEye.x
      ? [face.rightEye, face.leftEye]
      : [face.leftEye, face.rightEye];
  const bridge = face.eyeSize * 0.3;
  const w = Math.min(face.eyeSize * width, far.x - near.x - bridge);
  const midX = (near.x + far.x) / 2;
  return {
    lenses: [near, far],
    w,
    h: face.eyeSize * height,
    sideX: [midX - 0.52, midX + 0.52],
  };
}

function drawLenses(
  ctx: CanvasRenderingContext2D,
  layout: EyewearLayout,
  radius: number,
) {
  for (const eye of layout.lenses) {
    ctx.beginPath();
    ctx.roundRect(
      eye.x - layout.w / 2,
      eye.y - layout.h / 2,
      layout.w,
      layout.h,
      radius,
    );
    ctx.fill();
    ctx.stroke();
  }
}

// Strap or arms: from each lens's outer edge out to the side of the head,
// never across the lenses, so nothing shows through the glass.
function drawSides(
  ctx: CanvasRenderingContext2D,
  layout: EyewearLayout,
  rise: number,
) {
  const [near, far] = layout.lenses;
  const half = layout.w / 2;
  ctx.beginPath();
  ctx.moveTo(near.x - half, near.y);
  ctx.lineTo(layout.sideX[0], near.y - rise);
  ctx.moveTo(far.x + half, far.y);
  ctx.lineTo(layout.sideX[1], far.y - rise);
  ctx.stroke();
}

function drawBridge(
  ctx: CanvasRenderingContext2D,
  layout: EyewearLayout,
  lift: number,
) {
  const [near, far] = layout.lenses;
  const half = layout.w / 2;
  const y = (near.y + far.y) / 2 - lift;
  ctx.beginPath();
  ctx.moveTo(near.x + half, y);
  ctx.quadraticCurveTo((near.x + far.x) / 2, y - lift, far.x - half, y);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Clothing: jackets and coats that dress the body below the face.

// Where a jacket's shoulder seams sit in its own design: a little inside
// its outer edge (±1.25), matching the pose tracker's shoulder joints, and
// this far below the collar line.
const BODY_SHOULDER_X = 1.15;
const BODY_SHOULDER_DROP = 0.5;

// Clothing is designed hanging from the chin with shoulders at about
// ±1.15 face widths (a typical build). When the pose tracker sees the real
// shoulders, this moves, scales and turns the canvas so the design's
// shoulders land exactly on them; otherwise it leaves the design as is.
function fitToBody(ctx: CanvasRenderingContext2D, face: FaceShape, top: number) {
  if (!face.shoulders) return;
  const from1 = { x: -BODY_SHOULDER_X, y: top + BODY_SHOULDER_DROP };
  const from2 = { x: BODY_SHOULDER_X, y: top + BODY_SHOULDER_DROP };
  const { near: to1, far: to2 } = face.shoulders;
  const fromLength = Math.hypot(from2.x - from1.x, from2.y - from1.y);
  const toLength = Math.hypot(to2.x - to1.x, to2.y - to1.y);
  if (toLength === 0) return;
  const turn =
    Math.atan2(to2.y - to1.y, to2.x - to1.x) -
    Math.atan2(from2.y - from1.y, from2.x - from1.x);
  const scale = toLength / fromLength;
  ctx.translate((to1.x + to2.x) / 2, (to1.y + to2.y) / 2);
  ctx.rotate(turn);
  ctx.scale(scale, scale);
  ctx.translate(-(from1.x + from2.x) / 2, -(from1.y + from2.y) / 2);
}

// Jacket or coat body with a V opening at the front, `vDepth` deep and
// `vHalf` wide at the collar. Fill with "evenodd" so the V is a hole that
// shows the shirt beneath.
function jacketPath(top: number, vHalf: number, vDepth: number): Path2D {
  const path = new Path2D();
  path.moveTo(-vHalf, top);
  path.bezierCurveTo(-0.6, top + 0.05, -1.05, top + 0.2, -1.25, top + 0.55);
  path.lineTo(-1.45, top + 3.2);
  path.lineTo(1.45, top + 3.2);
  path.lineTo(1.25, top + 0.55);
  path.bezierCurveTo(1.05, top + 0.2, 0.6, top + 0.05, vHalf, top);
  path.closePath();
  path.moveTo(-vHalf, top);
  path.lineTo(0, top + vDepth);
  path.lineTo(vHalf, top);
  path.closePath();
  return path;
}

// Notched lapels along each edge of the V, in the current fill and stroke.
function drawLapels(
  ctx: CanvasRenderingContext2D,
  top: number,
  vHalf: number,
  vDepth: number,
) {
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * vHalf, top);
    ctx.lineTo(side * 0.55, top + 0.08);
    ctx.lineTo(side * 0.6, top + 0.5);
    ctx.lineTo(side * 0.46, top + 0.56);
    ctx.lineTo(0, top + vDepth);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// R: Realistic, Engineering

function drawHardHat(ctx: CanvasRenderingContext2D) {
  // Landmark 10 sits at the hairline; nudge the brim down onto the forehead
  // and size up so the shell covers the hair instead of perching on it.
  ctx.translate(0, 0.1);
  ctx.scale(1.15, 1.15);
  outline(ctx, "#6b4300");

  // Shell
  const shell = new Path2D();
  shell.moveTo(-0.56, -0.07);
  shell.bezierCurveTo(-0.58, -0.78, 0.58, -0.78, 0.56, -0.07);
  shell.closePath();

  const shellFill = ctx.createLinearGradient(0, -0.62, 0, -0.05);
  shellFill.addColorStop(0, "#ffe066");
  shellFill.addColorStop(0.55, "#ffc81f");
  shellFill.addColorStop(1, "#e8a200");
  ctx.fillStyle = shellFill;
  ctx.fill(shell);

  // Ridges, clipped to the shell so they follow its curve.
  ctx.save();
  ctx.clip(shell);
  ctx.fillStyle = "#f0b000";
  ctx.fillRect(-0.075, -0.7, 0.15, 0.65);
  ctx.fillStyle = "rgba(107, 67, 0, 0.18)";
  ctx.fillRect(-0.3, -0.7, 0.035, 0.65);
  ctx.fillRect(0.265, -0.7, 0.035, 0.65);
  // Soft highlight on the upper left of the dome.
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.beginPath();
  ctx.ellipse(-0.26, -0.44, 0.12, 0.06, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.stroke(shell);

  // Brim, drawn over the shell's lower edge.
  const brimFill = ctx.createLinearGradient(0, -0.14, 0, 0.02);
  brimFill.addColorStop(0, "#ffcf33");
  brimFill.addColorStop(1, "#d99400");
  ctx.fillStyle = brimFill;
  ctx.beginPath();
  ctx.ellipse(0, -0.06, 0.68, 0.075, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Front badge
  circle(ctx, 0, -0.3, 0.075, "#ffffff");
  ctx.fillStyle = "#2f9e44";
  ctx.fillRect(-0.016, -0.35, 0.032, 0.1);
  ctx.fillRect(-0.05, -0.316, 0.1, 0.032);
}

// ---------------------------------------------------------------------------
// I: Investigative, Chemistry and Medicine

// Lab coat scientist: white coat fitted to the shoulders, safety goggles
// pushed up on the forehead (clear of the eyes and any real glasses), and
// a bubbling flask floating beside the head.
function drawLabCoat(
  ctx: CanvasRenderingContext2D,
  face: FaceShape,
  time: number,
) {
  // --- Coat, fitted to the body ---
  const top = face.chinY + 0.1;
  const vHalf = 0.34;
  const vDepth = 1.25;

  ctx.save();
  fitToBody(ctx, face, top);

  // Light blue shirt in the coat's opening, with its collar points.
  outline(ctx, "#74a9d8", 0.012);
  ctx.fillStyle = "#a5d8ff";
  ctx.beginPath();
  ctx.moveTo(-vHalf - 0.02, top - 0.02);
  ctx.lineTo(0, top + vDepth + 0.05);
  ctx.lineTo(vHalf + 0.02, top - 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#d0ebff";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 0.03, top - 0.02);
    ctx.lineTo(side * 0.28, top - 0.06);
    ctx.lineTo(side * 0.16, top + 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // White coat and lapels.
  const cloth = ctx.createLinearGradient(0, top, 0, top + 2.5);
  cloth.addColorStop(0, "#ffffff");
  cloth.addColorStop(1, "#e9ecef");
  ctx.fillStyle = cloth;
  const coat = jacketPath(top, vHalf, vDepth);
  ctx.fill(coat, "evenodd");
  outline(ctx, "#a4acb5", 0.016);
  ctx.stroke(coat);
  ctx.fillStyle = "#f8f9fa";
  drawLapels(ctx, top, vHalf, vDepth);

  // Buttons down the front.
  outline(ctx, "#a4acb5", 0.01);
  circle(ctx, 0, top + vDepth + 0.15, 0.04, "#f1f3f5");
  circle(ctx, 0, top + vDepth + 0.5, 0.04, "#f1f3f5");

  // Chest pocket with a blue and a red pen clipped in it.
  const pens: [number, string][] = [
    [0.64, "#1c7ed6"],
    [0.74, "#e03131"],
  ];
  for (const [x, color] of pens) {
    outline(ctx, "#343a40", 0.008);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - 0.025, top + 0.72, 0.05, 0.28, 0.02);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ced4da";
    ctx.fillRect(x - 0.008, top + 0.74, 0.016, 0.12);
  }
  outline(ctx, "#a4acb5", 0.014);
  ctx.fillStyle = "#f8f9fa";
  ctx.beginPath();
  ctx.roundRect(0.52, top + 0.88, 0.36, 0.3, 0.02);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // --- Goggles, pushed up onto the forehead ---
  const worn = eyewearLayout(face, 1.8, 1.3);
  const foreheadY = face.eyeY * 0.3;
  const goggles: EyewearLayout = {
    ...worn,
    h: worn.h * 0.8,
    lenses: [
      { x: worn.lenses[0].x, y: foreheadY },
      { x: worn.lenses[1].x, y: foreheadY },
    ],
  };
  outline(ctx, "#1f5f6e", goggles.h * 0.3);
  ctx.lineCap = "butt";
  drawSides(ctx, goggles, 0);
  outline(ctx, "#123f49", 0.03);
  drawBridge(ctx, goggles, 0.01);
  ctx.fillStyle = "rgba(190, 235, 255, 0.45)";
  drawLenses(ctx, goggles, goggles.h * 0.4);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 0.018;
  for (const eye of goggles.lenses) {
    const left = eye.x - goggles.w / 2;
    const lensTop = eye.y - goggles.h / 2;
    ctx.beginPath();
    ctx.moveTo(left + goggles.w * 0.18, lensTop + goggles.h * 0.45);
    ctx.lineTo(left + goggles.w * 0.35, lensTop + goggles.h * 0.22);
    ctx.stroke();
  }

  // --- Bubbling flask beside the head ---
  const fx = 1;
  const fy = -0.35 + bob(time, 0);
  floating(ctx, fx, fy, 1.15, () => {
    const flask = new Path2D();
    flask.moveTo(fx - 0.05, fy - 0.24);
    flask.lineTo(fx - 0.05, fy - 0.1);
    flask.lineTo(fx - 0.17, fy + 0.13);
    flask.quadraticCurveTo(fx - 0.19, fy + 0.18, fx - 0.13, fy + 0.18);
    flask.lineTo(fx + 0.13, fy + 0.18);
    flask.quadraticCurveTo(fx + 0.19, fy + 0.18, fx + 0.17, fy + 0.13);
    flask.lineTo(fx + 0.05, fy - 0.1);
    flask.lineTo(fx + 0.05, fy - 0.24);
    flask.closePath();

    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.fill(flask);
    // Liquid in the lower part of the flask.
    ctx.save();
    ctx.clip(flask);
    ctx.fillStyle = "#51cf66";
    ctx.fillRect(fx - 0.2, fy + 0.02, 0.4, 0.2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillRect(fx - 0.2, fy + 0.02, 0.4, 0.025);
    ctx.restore();
    outline(ctx, "#495057", 0.014);
    ctx.stroke(flask);
    // Rim
    ctx.beginPath();
    ctx.moveTo(fx - 0.07, fy - 0.24);
    ctx.lineTo(fx + 0.07, fy - 0.24);
    ctx.stroke();

    // Bubbles rise out of the neck and shrink away.
    outline(ctx, "#2b8a3e", 0.008);
    for (let i = 0; i < 3; i++) {
      const rise = (time * 0.7 + i / 3) % 1;
      const r = 0.035 * (1 - rise * 0.6);
      const x = fx + Math.sin((rise + i) * 6) * 0.04;
      ctx.globalAlpha = 1 - rise;
      circle(ctx, x, fy - 0.28 - rise * 0.32, r, "#b2f2bb");
      ctx.globalAlpha = 1;
    }
  });
}

// ---------------------------------------------------------------------------
// A: Artistic, Fine and Performing Arts

function drawBeret(ctx: CanvasRenderingContext2D, _face: FaceShape, time: number) {
  outline(ctx, "#5c0f12");

  // Beret, slouched to one side and pulled down over the hairline.
  ctx.save();
  ctx.translate(0.06, 0.08);
  ctx.rotate(-0.14);
  const fill = ctx.createRadialGradient(-0.1, -0.3, 0.05, 0, -0.18, 0.7);
  fill.addColorStop(0, "#e03e45");
  fill.addColorStop(1, "#a51d24");
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(0.04, -0.2, 0.66, 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Headband
  ctx.fillStyle = "#7d1418";
  ctx.beginPath();
  ctx.ellipse(0, -0.03, 0.5, 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Stalk on top
  ctx.fillStyle = "#7d1418";
  ctx.beginPath();
  ctx.roundRect(0.02, -0.5, 0.05, 0.08, 0.02);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Paint palette floating beside the head.
  const px = -1.02;
  const py = 0.15 + bob(time, 1.5);
  const blobs: [number, number, string][] = [
    [-0.13, -0.02, "#e03131"],
    [-0.06, -0.1, "#fab005"],
    [0.05, -0.1, "#2f9e44"],
    [0.13, -0.03, "#1c7ed6"],
    [-0.08, 0.08, "#ae3ec9"],
  ];
  floating(ctx, px, py, 1.4, () => {
    outline(ctx, "#7a4b1e", 0.014);
    ctx.fillStyle = "#e8c48f";
    ctx.beginPath();
    ctx.ellipse(px, py, 0.24, 0.18, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Thumb hole
    circle(ctx, px + 0.1, py + 0.07, 0.035, "rgba(0, 0, 0, 0.25)");
    outline(ctx, "rgba(0, 0, 0, 0.2)", 0.008);
    for (const [x, y, color] of blobs) {
      circle(ctx, px + x, py + y, 0.035, color);
    }
  });
}

// ---------------------------------------------------------------------------
// S: Social, Counseling (and Education, Public Relations)

// Speech bubble centred on (x, y), its tail pointing back toward the head.
function speechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tailToward: 1 | -1,
) {
  const bottom = y + h / 2;
  const tailX = x + tailToward * w * 0.2;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, h * 0.45);
  ctx.moveTo(tailX - 0.04, bottom - 0.01);
  ctx.lineTo(tailX + tailToward * 0.1, bottom + 0.09);
  ctx.lineTo(tailX + 0.04, bottom - 0.01);
  ctx.fill();
  ctx.stroke();
  // Hide the seam where the tail joins the bubble.
  ctx.fillRect(tailX - 0.035, bottom - 0.03, 0.07, 0.03);
}

// Two hands clasped in a white disc: blue sleeve from one side, orange
// from the other.
function handshake(ctx: CanvasRenderingContext2D, x: number, y: number) {
  outline(ctx, "#495057", 0.012);
  circle(ctx, x, y, 0.22, "#ffffff");

  outline(ctx, "#343a40", 0.01);
  ctx.fillStyle = "#4c6ef5";
  ctx.beginPath();
  ctx.roundRect(x - 0.2, y - 0.05, 0.1, 0.12, 0.02);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fd7e14";
  ctx.beginPath();
  ctx.roundRect(x + 0.1, y - 0.05, 0.1, 0.12, 0.02);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#e0ac69";
  ctx.beginPath();
  ctx.ellipse(x - 0.03, y + 0.015, 0.09, 0.055, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f1c27d";
  ctx.beginPath();
  ctx.ellipse(x + 0.03, y + 0.005, 0.09, 0.055, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Fingers wrapped over the other hand
  for (const dx of [-0.02, 0.015, 0.05]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, y - 0.03);
    ctx.lineTo(x + dx - 0.015, y + 0.02);
    ctx.stroke();
  }
}

function drawCounselor(
  ctx: CanvasRenderingContext2D,
  face: FaceShape,
  time: number,
) {
  const neck = face.chinY;

  // Lanyard straps from either side of the neck down to an ID badge. Kept
  // short so the badge clears the caption banner.
  outline(ctx, "#0c8599", 0.05);
  ctx.lineCap = "butt";
  ctx.beginPath();
  const badgeTop = neck + 0.26;
  ctx.moveTo(-0.3, neck - 0.04);
  ctx.lineTo(-0.05, badgeTop);
  ctx.moveTo(0.3, neck - 0.04);
  ctx.lineTo(0.05, badgeTop);
  ctx.stroke();

  outline(ctx, "#495057", 0.012);
  ctx.fillStyle = "#adb5bd";
  ctx.beginPath();
  ctx.roundRect(-0.05, badgeTop - 0.03, 0.1, 0.06, 0.015);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(-0.15, badgeTop, 0.3, 0.26, 0.03);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3bc9db";
  ctx.fillRect(-0.15, badgeTop, 0.3, 0.06);
  // Photo and two name lines
  circle(ctx, -0.07, badgeTop + 0.15, 0.045, "#ced4da");
  outline(ctx, "#ced4da", 0.02);
  ctx.beginPath();
  ctx.moveTo(0.0, badgeTop + 0.13);
  ctx.lineTo(0.1, badgeTop + 0.13);
  ctx.moveTo(0.0, badgeTop + 0.19);
  ctx.lineTo(0.07, badgeTop + 0.19);
  ctx.stroke();

  // "Typing..." bubble on one side of the head.
  const ax = -0.98;
  const ay = -0.4 + bob(time, 0);
  floating(ctx, ax, ay, 1.2, () => {
    outline(ctx, "#495057", 0.014);
    ctx.fillStyle = "#ffffff";
    speechBubble(ctx, ax, ay, 0.4, 0.24, 1);
    for (const dx of [-0.1, 0, 0.1]) circle(ctx, ax + dx, ay, 0.028, "#868e96");
  });

  // Bubble with a heart on the other side.
  const bx = 0.98;
  const by = -0.15 + bob(time, 2);
  floating(ctx, bx, by, 1.2, () => {
    outline(ctx, "#0b7285", 0.014);
    ctx.fillStyle = "#c5f6fa";
    speechBubble(ctx, bx, by, 0.34, 0.24, -1);
    outline(ctx, "#a61e4d", 0.01);
    ctx.fillStyle = "#f06595";
    heart(ctx, bx, by + 0.01, 0.2);
  });

  // Handshake below the "typing" bubble.
  const hx = -0.95;
  const hy = 0.3 + bob(time, 4);
  floating(ctx, hx, hy, 1.1, () => handshake(ctx, hx, hy));
}

// ---------------------------------------------------------------------------
// E: Enterprising, Business and Law

// Full suit over the student's own clothes, fitted to their shoulders (see
// fitToBody). It runs off the bottom of the frame on purpose.
function drawSuit(ctx: CanvasRenderingContext2D, face: FaceShape, time: number) {
  const top = face.chinY + 0.1; // collar line, just below the chin
  const vDepth = 1.5; // jacket opening, collar to top button
  const vHalf = 0.3; // half the opening's width at the collar

  ctx.save();
  fitToBody(ctx, face, top);

  // Shirt, filling the jacket's opening.
  outline(ctx, "#adb5bd", 0.012);
  ctx.fillStyle = "#f8f9fa";
  ctx.beginPath();
  ctx.moveTo(-vHalf - 0.02, top - 0.02);
  ctx.lineTo(0, top + vDepth + 0.05);
  ctx.lineTo(vHalf + 0.02, top - 0.02);
  ctx.closePath();
  ctx.fill();

  // Shirt collar points either side of the knot.
  ctx.fillStyle = "#ffffff";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 0.03, top - 0.02);
    ctx.lineTo(side * 0.26, top - 0.06);
    ctx.lineTo(side * 0.15, top + 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Tie: blade, then the knot on top. Burgundy so it stands out against
  // the dark jacket.
  outline(ctx, "#4a0d16", 0.014);
  const tie = new Path2D();
  tie.moveTo(-0.08, top + 0.12);
  tie.lineTo(0.08, top + 0.12);
  tie.lineTo(0.13, top + 1.05);
  tie.lineTo(0, top + 1.2);
  tie.lineTo(-0.13, top + 1.05);
  tie.closePath();
  ctx.fillStyle = "#9c1c2e";
  ctx.fill(tie);
  ctx.save();
  ctx.clip(tie);
  ctx.strokeStyle = "#f2c94c";
  ctx.lineWidth = 0.025;
  for (let y = top + 0.1; y < top + 1.3; y += 0.14) {
    ctx.beginPath();
    ctx.moveTo(-0.2, y);
    ctx.lineTo(0.2, y + 0.12);
    ctx.stroke();
  }
  ctx.restore();
  ctx.stroke(tie);

  ctx.fillStyle = "#7d1624";
  ctx.beginPath();
  ctx.moveTo(-0.08, top);
  ctx.lineTo(0.08, top);
  ctx.lineTo(0.06, top + 0.13);
  ctx.lineTo(-0.06, top + 0.13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Jacket over the tie's edges, as a real jacket sits over the tie.
  const cloth = ctx.createLinearGradient(0, top, 0, top + 2.5);
  cloth.addColorStop(0, "#3a4458");
  cloth.addColorStop(1, "#232a38");
  ctx.fillStyle = cloth;
  const jacket = jacketPath(top, vHalf, vDepth);
  ctx.fill(jacket, "evenodd");
  outline(ctx, "#151a24", 0.016);
  ctx.stroke(jacket);
  ctx.fillStyle = "#434e64";
  drawLapels(ctx, top, vHalf, vDepth);

  // Buttons below the opening.
  outline(ctx, "#0b0e14", 0.01);
  circle(ctx, 0, top + vDepth + 0.12, 0.045, "#1b202b");
  circle(ctx, 0, top + vDepth + 0.42, 0.045, "#1b202b");

  // Breast pocket with a white pocket square.
  outline(ctx, "#151a24", 0.014);
  ctx.beginPath();
  ctx.moveTo(0.55, top + 0.95);
  ctx.lineTo(0.9, top + 0.92);
  ctx.stroke();
  outline(ctx, "#ced4da", 0.01);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(0.6, top + 0.945);
  ctx.lineTo(0.66, top + 0.84);
  ctx.lineTo(0.73, top + 0.9);
  ctx.lineTo(0.8, top + 0.82);
  ctx.lineTo(0.85, top + 0.925);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Briefcase floating beside the head.
  const bx = 1.02;
  const by = bob(time, 1);
  floating(ctx, bx, by, 1.5, () => {
    outline(ctx, "#3b2210", 0.014);
    // Handle
    ctx.beginPath();
    ctx.roundRect(bx - 0.07, by - 0.2, 0.14, 0.08, 0.03);
    ctx.stroke();
    ctx.fillStyle = "#8b5a2b";
    ctx.beginPath();
    ctx.roundRect(bx - 0.2, by - 0.13, 0.4, 0.28, 0.04);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx - 0.2, by - 0.02);
    ctx.lineTo(bx + 0.2, by - 0.02);
    ctx.stroke();
    ctx.fillStyle = "#f2c94c";
    ctx.fillRect(bx - 0.03, by - 0.05, 0.06, 0.06);
  });
}

// ---------------------------------------------------------------------------
// C: Conventional, Accounting

function drawGlassesAndPencil(
  ctx: CanvasRenderingContext2D,
  face: FaceShape,
  time: number,
) {
  const eyeY = face.eyeY;

  // Glasses: arms and bridge, then the frames on top.
  const glasses = eyewearLayout(face, 1.8, 1.15);
  outline(ctx, "#212529", 0.028);
  drawSides(ctx, glasses, 0.02);
  drawBridge(ctx, glasses, 0.02);
  ctx.fillStyle = "rgba(220, 235, 255, 0.18)";
  drawLenses(ctx, glasses, 0.04);

  // Pencil tucked behind the ear: just outside the cheek edge, level with
  // the top of the ear, steep so it reads as resting on it.
  ctx.save();
  ctx.translate(0.6, eyeY - 0.08);
  ctx.rotate(-1.25);
  outline(ctx, "#5c3d00", 0.01);
  ctx.fillStyle = "#ffd43b";
  ctx.fillRect(-0.2, -0.035, 0.36, 0.07);
  ctx.strokeRect(-0.2, -0.035, 0.36, 0.07);
  ctx.fillStyle = "#f783ac";
  ctx.fillRect(-0.27, -0.035, 0.05, 0.07);
  ctx.fillStyle = "#adb5bd";
  ctx.fillRect(-0.22, -0.035, 0.02, 0.07);
  ctx.fillStyle = "#f4d9a6";
  ctx.beginPath();
  ctx.moveTo(0.16, -0.035);
  ctx.lineTo(0.26, 0);
  ctx.lineTo(0.16, 0.035);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#343a40";
  ctx.beginPath();
  ctx.moveTo(0.225, -0.012);
  ctx.lineTo(0.26, 0);
  ctx.lineTo(0.225, 0.012);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Clipboard with a ticked checklist, floating beside the head.
  const cx = -1.02;
  const cy = 0.05 + bob(time, 3);
  floating(ctx, cx, cy, 1.4, () => {
    outline(ctx, "#5c3d1e", 0.012);
    ctx.fillStyle = "#a9713a";
    ctx.beginPath();
    ctx.roundRect(cx - 0.16, cy - 0.21, 0.32, 0.42, 0.03);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(cx - 0.12, cy - 0.15, 0.24, 0.32);
    ctx.fillStyle = "#adb5bd";
    ctx.beginPath();
    ctx.roundRect(cx - 0.06, cy - 0.24, 0.12, 0.06, 0.02);
    ctx.fill();
    ctx.stroke();
    for (let row = 0; row < 3; row++) {
      const y = cy - 0.08 + row * 0.09;
      outline(ctx, "#2f9e44", 0.016);
      ctx.beginPath();
      ctx.moveTo(cx - 0.09, y);
      ctx.lineTo(cx - 0.07, y + 0.02);
      ctx.lineTo(cx - 0.04, y - 0.025);
      ctx.stroke();
      outline(ctx, "#ced4da", 0.012);
      ctx.beginPath();
      ctx.moveTo(cx - 0.01, y);
      ctx.lineTo(cx + 0.09, y);
      ctx.stroke();
    }
  });
}

// ---------------------------------------------------------------------------

// Banner caption from the official trait name, so it always matches the
// results page: "You are Realistic".
function youAre(letter: RiasecLetter): string {
  return `You are ${RIASEC_PATHWAYS[letter].name}`;
}

export const CAREER_LOOKS: Readonly<Record<RiasecLetter, CareerLook>> = {
  R: {
    letter: "R",
    caption: youAre("R"),
    propsLabel: "a hard hat",
    draw: drawHardHat,
  },
  I: {
    letter: "I",
    caption: youAre("I"),
    propsLabel: "a lab coat and goggles",
    draw: drawLabCoat,
    usesBody: true,
  },
  A: {
    letter: "A",
    caption: youAre("A"),
    propsLabel: "a beret and palette",
    draw: drawBeret,
  },
  S: {
    letter: "S",
    caption: youAre("S"),
    propsLabel: "a lanyard and speech bubbles",
    draw: drawCounselor,
  },
  E: {
    letter: "E",
    caption: youAre("E"),
    propsLabel: "a suit and tie",
    draw: drawSuit,
    usesBody: true,
  },
  C: {
    letter: "C",
    caption: youAre("C"),
    propsLabel: "glasses and a pencil",
    draw: drawGlassesAndPencil,
  },
};
