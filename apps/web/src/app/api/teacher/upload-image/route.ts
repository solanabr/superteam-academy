import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { authorizeTeacher } from "@/lib/teacher/authorize";
import { isRateLimited } from "@/lib/rate-limit";
import { uploadTeacherImage } from "@/lib/sanity/teacher-mutations";

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

/**
 * POST /api/teacher/upload-image — upload a lesson-content image to Sanity and
 * return its CDN URL for insertion as Markdown. Multipart form field: `file`.
 *
 * Auth: authenticated + role in (teacher, admin). Rate-limited per user. The
 * privileged Sanity write happens server-side (`uploadTeacherImage`); the client
 * never sees the admin token.
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

  // Reject oversized bodies before buffering them into memory.
  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES + 4096) {
    return NextResponse.json({ error: "Image exceeds 4 MB" }, { status: 413 });
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported image type (PNG, JPEG, WebP, or GIF only)" },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image exceeds 4 MB" }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // Re-check the real byte length (the declared Content-Length can lie).
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image exceeds 4 MB" },
        { status: 413 }
      );
    }
    const { url } = await uploadTeacherImage(
      buffer,
      file.name || "image",
      file.type
    );
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[teacher/upload-image] upload failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
