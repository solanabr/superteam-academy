import type { NextRequest } from "next/server";
import { achievementMetadataResponse } from "@/lib/metadata/serve";

/**
 * Achievement type metadata, query form (`?id=<achievementId>`). The URIs
 * written on-chain use the path form (`./[id]`); this one answers the older
 * query-string URIs already in content.
 */
export function GET(request: NextRequest) {
  return achievementMetadataResponse(request.nextUrl.searchParams.get("id"));
}
