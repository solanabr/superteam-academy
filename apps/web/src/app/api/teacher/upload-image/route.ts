import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { authorizeTeacher } from "@/lib/teacher/authorize";
import { isRateLimited } from "@/lib/rate-limit";
import { uploadTeacherImage } from "@/lib/sanity/teacher-mutations";
import { fetchRemoteImage, RemoteImageError } from "@/lib/teacher/remote-image";

// Reads the caller's session + streams a file upload — never statically
// prerender (DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB (stays under Vercel's ~4.5 MB request-body cap)
// SVG is deliberately excluded — it can carry scripts (stored-XSS if ever
// rendered inline). Only raster formats the lesson renderer needs.
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

interface Resolved {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

/**
 * POST /api/teacher/upload-image — add a lesson-content image to Sanity and
 * return its CDN URL for Markdown insertion. Two request shapes:
 *   - multipart/form-data with a `file` field (upload from computer)
 *   - application/json `{ "url": "https://…" }` (import by URL)
 *
 * Both paths store the image in Sanity so the resulting `cdn.sanity.io` URL is
 * allowlisted by the lesson renderer's CSP (a raw foreign URL would be blocked)
 * and no longer depends on the source host staying up.
 *
 * Auth: authenticated + role in (teacher, admin). Rate-limited per user. The
 * privileged Sanity write happens server-side; the client never sees the token.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await authorizeTeacher();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: auth.status }
    );
  }

  const limited = await isRateLimited(
    "teacher-image-upload",
    auth.caller.userId,
    { maxTokens: 30, refillIntervalMs: 10 * 60 * 1000 }
  );
  if (limited) {
    return NextResponse.json(
      { error: "Too many uploads. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  const resolved = contentType.includes("application/json")
    ? await resolveFromUrl(req)
    : await resolveFromFile(req);

  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status }
    );
  }

  try {
    const { url } = await uploadTeacherImage(
      resolved.buffer,
      resolved.filename,
      resolved.contentType
    );
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[teacher/upload-image] Sanity upload failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

/** Multipart `file` upload from the user's computer. */
async function resolveFromFile(
  req: NextRequest
): Promise<Resolved | { error: string; status: number }> {
  // Reject oversized bodies before buffering them into memory.
  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES + 4096) {
    return { error: "Image exceeds 4 MB", status: 413 };
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return { error: "Invalid form data", status: 400 };
  }

  if (!file) return { error: "No file provided", status: 400 };
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      error: "Unsupported image type (PNG, JPEG, WebP, or GIF only)",
      status: 415,
    };
  }
  if (file.size > MAX_BYTES)
    return { error: "Image exceeds 4 MB", status: 413 };

  const buffer = Buffer.from(await file.arrayBuffer());
  // Re-check the real byte length (the declared Content-Length can lie).
  if (buffer.byteLength > MAX_BYTES) {
    return { error: "Image exceeds 4 MB", status: 413 };
  }
  return { buffer, filename: file.name || "image", contentType: file.type };
}

/** Import by URL — fetched server-side (SSRF-guarded) and pinned into Sanity. */
async function resolveFromUrl(
  req: NextRequest
): Promise<Resolved | { error: string; status: number }> {
  let rawUrl = "";
  try {
    const body = (await req.json()) as { url?: unknown };
    if (typeof body.url === "string") rawUrl = body.url.trim();
  } catch {
    return { error: "Invalid JSON body", status: 400 };
  }
  if (!rawUrl) return { error: "Image URL is required", status: 400 };

  try {
    const img = await fetchRemoteImage(rawUrl, {
      maxBytes: MAX_BYTES,
      allowedTypes: ALLOWED_TYPES,
    });
    return {
      buffer: img.buffer,
      filename: img.filename,
      contentType: img.contentType,
    };
  } catch (err) {
    if (err instanceof RemoteImageError) {
      const messages: Record<string, string> = {
        invalid_url: "Enter a valid image URL",
        not_https: "The image URL must start with https://",
        blocked_host: "That image host isn't allowed",
        bad_type: "The URL must point to a PNG, JPEG, WebP, or GIF image",
        too_large: "Image exceeds 4 MB",
        fetch_failed: "Couldn't fetch that image URL",
      };
      return {
        error: messages[err.reason] ?? "Couldn't fetch that image URL",
        status: 400,
      };
    }
    console.error("[teacher/upload-image] URL import failed:", err);
    return { error: "Couldn't fetch that image URL", status: 400 };
  }
}
