// Copyright (c) 2026 EdTech. All rights reserved.

import type { HandSign } from "@/lib/career-look/hand-signs";
import { heart } from "@/lib/career-look/looks";
import type { RiasecLetter } from "@/lib/riasec/types";

// Short bursts drawn on the career look camera when the student makes a
// hand sign. The sign sets how the burst moves (a wave throws a fan that
// falls, a thumbs up or peace sign bursts in a ring, the I-love-you sign
// floats up, pointing up raises one big icon); the look being worn sets
// what flies: gears for Realistic, atoms for Investigative, paint for
// Artistic, hearts for Social, coins for Enterprising, checkmarks for
// Conventional. Pure decoration: silent, never needed for anything, and
// drawn into the canvas so a photo taken mid-burst keeps it. Shapes only,
// no text, because the canvas is mirrored.
//
// Positions are canvas pixels; `size` is the face width in pixels (or a
// share of the frame when no face is seen), so bursts read the same near
// or far from the camera. Velocities are in sizes per second.

export const EFFECT_MS = 1400;

export type Shape =
  | "gear"
  | "nut"
  | "atom"
  | "bubble"
  | "splat"
  | "star"
  | "heart"
  | "smiley"
  | "coin"
  | "arrow"
  | "check"
  | "tile";

interface Particle {
  shape: Shape;
  vx: number;
  vy: number;
  // Radians per second.
  spin: number;
  color: string;
  scale: number;
}

export interface Effect {
  sign: HandSign;
  letter: RiasecLetter;
  x: number;
  y: number;
  size: number;
  born: number;
  // Reduced motion: one icon that stays put and fades.
  still: boolean;
  particles: Particle[];
}

interface Theme {
  // The first shape is the look's emblem, used alone for pointing up and
  // under reduced motion.
  shapes: readonly [Shape, Shape];
  colors: readonly string[];
}

export const THEMES: Readonly<Record<RiasecLetter, Theme>> = {
  R: { shapes: ["gear", "nut"], colors: ["#ff9aa2", "#e8737f", "#adb5bd"] },
  I: { shapes: ["atom", "bubble"], colors: ["#a37cff", "#4dabf7", "#51cf66"] },
  A: {
    shapes: ["splat", "star"],
    colors: ["#ff9aa2", "#e8d5b5", "#a6c8e2", "#c9a45f", "#7fb0d6"],
  },
  S: { shapes: ["heart", "smiley"], colors: ["#a6c8e2", "#7fb0d6", "#e3f0fa", "#ff8fab"] },
  E: { shapes: ["coin", "arrow"], colors: ["#ffd21f", "#38e54d", "#f2a900"] },
  C: { shapes: ["check", "tile"], colors: ["#38e54d", "#1fd8c8", "#2192ff"] },
};

// Only a wave's fan falls back down.
const GRAVITY = 2.2;

export function spawnEffect(
  sign: HandSign,
  letter: RiasecLetter,
  origin: { x: number; y: number },
  size: number,
  now: number,
  still: boolean,
  random: () => number = Math.random,
): Effect {
  const theme = THEMES[letter];
  const base = { sign, letter, x: origin.x, y: origin.y, size, born: now, still };
  const pick = (i: number) => ({
    shape: theme.shapes[i % 2]!,
    color: theme.colors[i % theme.colors.length]!,
  });

  if (still || sign === "pointUp") {
    return {
      ...base,
      particles: [
        {
          shape: theme.shapes[0],
          color: theme.colors[0]!,
          vx: 0,
          vy: still ? 0 : -0.35,
          spin: still ? 0 : 1.5,
          scale: still ? 1.8 : 2.2,
        },
      ],
    };
  }

  const particles: Particle[] = [];
  switch (sign) {
    case "wave":
      for (let i = 0; i < 16; i++) {
        // Thrown upward in a fan, then falling.
        const angle = -Math.PI / 2 + (random() - 0.5) * 2.2;
        const speed = 0.9 + random() * 0.8;
        particles.push({
          ...pick(i),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          spin: (random() - 0.5) * 10,
          scale: 0.7 + random() * 0.5,
        });
      }
      break;
    case "thumbsUp":
    case "peace": {
      const count = sign === "thumbsUp" ? 10 : 8;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + random() * 0.3;
        const speed = 0.6 + random() * 0.3;
        particles.push({
          ...pick(i),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          spin: sign === "peace" ? (random() - 0.5) * 4 : 0,
          scale: 0.8 + random() * 0.5,
        });
      }
      break;
    }
    case "love":
      for (let i = 0; i < 7; i++) {
        particles.push({
          ...pick(i),
          vx: (random() - 0.5) * 0.5,
          vy: -0.55 - random() * 0.45,
          spin: 0,
          scale: 0.8 + random() * 0.6,
        });
      }
      break;
  }
  return { ...base, particles };
}

