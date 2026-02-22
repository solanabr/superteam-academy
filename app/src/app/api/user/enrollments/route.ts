import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) return NextResponse.json([]);

  const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
      include: { enrollments: true }
  });

  return NextResponse.json(user?.enrollments || []);
}