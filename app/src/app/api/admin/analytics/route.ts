import { NextRequest, NextResponse } from "next/server";
import { resolveUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getAdminAnalytics } from "@/lib/admin-analytics";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
  return user?.isAdmin === true;
}

export async function GET(request: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "30d";

  if (!["7d", "30d", "90d", "all"].includes(range)) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const data = await getAdminAnalytics(range);
  return NextResponse.json(data);
}
