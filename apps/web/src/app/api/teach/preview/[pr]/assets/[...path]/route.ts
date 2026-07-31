import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requirePreviewAuth,
  previewUnauthorizedResponse,
  TeachPreviewAuthError,
} from "@/lib/teach/preview-auth";
import { parsePrSegment } from "@/lib/teach/preview-guard";
import { getPreviewBundle } from "@/lib/teach/preview-store";

// Reads the in-memory compiled bundle; never statically rendered.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Content types for the formats the asset pipeline accepts. Deliberately a
 * closed map rather than a lookup library: anything the compiler did not
 * recognise as an asset can never reach this route, and an unknown extension
 * falling back to `application/octet-stream` is the safe default (the browser
 * downloads it rather than executing it).
 */
const CONTENT_TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
};

function contentTypeFor(path: string): string {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  return CONTENT_TYPE[ext] ?? "application/octet-stream";
}

/**
 * Serves a previewed PR's images (#923).
 *
 * The compiler rewrites every image reference to a public path, but those files
 * only exist on disk for the PUBLISHED bundle — a previewed PR's assets live
 * solely in the compiled-in-memory bundle, so without this route every image in
 * a preview rendered broken.
 *
 * Path traversal is impossible by construction: the requested path is used as a
 * KEY into the compiler-generated asset map, never as a filesystem path. A key
 * that is not present is simply a 404.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pr: string; path: string[] }> }
): Promise<NextResponse> {
  try {
    requirePreviewAuth(req);
  } catch (e) {
    if (e instanceof TeachPreviewAuthError)
      return previewUnauthorizedResponse();
    throw e;
  }

  const { pr, path } = await params;
  const prNumber = parsePrSegment(pr);
  if (prNumber === null) {
    return NextResponse.json({ error: "Invalid PR" }, { status: 400 });
  }

  const key = path.map((seg) => decodeURIComponent(seg)).join("/");

  let bytes: Uint8Array | undefined;
  try {
    const bundle = await getPreviewBundle(prNumber);
    bytes = bundle.assets.get(key);
  } catch {
    // A failed compile is already surfaced by the preview page itself; an image
    // request must not repeat that noise.
    return NextResponse.json({ error: "Preview unavailable" }, { status: 502 });
  }

  if (!bytes) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": contentTypeFor(key),
      "Content-Length": String(bytes.byteLength),
      // Private: the bytes are unpublished course content behind a session
      // cookie, so no shared cache may hold them. Short-lived because a pushed
      // commit changes the bundle under the same URL.
      "Cache-Control": "private, max-age=60",
      // Defence in depth for authored SVGs, which can carry script.
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
