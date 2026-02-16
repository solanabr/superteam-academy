import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** GET: return user by wallet. POST: create or return user by wallet (call after connect). */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet },
    select: { id: true, walletAddress: true, email: true },
  });
  if (!user) {
    return NextResponse.json(null, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function POST(request: NextRequest) {
  let body: { wallet: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { wallet, email } = body;
  if (!wallet || typeof wallet !== "string") {
    return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
  }
  const user = await prisma.user.upsert({
    where: { walletAddress: wallet },
    create: { walletAddress: wallet, email: email ?? null },
    update: email !== undefined ? { email } : {},
    select: { id: true, walletAddress: true, email: true },
  });
  return NextResponse.json(user);
}
