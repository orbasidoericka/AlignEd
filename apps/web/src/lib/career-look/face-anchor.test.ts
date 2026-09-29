import { describe, expect, it } from "vitest";

import {
  CHIN,
  computeFaceAnchor,
  EYE_LINE,
  FACE_EDGE_LEFT,
  FACE_EDGE_RIGHT,
  FOREHEAD_TOP,
  computeShoulders,
  LEFT_EYE_CORNERS,
  POSE_LEFT_SHOULDER,
  POSE_RIGHT_SHOULDER,
  RIGHT_EYE_CORNERS,
  smoothAnchor,
  toFaceSpace,
  type Landmark,
} from "./face-anchor";

function face(points: Record<number, Landmark>): Landmark[] {
  const mesh: Landmark[] = Array.from({ length: 478 }, () => ({ x: 0, y: 0 }));
  for (const [index, point] of Object.entries(points)) {
    mesh[Number(index)] = point;
  }
  return mesh;
}

describe("computeFaceAnchor", () => {
  it("anchors at the forehead, scaled to the face width, level when upright", () => {
    const anchor = computeFaceAnchor(
      face({
        [FOREHEAD_TOP]: { x: 0.5, y: 0.2 },
        [FACE_EDGE_RIGHT]: { x: 0.4, y: 0.4 },
        [FACE_EDGE_LEFT]: { x: 0.6, y: 0.4 },
      }),
      1000,
      500,
    );
    expect(anchor).not.toBeNull();
    expect(anchor!.x).toBeCloseTo(500);
    expect(anchor!.y).toBeCloseTo(100);
    expect(anchor!.width).toBeCloseTo(200);
    expect(anchor!.angle).toBeCloseTo(0);
  });

  it("follows a head tilt", () => {
    const anchor = computeFaceAnchor(
      face({
        [FOREHEAD_TOP]: { x: 0.5, y: 0.2 },
        [FACE_EDGE_RIGHT]: { x: 0.4, y: 0.4 },
        [FACE_EDGE_LEFT]: { x: 0.5, y: 0.5 },
      }),
      1000,
      1000,
    );
    expect(anchor!.angle).toBeCloseTo(Math.PI / 4);
  });

  it("uses pixel space, so a wide frame does not skew the angle", () => {
    // 0.1 across a 2000px frame and 0.2 down a 1000px frame: 200 by 200.
    const anchor = computeFaceAnchor(
      face({
        [FOREHEAD_TOP]: { x: 0.5, y: 0.2 },
        [FACE_EDGE_RIGHT]: { x: 0.4, y: 0.3 },
        [FACE_EDGE_LEFT]: { x: 0.5, y: 0.5 },
      }),
      2000,
      1000,
    );
    expect(anchor!.angle).toBeCloseTo(Math.PI / 4);
  });

  it("measures eyes and chin in face widths below the forehead", () => {
    const anchor = computeFaceAnchor(
      face({
        [FOREHEAD_TOP]: { x: 0.5, y: 0.2 },
        [FACE_EDGE_RIGHT]: { x: 0.4, y: 0.4 },
        [FACE_EDGE_LEFT]: { x: 0.6, y: 0.4 },
        [EYE_LINE]: { x: 0.5, y: 0.3 },
        [CHIN]: { x: 0.5, y: 0.45 },
      }),
      1000,
      1000,
    );
    // Face width 200px; eyes 100px and chin 250px below the forehead.
    expect(anchor!.eyeY).toBeCloseTo(0.5);
    expect(anchor!.chinY).toBeCloseTo(1.25);
  });

  it("measures along the head's own down when it tilts", () => {
    // Head rolled 90°: the eye line runs straight down the image, so the
    // head's "down" points toward image left.
    const anchor = computeFaceAnchor(
      face({
        [FOREHEAD_TOP]: { x: 0.5, y: 0.5 },
        [FACE_EDGE_RIGHT]: { x: 0.6, y: 0.4 },
        [FACE_EDGE_LEFT]: { x: 0.6, y: 0.6 },
        [EYE_LINE]: { x: 0.4, y: 0.5 },
        [CHIN]: { x: 0.25, y: 0.5 },
      }),
      1000,
      1000,
    );
    expect(anchor!.angle).toBeCloseTo(Math.PI / 2);
    expect(anchor!.eyeY).toBeCloseTo(0.5);
    expect(anchor!.chinY).toBeCloseTo(1.25);
  });

  it("finds each eye's centre and size from its corners", () => {
    const anchor = computeFaceAnchor(
      face({
        [FOREHEAD_TOP]: { x: 0.5, y: 0.2 },
        [FACE_EDGE_RIGHT]: { x: 0.4, y: 0.4 },
        [FACE_EDGE_LEFT]: { x: 0.6, y: 0.4 },
        [RIGHT_EYE_CORNERS[0]]: { x: 0.42, y: 0.3 },
        [RIGHT_EYE_CORNERS[1]]: { x: 0.48, y: 0.3 },
        [LEFT_EYE_CORNERS[0]]: { x: 0.58, y: 0.3 },
        [LEFT_EYE_CORNERS[1]]: { x: 0.52, y: 0.3 },
      }),
      1000,
      1000,
    );
    // Face width 200px: eye centres 50px either side, 100px down; each
    // eye 60px corner to corner.
    expect(anchor!.rightEye.x).toBeCloseTo(-0.25);
    expect(anchor!.rightEye.y).toBeCloseTo(0.5);
    expect(anchor!.leftEye.x).toBeCloseTo(0.25);
    expect(anchor!.leftEye.y).toBeCloseTo(0.5);
    expect(anchor!.eyeSize).toBeCloseTo(0.3);
  });

  it("returns null for an incomplete mesh", () => {
    expect(computeFaceAnchor([{ x: 0, y: 0 }], 100, 100)).toBeNull();
  });
});

