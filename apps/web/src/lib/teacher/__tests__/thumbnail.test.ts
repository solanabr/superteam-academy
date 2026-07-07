import { describe, it, expect } from "vitest";
import {
  MAX_THUMBNAIL_BYTES,
  isImageContentType,
  normalizeImageContentType,
  validateThumbnail,
  thumbnailRejectionMessage,
} from "../thumbnail";

describe("isImageContentType", () => {
  it("accepts common raster image types", () => {
    for (const t of ["image/png", "image/jpeg", "image/webp", "image/gif"]) {
      expect(isImageContentType(t)).toBe(true);
    }
  });

  it("accepts an image type with charset params", () => {
    expect(isImageContentType("image/png; charset=utf-8")).toBe(true);
    expect(isImageContentType("IMAGE/PNG")).toBe(true);
  });

  it("rejects SVG, non-raster, non-image, and malformed types", () => {
    for (const t of [
      "image/svg+xml", // can carry inline <script> — stored-XSS risk
      "image/bmp", // valid image, but not in the raster allowlist
      "application/pdf",
      "text/html",
      "application/octet-stream",
      "imagexpng",
      "image/",
      "",
      null,
      undefined,
    ]) {
      expect(isImageContentType(t)).toBe(false);
    }
  });
});

describe("normalizeImageContentType", () => {
  it("lowercases and strips params", () => {
    expect(normalizeImageContentType("Image/PNG; charset=utf-8")).toBe(
      "image/png"
    );
  });
});

describe("validateThumbnail", () => {
  it("rejects empty bytes as missing (400)", () => {
    const r = validateThumbnail("image/png", 0);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toEqual({ reason: "missing", status: 400 });
  });

  it("rejects non-image content-type (400)", () => {
    const r = validateThumbnail("application/pdf", 100);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toEqual({ reason: "not-image", status: 400 });
  });

  it("rejects oversized bytes (413) using the real length", () => {
    const r = validateThumbnail("image/png", MAX_THUMBNAIL_BYTES + 1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toEqual({ reason: "too-large", status: 413 });
  });

  it("accepts an image exactly at the cap and normalizes the type", () => {
    const r = validateThumbnail("Image/JPEG", MAX_THUMBNAIL_BYTES);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.contentType).toBe("image/jpeg");
      expect(r.byteLength).toBe(MAX_THUMBNAIL_BYTES);
    }
  });
});

describe("thumbnailRejectionMessage", () => {
  it("maps each rejection to a safe message", () => {
    expect(thumbnailRejectionMessage({ reason: "missing", status: 400 })).toBe(
      "No image was provided"
    );
    expect(
      thumbnailRejectionMessage({ reason: "not-image", status: 400 })
    ).toBe("File must be an image");
    expect(
      thumbnailRejectionMessage({ reason: "too-large", status: 413 })
    ).toContain("MB");
  });
});
