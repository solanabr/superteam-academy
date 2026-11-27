import { NextResponse, type NextRequest } from "next/server";
import { isEventAchievementId } from "@/lib/events/events";
import { eventImageUrl } from "@/lib/events/images";
import { getEventByAchievementId } from "@/lib/events/queries";
import { eventMetadata } from "@/lib/metadata/nft-metadata";
import { siteOrigin } from "@/lib/metadata/site-origin";

// Wallets and indexers read this URI, which is baked into every event NFT. It
// comes from the database, not the bundle, so an admin's edit to the
// description or artwork shows within minutes rather than after a week of CDN.
const HEADERS = {
  "Cache-Control": "public, max-age=300, s-maxage=300",
  "Access-Control-Allow-Origin": "*",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = isEventAchievementId(id)
    ? await getEventByAchievementId(id)
    : null;
  if (!event) {
    return NextResponse.json(
      { error: "Metadata not found" },
      { status: 404, headers: HEADERS }
    );
  }

  const origin = siteOrigin();
  return NextResponse.json(
    eventMetadata(event, eventImageUrl(event, origin), origin),
    { headers: HEADERS }
  );
}
