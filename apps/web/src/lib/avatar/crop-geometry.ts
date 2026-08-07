/**
 * Pure geometry for the avatar crop dialog. Extracted from the component so
 * the mapping from "what the circle shows" to "what gets encoded" is testable:
 * an error here produces a silently mis-framed avatar, which no type check or
 * render test would catch.
 *
 * Coordinate model: the stage is a circle of `stage` CSS px. The image is drawn
 * centred, scaled by `drawScale`, then translated by `offset`. A positive
 * offset.x moves the image right, so the circle reveals what is further LEFT.
 */

export interface Size {
  width: number;
  height: number;
}

export interface Offset {
  x: number;
  y: number;
}

export interface CropRect {
  sx: number;
  sy: number;
  side: number;
}

/** Scale at which the image exactly covers the circle (zoom 1). */
export function coverScale(image: Size, stage: number): number {
  return stage / Math.min(image.width, image.height);
}

/**
 * Clamp a pan offset so the image always covers the circle — no background
 * gap can be dragged into view at any zoom.
 */
export function clampOffset(
  offset: Offset,
  image: Size,
  drawScale: number,
  stage: number
): Offset {
  const maxX = Math.max(0, (image.width * drawScale - stage) / 2);
  const maxY = Math.max(0, (image.height * drawScale - stage) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

/**
 * The square of NATURAL image pixels currently framed by the circle — the
 * source rect for drawImage.
 */
export function cropRect(
  offset: Offset,
  image: Size,
  drawScale: number,
  stage: number
): CropRect {
  const side = stage / drawScale;
  return {
    side,
    sx: image.width / 2 - offset.x / drawScale - side / 2,
    sy: image.height / 2 - offset.y / drawScale - side / 2,
  };
}
