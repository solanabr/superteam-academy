import { NextResponse, type NextRequest } from "next/server";
import { resolveUserId } from "@/lib/auth-utils";
import { NotificationService } from "@/lib/services/notification-service";

const service = new NotificationService();

export async function GET(request: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  const notifications = await service.getNotifications(userId, {
    limit,
    offset,
  });
  return NextResponse.json(notifications);
}

export async function PATCH(request: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (body.all === true) {
    await service.markAllRead(userId);
    return NextResponse.json({ success: true });
  }

  if (typeof body.id === "string") {
    await service.markRead(userId, body.id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}
