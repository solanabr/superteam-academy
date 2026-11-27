import type { NextRequest } from "next/server";
import { isEventAchievementId } from "@/lib/events/events";
import { eventBadgeImage } from "@/lib/events/badge-image";
import { getEventByAchievementId } from "@/lib/events/queries";

/** GET /api/events/image/:achievementId — the event's generated default badge. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = isEventAchievementId(id)
    ? await getEventByAchievementId(id)
    : null;
  if (!event) return new Response("Not found", { status: 404 });
  return eventBadgeImage(event);
}
