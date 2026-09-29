// Copyright (c) 2026 EdTech. All rights reserved.

// Turns MediaPipe face landmarks into one anchor that props are drawn
// against: a point at the top of the forehead, the head's roll angle, and
// the face width as the unit of scale. Props are authored in "face widths",
// so a hat fits whether the student sits close to the camera or far away.

export interface Landmark {
  // Normalized 0-1 image coordinates, as MediaPipe returns them.
  x: number;
  y: number;
}

export interface FaceAnchor {
  // Top of the forehead, in canvas pixels.
  x: number;
  y: number;
  // Head roll in radians; 0 when the eyes are level.
  angle: number;
  // Cheek-to-cheek distance in canvas pixels.
  width: number;
  // How far down the face the eyes and chin sit, measured from the anchor
  // along the head's own "down" and in face widths, so goggles and ties
  // land right on faces of any shape.
  eyeY: number;
  chinY: number;
  // Centre of each eye, and the average corner-to-corner eye width, in the
  // same face-width units (x toward image right), so lenses sit on the real
  // eyes and scale with them.
  rightEye: FacePoint;
  leftEye: FacePoint;
  eyeSize: number;
}

export interface FacePoint {
  x: number;
  y: number;
}

// Indices into MediaPipe's 478-point face mesh.
export const FOREHEAD_TOP = 10;
export const FACE_EDGE_RIGHT = 234; // subject's right; image left
export const FACE_EDGE_LEFT = 454; // subject's left; image right
export const EYE_LINE = 168; // bridge of the nose, level with the eyes
export const CHIN = 152;
// Eye corners, outer then inner.
export const RIGHT_EYE_CORNERS = [33, 133] as const;
export const LEFT_EYE_CORNERS = [263, 362] as const;

export function computeFaceAnchor(
  landmarks: readonly Landmark[],
  frameWidth: number,
  frameHeight: number,
): FaceAnchor | null {
  const top = landmarks[FOREHEAD_TOP];
  const right = landmarks[FACE_EDGE_RIGHT];
  const left = landmarks[FACE_EDGE_LEFT];
  const eyes = landmarks[EYE_LINE];
  const chin = landmarks[CHIN];
  const rightOuter = landmarks[RIGHT_EYE_CORNERS[0]];
  const rightInner = landmarks[RIGHT_EYE_CORNERS[1]];
  const leftOuter = landmarks[LEFT_EYE_CORNERS[0]];
  const leftInner = landmarks[LEFT_EYE_CORNERS[1]];
  if (!top || !right || !left || !eyes || !chin) return null;
  if (!rightOuter || !rightInner || !leftOuter || !leftInner) return null;

  const dx = (left.x - right.x) * frameWidth;
  const dy = (left.y - right.y) * frameHeight;
  const width = Math.hypot(dx, dy);
  if (width === 0) return null;

  // Head-local axes: "across" runs along the cheek line, "down" is that
  // line turned 90°. Points are measured from the anchor in face widths.
  const acrossX = dx / width;
  const acrossY = dy / width;
  const local = (point: Landmark): FacePoint => {
    const px = (point.x - top.x) * frameWidth;
    const py = (point.y - top.y) * frameHeight;
    return {
      x: (px * acrossX + py * acrossY) / width,
      y: (-px * acrossY + py * acrossX) / width,
    };
  };
  const eye = (outerPoint: Landmark, innerPoint: Landmark) => {
    const outer = local(outerPoint);
    const inner = local(innerPoint);
    return {
      centre: { x: (outer.x + inner.x) / 2, y: (outer.y + inner.y) / 2 },
      size: Math.hypot(outer.x - inner.x, outer.y - inner.y),
    };
  };
  const rightEye = eye(rightOuter, rightInner);
  const leftEye = eye(leftOuter, leftInner);

  return {
    x: top.x * frameWidth,
    y: top.y * frameHeight,
    angle: Math.atan2(dy, dx),
    width,
    eyeY: local(eyes).y,
    chinY: local(chin).y,
    rightEye: rightEye.centre,
    leftEye: leftEye.centre,
    eyeSize: (rightEye.size + leftEye.size) / 2,
  };
}

