import "server-only";

import { NextResponse } from "next/server";
import { achievementsById, coursesById } from "@/lib/content/store";
import {
  achievementMetadata,
  courseCollectionMetadata,
  type NftMetadata,
} from "./nft-metadata";
import { siteOrigin } from "./site-origin";

// The JSON only changes with a content release, which ships as a new
// deployment, and Vercel drops the CDN cache on every deployment. So the CDN
// can hold it for a week. `CDN-Cache-Control` mirrors it because Vercel strips
// `s-maxage` from the header it forwards. Wallets and the explorer read these
// from the browser, hence the open CORS header.
const FOUND_HEADERS = {
  "Cache-Control":
    "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400",
  "CDN-Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
  "Access-Control-Allow-Origin": "*",
};

const NOT_FOUND_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=300",
  "CDN-Cache-Control": "public, s-maxage=300",
  "Access-Control-Allow-Origin": "*",
};

function found(body: NftMetadata): NextResponse {
  return NextResponse.json(body, { headers: FOUND_HEADERS });
}

function notFound(): NextResponse {
  return NextResponse.json(
    { error: "Metadata not found" },
    { status: 404, headers: NOT_FOUND_HEADERS }
  );
}

/** Achievement type metadata by content `_id`; 404 for an id not in the bundle. */
export function achievementMetadataResponse(
  achievementId: string | null
): NextResponse {
  const doc = achievementId ? achievementsById.get(achievementId) : undefined;
  return doc ? found(achievementMetadata(doc, siteOrigin())) : notFound();
}

/** Course credential collection metadata; 404 for a course not in the bundle. */
export function courseCollectionMetadataResponse(
  courseId: string | null
): NextResponse {
  const doc = courseId ? coursesById.get(courseId) : undefined;
  return doc ? found(courseCollectionMetadata(doc, siteOrigin())) : notFound();
}
