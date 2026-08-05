import { describe, it, expect } from "vitest";
import { clampOffset, coverScale, cropRect } from "@/lib/avatar/crop-geometry";

const STAGE = 264;
// A landscape photo: 264/600 cover scale, so at zoom 1 the circle shows a
// full-height, horizontally-centred square.
const LANDSCAPE = { width: 1000, height: 600 };

describe("avatar crop geometry", () => {
  it("covers the circle from the SHORT edge", () => {
    expect(coverScale(LANDSCAPE, STAGE)).toBeCloseTo(0.44);
    expect(coverScale({ width: 600, height: 1000 }, STAGE)).toBeCloseTo(0.44);
  });

  it("frames the centred square at zoom 1", () => {
    const scale = coverScale(LANDSCAPE, STAGE);
    const { sx, sy, side } = cropRect({ x: 0, y: 0 }, LANDSCAPE, scale, STAGE);

    // The whole height, centred horizontally: x 200..800 of 1000.
    expect(side).toBeCloseTo(600);
    expect(sx).toBeCloseTo(200);
    expect(sy).toBeCloseTo(0);
  });

  it("panning right reveals what is further left in the source", () => {
    const scale = coverScale(LANDSCAPE, STAGE);
    // Drag to the right edge of travel: (1000*0.44 - 264)/2 = 88.
    const offset = clampOffset({ x: 999, y: 0 }, LANDSCAPE, scale, STAGE);
    expect(offset.x).toBeCloseTo(88);

    const { sx, side } = cropRect(offset, LANDSCAPE, scale, STAGE);
    expect(sx).toBeCloseTo(0);
    expect(sx + side).toBeCloseTo(600);
  });

  it("never lets the crop leave the image (either direction, any zoom)", () => {
    for (const zoom of [1, 1.5, 2.75, 4]) {
      const scale = coverScale(LANDSCAPE, STAGE) * zoom;
      for (const raw of [
        { x: -9999, y: -9999 },
        { x: 9999, y: 9999 },
        { x: 40, y: -20 },
      ]) {
        const offset = clampOffset(raw, LANDSCAPE, scale, STAGE);
        const { sx, sy, side } = cropRect(offset, LANDSCAPE, scale, STAGE);
        expect(sx).toBeGreaterThanOrEqual(-0.001);
        expect(sy).toBeGreaterThanOrEqual(-0.001);
        expect(sx + side).toBeLessThanOrEqual(LANDSCAPE.width + 0.001);
        expect(sy + side).toBeLessThanOrEqual(LANDSCAPE.height + 0.001);
      }
    }
  });

  it("zooming in shrinks the framed region around the same point", () => {
    const base = coverScale(LANDSCAPE, STAGE);
    const at1 = cropRect({ x: 0, y: 0 }, LANDSCAPE, base, STAGE);
    const at2 = cropRect({ x: 0, y: 0 }, LANDSCAPE, base * 2, STAGE);

    expect(at2.side).toBeCloseTo(at1.side / 2);
    // Same centre, half the span.
    expect(at2.sx + at2.side / 2).toBeCloseTo(at1.sx + at1.side / 2);
    expect(at2.sy + at2.side / 2).toBeCloseTo(at1.sy + at1.side / 2);
  });

  it("a square source at zoom 1 is a no-op crop", () => {
    const square = { width: 800, height: 800 };
    const scale = coverScale(square, STAGE);
    const { sx, sy, side } = cropRect({ x: 0, y: 0 }, square, scale, STAGE);
    expect(sx).toBeCloseTo(0);
    expect(sy).toBeCloseTo(0);
    expect(side).toBeCloseTo(800);
  });
});
