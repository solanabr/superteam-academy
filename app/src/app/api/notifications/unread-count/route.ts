import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/auth-utils";
import { NotificationService } from "@/lib/services/notification-service";

const service = new NotificationService();

export async function GET() {
  const userId = await resolveUserId();
  if (!userId) {
    // Return 0 (not 401) so the sidebar badge stays stable for unauthenticated users
    return NextResponse.json({ count: 0 });
  }

  const count = await service.getUnreadCount(userId);
  return NextResponse.json({ count });
}