// Draws every live effect and returns the ones still running.
export function drawEffects(
  ctx: CanvasRenderingContext2D,
  effects: readonly Effect[],
  now: number,
): Effect[] {
  const live: Effect[] = [];
  for (const effect of effects) {
    const age = now - effect.born;
    if (age >= EFFECT_MS) continue;
    live.push(effect);

    const life = age / EFFECT_MS;
    const t = age / 1000;
    const fade = life < 0.7 ? 1 : 1 - (life - 0.7) / 0.3;
    const pop = effect.still ? 1 : Math.min(1, life * 6);
    const unit = effect.size * 0.09;
    const fall = effect.sign === "wave" ? GRAVITY : 0;

    ctx.save();
    ctx.globalAlpha = fade;
    effect.particles.forEach((particle, i) => {
      let x = effect.x + particle.vx * t * effect.size;
      let y =
        effect.y + (particle.vy * t + 0.5 * fall * t * t) * effect.size;
      if (effect.still) y -= effect.size * 0.35;
      if (effect.sign === "love" && !effect.still) {
        x += Math.sin(t * 6 + i) * effect.size * 0.05;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(particle.spin * t);
      drawShape(ctx, particle.shape, unit * particle.scale * pop, particle.color);
      ctx.restore();
    });
    ctx.restore();
  }
  return live;
}

const INK = "#1b2a4a";

// Each shape is drawn centred on the origin, about `s` in radius.
function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  s: number,
  color: string,
) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = s * 0.14;
  ctx.strokeStyle = INK;
  ctx.fillStyle = color;
  switch (shape) {
    case "gear": {
      ctx.beginPath();
      const teeth = 8;
      for (let i = 0; i < teeth * 2; i++) {
        const r = i % 2 === 0 ? s : s * 0.75;
        const a0 = (i / (teeth * 2)) * Math.PI * 2;
        const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
        ctx.arc(0, 0, r, a0, a1);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "nut":
      polygon(ctx, s * 0.85, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case "atom":
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.16;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, s, s * 0.38, (i * Math.PI) / 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "bubble":
      ctx.globalAlpha *= 0.85;
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.16;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-s * 0.3, -s * 0.3, s * 0.15, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "splat":
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.4;
        const r = i % 2 === 0 ? s * 0.3 : s * 0.2;
        const d = i % 2 === 0 ? s * 0.75 : s * 1.05;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case "star":
      starPath(ctx, s, s * 0.45, 5);
      ctx.fill();
      ctx.stroke();
      break;
    case "heart":
      ctx.strokeStyle = "#a61e4d";
      heart(ctx, 0, 0, s * 2);
      break;
    case "smiley":
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = INK;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(side * s * 0.3, -s * 0.2, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * 0.45, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
      break;
    case "coin":
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#8a6100";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.ellipse(-s * 0.3, -s * 0.35, s * 0.18, s * 0.09, -0.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "arrow":
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.75, -s * 0.1);
      ctx.lineTo(s * 0.3, -s * 0.1);
      ctx.lineTo(s * 0.3, s * 0.9);
      ctx.lineTo(-s * 0.3, s * 0.9);
      ctx.lineTo(-s * 0.3, -s * 0.1);
      ctx.lineTo(-s * 0.75, -s * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "check":
      ctx.strokeStyle = INK;
      ctx.lineWidth = s * 0.55;
      checkPath(ctx, s);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.32;
      checkPath(ctx, s);
      ctx.stroke();
      break;
    case "tile":
      ctx.beginPath();
      ctx.roundRect(-s * 0.7, -s * 0.7, s * 1.4, s * 1.4, s * 0.25);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = s * 0.12;
      ctx.beginPath();
      ctx.moveTo(-s * 0.35, 0);
      ctx.lineTo(s * 0.35, 0);
      ctx.moveTo(0, -s * 0.35);
      ctx.lineTo(0, s * 0.35);
      ctx.stroke();
      break;
  }
}

function polygon(ctx: CanvasRenderingContext2D, r: number, sides: number) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
}

function starPath(
  ctx: CanvasRenderingContext2D,
  outer: number,
  inner: number,
  points: number,
) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
}

function checkPath(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(-s * 0.7, 0);
  ctx.lineTo(-s * 0.2, s * 0.5);
  ctx.lineTo(s * 0.75, -s * 0.55);
}
