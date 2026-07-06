/**
 * SECURITY — validation for the mediated teacher thumbnail upload (issue #278).
 *
 * Teachers have no Sanity login and the browser must never hold the Sanity write
 * token, so the image is POSTed to `/api/teacher/courses/[id]/thumbnail` and the
 * server streams it into Sanity on their behalf. These pure checks are the
 * request-side guard: only real images, and only up to a bounded size, may be
 * uploaded. The size check runs on the ACTUAL received bytes (not a
 * client-supplied Content-Length), so a lying header cannot smuggle a large file
 * through.
 *
 * Kept dependency-free (no Sanity / next-server imports) so the rules are unit
 * testable in isolation.
 */

/** Maximum accepted thumbnail size, in bytes (5 MB). */
export const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

/** Human-readable cap for user-facing messages. */
export const MAX_THUMBNAIL_MB = MAX_THUMBNAIL_BYTES / (1024 * 1024);

export type ThumbnailRejection =
  | { reason: "missing"; status: 400 }
  | { reason: "not-image"; status: 400 }
  | { reason: "too-large"; status: 413 };

export type ThumbnailValidation =
  | { ok: true; contentType: string; byteLength: number }
  | { ok: false; error: ThumbnailRejection };

/** True for a `image/<subtype>` content-type (the only kind Sanity should get). */
export function isImageContentType(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  // Strip any `; charset=…`/params and normalize before matching.
  const base = value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  return /^image\/[a-z0-9][a-z0-9.+-]*$/.test(base);
}

/** The normalized `image/<subtype>` (lowercased, params stripped). */
export function normalizeImageContentType(value: string): string {
  return value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

/**
 * Validate the uploaded bytes + declared content-type. Enforces image-only and
 * the size cap against the real byte length.
 */
export function validateThumbnail(
  contentType: string | null | undefined,
  byteLength: number
): ThumbnailValidation {
  if (byteLength <= 0) {
    return { ok: false, error: { reason: "missing", status: 400 } };
  }
  if (!isImageContentType(contentType)) {
    return { ok: false, error: { reason: "not-image", status: 400 } };
  }
  if (byteLength > MAX_THUMBNAIL_BYTES) {
    return { ok: false, error: { reason: "too-large", status: 413 } };
  }
  return {
    ok: true,
    contentType: normalizeImageContentType(contentType as string),
    byteLength,
  };
}

/** Map a rejection to a short, safe message for the response body. */
export function thumbnailRejectionMessage(rej: ThumbnailRejection): string {
  switch (rej.reason) {
    case "missing":
      return "No image was provided";
    case "not-image":
      return "File must be an image";
    case "too-large":
      return `Image must be at most ${MAX_THUMBNAIL_MB} MB`;
  }
}