// ---------------------------------------------------------------------------
// Body: shoulders from the pose tracker, for looks that dress the body.

export interface PoseLandmark extends Landmark {
  // 0-1 confidence that the point is in frame and not hidden.
  visibility?: number;
}

// Both shoulders in canvas pixels, image-left first.
export interface Shoulders {
  near: FacePoint;
  far: FacePoint;
}

// Indices into MediaPipe's 33-point pose model.
export const POSE_LEFT_SHOULDER = 11;
export const POSE_RIGHT_SHOULDER = 12;

// Null unless both shoulders are confidently in frame: a jacket pinned to
// a guessed shoulder jumps about, so the look falls back to the face.
export function computeShoulders(
  landmarks: readonly PoseLandmark[],
  frameWidth: number,
  frameHeight: number,
  minVisibility = 0.5,
): Shoulders | null {
  const left = landmarks[POSE_LEFT_SHOULDER];
  const right = landmarks[POSE_RIGHT_SHOULDER];
  if (!left || !right) return null;
  if ((left.visibility ?? 1) < minVisibility) return null;
  if ((right.visibility ?? 1) < minVisibility) return null;
  const a = { x: left.x * frameWidth, y: left.y * frameHeight };
  const b = { x: right.x * frameWidth, y: right.y * frameHeight };
  return a.x <= b.x ? { near: a, far: b } : { near: b, far: a };
}

export function smoothShoulders(
  previous: Shoulders | null,
  next: Shoulders,
  amount = 0.5,
): Shoulders {
  if (!previous) return next;
  const lerp = (a: FacePoint, b: FacePoint) => ({
    x: a.x + (b.x - a.x) * amount,
    y: a.y + (b.y - a.y) * amount,
  });
  return {
    near: lerp(previous.near, next.near),
    far: lerp(previous.far, next.far),
  };
}

// Canvas pixels into the anchor's face space (face widths from the
// forehead, rotated with the head): where the looks draw.
export function toFaceSpace(point: FacePoint, anchor: FaceAnchor): FacePoint {
  const px = point.x - anchor.x;
  const py = point.y - anchor.y;
  const cos = Math.cos(anchor.angle);
  const sin = Math.sin(anchor.angle);
  return {
    x: (px * cos + py * sin) / anchor.width,
    y: (-px * sin + py * cos) / anchor.width,
  };
}

// Shortest signed turn from `from` to `to`, so smoothing never spins the
// long way round when the angle crosses ±π.
function angleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

// Exponential smoothing between frames. Raw landmarks jitter by a pixel or
// two, which reads as a trembling hat; `amount` is how far to move toward
// the new reading (1 = no smoothing).
export function smoothAnchor(
  previous: FaceAnchor | null,
  next: FaceAnchor,
  amount = 0.5,
): FaceAnchor {
  if (!previous) return next;
  const lerp = (a: number, b: number) => a + (b - a) * amount;
  const lerpPoint = (a: FacePoint, b: FacePoint) => ({
    x: lerp(a.x, b.x),
    y: lerp(a.y, b.y),
  });
  return {
    x: lerp(previous.x, next.x),
    y: lerp(previous.y, next.y),
    angle: previous.angle + angleDelta(previous.angle, next.angle) * amount,
    width: lerp(previous.width, next.width),
    eyeY: lerp(previous.eyeY, next.eyeY),
    chinY: lerp(previous.chinY, next.chinY),
    rightEye: lerpPoint(previous.rightEye, next.rightEye),
    leftEye: lerpPoint(previous.leftEye, next.leftEye),
    eyeSize: lerp(previous.eyeSize, next.eyeSize),
  };
}
