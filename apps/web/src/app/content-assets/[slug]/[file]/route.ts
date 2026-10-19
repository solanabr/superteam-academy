import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { CONTENT_BLOB_BASE_URL } from "@/lib/content/blob-store.mjs";
import { ASSET_EXT_ALLOWLIST } from "@/lib/content/compile/assets";
import { coursesBySlug } from "@/lib/content/store";

export const runtime = "nodejs";

/**
 * Course banners used to be static files at `/content-assets/<slug>/banner.*`,
 * and course pages published those urls as their `og:image`. Cards already
 * shared on social sites re-fetch them, so the old banner path now redirects
 * to the course's current thumbnail — the live one, so a later banner update
 * reaches old cards too. Every other old path (lesson figures were only ever
 * inlined in the bundle) is a 404.
 *
 * The middleware matcher skips image extensions, and this static segment
 * outranks `[locale]`, so nothing else answers these urls.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; file: string }> }
): Promise<NextResponse> {
  const { slug, file } = await params;
  const ext = file.startsWith("banner.") ? file.slice("banner.".length) : "";
  const thumbnail = coursesBySlug.get(slug)?.thumbnail;
  if (
    !ASSET_EXT_ALLOWLIST.has(ext) ||
    typeof thumbnail !== "string" ||
    !thumbnail.startsWith(`${CONTENT_BLOB_BASE_URL}/`)
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.redirect(thumbnail, {
    status: 308,
    // Short, so a re-rendered banner reaches crawlers within the hour.
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