describe("computeShoulders", () => {
  function pose(
    left: { x: number; y: number; visibility?: number },
    right: { x: number; y: number; visibility?: number },
  ) {
    const mesh = Array.from({ length: 33 }, () => ({ x: 0, y: 0 }));
    mesh[POSE_LEFT_SHOULDER] = left;
    mesh[POSE_RIGHT_SHOULDER] = right;
    return mesh;
  }

  it("returns both shoulders in pixels, image-left first", () => {
    // The subject's left shoulder appears on the image right.
    const shoulders = computeShoulders(
      pose({ x: 0.7, y: 0.8, visibility: 0.9 }, { x: 0.3, y: 0.8, visibility: 0.9 }),
      1000,
      500,
    );
    expect(shoulders!.near).toEqual({ x: 300, y: 400 });
    expect(shoulders!.far).toEqual({ x: 700, y: 400 });
  });

  it("gives up when a shoulder is out of frame or hidden", () => {
    expect(
      computeShoulders(
        pose({ x: 0.7, y: 0.95, visibility: 0.2 }, { x: 0.3, y: 0.8, visibility: 0.9 }),
        1000,
        500,
      ),
    ).toBeNull();
  });
});

describe("toFaceSpace", () => {
  const anchor = {
    x: 500,
    y: 100,
    angle: 0,
    width: 200,
    eyeY: 0.5,
    chinY: 1.2,
    rightEye: { x: -0.2, y: 0.5 },
    leftEye: { x: 0.2, y: 0.5 },
    eyeSize: 0.2,
  };

  it("measures from the forehead in face widths", () => {
    const point = toFaceSpace({ x: 750, y: 500 }, anchor);
    expect(point.x).toBeCloseTo(1.25);
    expect(point.y).toBeCloseTo(2);
  });

  it("turns with the head", () => {
    // Head rolled 90°: the face's "down" is image left.
    const point = toFaceSpace({ x: 300, y: 100 }, { ...anchor, angle: Math.PI / 2 });
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(1);
  });
});

describe("smoothAnchor", () => {
  const eyes = {
    eyeY: 0.5,
    chinY: 1.2,
    rightEye: { x: -0.2, y: 0.5 },
    leftEye: { x: 0.2, y: 0.5 },
    eyeSize: 0.2,
  };
  const base = { x: 0, y: 0, angle: 0, width: 100, ...eyes };

  it("passes the first reading straight through", () => {
    expect(smoothAnchor(null, base)).toEqual(base);
  });

  it("moves part of the way toward the new reading", () => {
    const next = { x: 10, y: 20, angle: 0.2, width: 200, ...eyes };
    const smoothed = smoothAnchor(base, next, 0.5);
    expect(smoothed.x).toBeCloseTo(5);
    expect(smoothed.y).toBeCloseTo(10);
    expect(smoothed.angle).toBeCloseTo(0.1);
    expect(smoothed.width).toBeCloseTo(150);
  });

  it("turns the short way across ±π", () => {
    const smoothed = smoothAnchor(
      { ...base, angle: Math.PI - 0.1 },
      { ...base, angle: -Math.PI + 0.1 },
      0.5,
    );
    expect(Math.abs(Math.cos(smoothed.angle) + 1)).toBeLessThan(1e-6);
  });
});
