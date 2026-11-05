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

export function heart(
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
// Scientist: one-piece safety goggles worn over the eyes (a clear tinted
// shield in a chunky frame, with a strap round the head), a DNA helix
// twisting on one side of the head and a bubbling flask on the other.
// Face-only, so it never needs the body tracker.
function drawGoggles(
  ctx: CanvasRenderingContext2D,
  face: FaceShape,
  time: number,
) {
  // --- Goggles, over the eyes ---
  const layout = eyewearLayout(face, 1.8, 1.3);
  const [near, far] = layout.lenses;
  const pad = face.eyeSize * 0.85;
  const left = near.x - pad;
  const right = far.x + pad;
  const midX = (near.x + far.x) / 2;
  const cy = (near.y + far.y) / 2;
  const h = face.eyeSize * 1.75;
  const top = cy - h * 0.5;
  const bottom = cy + h * 0.5;
  const r = h * 0.38;
  const noseHalf = face.eyeSize * 0.4;
  const noseRise = h * 0.38;

  const shield = new Path2D();
  shield.moveTo(left + r, top);
  shield.lineTo(right - r, top);
  shield.quadraticCurveTo(right, top, right, top + r);
  shield.lineTo(right, bottom - r);
  shield.quadraticCurveTo(right, bottom, right - r, bottom);
  shield.lineTo(midX + noseHalf, bottom);
  shield.bezierCurveTo(
    midX + noseHalf * 0.5,
    bottom - noseRise,
    midX - noseHalf * 0.5,
    bottom - noseRise,
    midX - noseHalf,
    bottom,
  );
  shield.lineTo(left + r, bottom);
  shield.quadraticCurveTo(left, bottom, left, bottom - r);
  shield.lineTo(left, top + r);
  shield.quadraticCurveTo(left, top, left + r, top);
  shield.closePath();

  // Strap, behind the frame, out to the sides of the head.
  outline(ctx, "#1f5f6e", h * 0.32);
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(left + 0.01, cy);
  ctx.lineTo(layout.sideX[0], cy - 0.02);
  ctx.moveTo(right - 0.01, cy);
  ctx.lineTo(layout.sideX[1], cy - 0.02);
  ctx.stroke();

  // Clear, lightly tinted shield so the eyes still show.
  ctx.fillStyle = "rgba(190, 235, 255, 0.32)";
  ctx.fill(shield);

  // Chunky frame: a dark rim with a lighter inner edge.
  outline(ctx, "#123f49", 0.065);
  ctx.stroke(shield);
  outline(ctx, "#3fb6c9", 0.025);
  ctx.stroke(shield);

  // Vents along the top of the frame.
  ctx.fillStyle = "#0b2a31";
  for (const t of [0.22, 0.36, 0.64, 0.78]) {
    ctx.beginPath();
    ctx.arc(left + (right - left) * t, top, 0.012, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glare streaks on each side of the shield.
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 0.018;
  for (const x of [near.x, far.x]) {
    ctx.beginPath();
    ctx.moveTo(x - layout.w * 0.45, cy + h * 0.05);
    ctx.lineTo(x - layout.w * 0.2, cy - h * 0.25);
    ctx.stroke();
  }

  // --- DNA helix twisting beside the head, image left ---
  const dx = -1;
  const dy = -0.3 + bob(time, 2);
  floating(ctx, dx, dy, 1.15, () => {
    const steps = 9;
    const span = 0.5;
    const amp = 0.11;
    const turn = time * 1.6;
    const strand = (phase: number) => {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const x = dx + Math.sin(t * Math.PI * 2 + turn + phase) * amp;
        const y = dy - span / 2 + t * span;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    // Rungs between the strands.
    outline(ctx, "#ced4da", 0.014);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const a = t * Math.PI * 2 + turn;
      const y = dy - span / 2 + t * span;
      ctx.beginPath();
      ctx.moveTo(dx + Math.sin(a) * amp, y);
      ctx.lineTo(dx + Math.sin(a + Math.PI) * amp, y);
      ctx.stroke();
    }
    outline(ctx, "#2192ff", 0.03);
    strand(0);
    outline(ctx, "#be4bdb", 0.03);
    strand(Math.PI);
  });

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

// Presenter's headset for pitching and leading a room: a band over the
// head, ear cups at the sides of the face and a mic boom reaching to the
// mouth. Everything hangs off the face, so it never needs the body tracker.
// A briefcase and a rising bar chart float either side of the head.
function drawHeadset(
  ctx: CanvasRenderingContext2D,
  face: FaceShape,
  time: number,
) {
  const earY = face.eyeY + 0.12;
  const cupX = 0.53;
  const mouthY = face.eyeY + (face.chinY - face.eyeY) * 0.62;

  // Band over the top of the head, from cup to cup.
  outline(ctx, "#151a24", 0.07);
  ctx.beginPath();
  ctx.moveTo(-cupX, earY - 0.08);
  ctx.bezierCurveTo(-0.62, -0.42, 0.62, -0.42, cupX, earY - 0.08);
  ctx.stroke();
  outline(ctx, "#4d5b75", 0.03);
  ctx.stroke();

  // Mic boom from the image-left cup round to the corner of the mouth.
  const tipX = -0.13;
  outline(ctx, "#151a24", 0.03);
  ctx.beginPath();
  ctx.moveTo(-cupX, earY + 0.05);
  ctx.quadraticCurveTo(-0.5, mouthY + 0.02, tipX, mouthY);
  ctx.stroke();
  outline(ctx, "#0b0e14", 0.012);
  ctx.fillStyle = "#2b3345";
  ctx.beginPath();
  ctx.ellipse(tipX, mouthY, 0.065, 0.045, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e03131";
  ctx.beginPath();
  ctx.arc(tipX + 0.03, mouthY - 0.012, 0.012, 0, Math.PI * 2);
  ctx.fill();

  // Ear cups, drawn over the band and boom ends.
  for (const side of [-1, 1]) {
    outline(ctx, "#0b0e14", 0.014);
    ctx.fillStyle = "#2b3345";
    ctx.beginPath();
    ctx.roundRect(side * cupX - 0.075, earY - 0.13, 0.15, 0.26, 0.07);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2192ff";
    ctx.beginPath();
    ctx.roundRect(side * cupX - 0.035, earY - 0.08, 0.07, 0.16, 0.035);
    ctx.fill();
  }

  // Briefcase floating beside the head, image right.
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

  // Rising bar chart with an arrow, image left.
  const cx = -1.02;
  const cy = bob(time, 3);
  floating(ctx, cx, cy, 1.5, () => {
    outline(ctx, "#1b5e20", 0.012);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(cx - 0.22, cy - 0.2, 0.44, 0.38, 0.04);
    ctx.fill();
    ctx.stroke();
    const bars: [number, number][] = [
      [-0.13, 0.1],
      [-0.02, 0.18],
      [0.09, 0.27],
    ];
    ctx.fillStyle = "#38e54d";
    for (const [x, h] of bars) {
      ctx.beginPath();
      ctx.rect(cx + x - 0.035, cy + 0.12 - h, 0.07, h);
      ctx.fill();
      ctx.stroke();
    }
    outline(ctx, "#1b5e20", 0.02);
    ctx.beginPath();
    ctx.moveTo(cx - 0.16, cy + 0.0);
    ctx.lineTo(cx + 0.14, cy - 0.15);
    ctx.stroke();
    ctx.fillStyle = "#1b5e20";
    ctx.beginPath();
    ctx.moveTo(cx + 0.17, cy - 0.17);
    ctx.lineTo(cx + 0.08, cy - 0.17);
    ctx.lineTo(cx + 0.15, cy - 0.09);
    ctx.closePath();
    ctx.fill();
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
    propsLabel: "safety goggles",
    draw: drawGoggles,
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
    propsLabel: "a headset mic",
    draw: drawHeadset,
  },
  C: {
    letter: "C",
    caption: youAre("C"),
    propsLabel: "glasses and a pencil",
    draw: drawGlassesAndPencil,
  },
};
