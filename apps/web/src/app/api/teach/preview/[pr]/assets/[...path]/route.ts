import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  IMAGE_CONTENT_TYPES,
  MAX_ASSET_BYTES,
  imageExt,
  isPlainRepoPath,
} from "@/lib/content/compile/assets";
import {
  requirePreviewAuth,
  previewUnauthorizedResponse,
  TeachPreviewAuthError,
} from "@/lib/teach/preview-auth";
import { fetchContentFile } from "@/lib/teach/preview-compile";
import { parsePrSegment } from "@/lib/teach/preview-guard";
import {
  getPreviewBundle,
  type PreviewBundle,
} from "@/lib/teach/preview-store";

// Reads the in-memory compiled bundle; never statically rendered.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notFound = (): NextResponse =>
  NextResponse.json({ error: "Not found" }, { status: 404 });

/**
 * Serves a previewed PR's images (#923).
 *
 * A PR's images are not in blob storage until a lock bump ships them, so the
 * compiled preview points every image at this route, keyed by repo path. The
 * route fetches that one file from GitHub at the PR's head commit.
 *
 * It is a proxy, so it only proxies what the compile itself saw: the path must
 * be one of the compiled bundle's own image paths (never a free-form path,
 * never `..`), the repo and host are fixed in `fetchContentFile`, the content
 * type comes from a closed extension map (the upstream's is ignored), and the
 * body is capped at the compiler's per-image limit.
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

  let key: string;
  try {
    key = path.map((seg) => decodeURIComponent(seg)).join("/");
  } catch {
    return notFound(); // malformed percent-encoding
  }
  const contentType = IMAGE_CONTENT_TYPES.get(imageExt(key));
  if (!isPlainRepoPath(key) || !contentType) return notFound();

  let bundle: PreviewBundle;
  try {
    bundle = await getPreviewBundle(prNumber);
  } catch {
    // A failed compile is already surfaced by the preview page itself; an image
    // request must not repeat that noise.
    return NextResponse.json({ error: "Preview unavailable" }, { status: 502 });
  }
  if (!bundle.imagePaths.has(key)) return notFound();

  let bytes: Uint8Array;
  try {
    bytes = await fetchContentFile(bundle.head.sha, key, MAX_ASSET_BYTES);
  } catch {
    return NextResponse.json({ error: "Image unavailable" }, { status: 502 });
  }

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": contentType,
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
