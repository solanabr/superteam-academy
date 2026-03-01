import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet param required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet },
    include: {
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { wallet, displayName, username, bio, avatar } = body as {
      wallet: string;
      displayName?: string;
      username?: string;
      bio?: string;
      avatar?: string;
    };

    if (!wallet) {
      return NextResponse.json({ error: "wallet required" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { walletAddress: wallet },
      update: {
        ...(displayName !== undefined && { displayName }),
        ...(username !== undefined && { username }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
      create: {
        walletAddress: wallet,
        displayName,
        username,
        bio,
        avatar,
      },
    });

    return NextResponse.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
