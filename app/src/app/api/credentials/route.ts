import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PrismaProgressService } from "@/lib/services/prisma-progress";
import { resolveUserId } from "@/lib/auth-utils";

const service = new PrismaProgressService();

export async function GET(request: Request) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json(
      { error: "Missing wallet parameter" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { wallet: true },
  });
  if (!user?.wallet || user.wallet !== wallet) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const credentials = await service.getCredentials(wallet);
  return NextResponse.json(credentials);
}
