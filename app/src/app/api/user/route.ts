import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** GET: return user by wallet. POST: create or return user by wallet (call after connect). */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        role: true,
        profile: true,
        referralCode: true,
        _count: { select: { referrals: true } },
      },
    });
    if (!user) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json({
      ...user,
      referralsCount: user._count.referrals,
    });
  } catch (e: any) {
    console.error("GET /api/user error:", e?.message ?? e);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  let body: { wallet: string; email?: string; referrerCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { wallet, email, referrerCode } = body;
  if (!wallet || typeof wallet !== "string") {
    return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
  }

  try {
    // Check if user exists first to only apply referrer on creation
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress: wallet },
    });

    let referrerId: string | undefined;
    if (!existingUser && referrerCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referrerCode },
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    const user = await prisma.user.upsert({
      where: { walletAddress: wallet },
      create: {
        walletAddress: wallet,
        email: email ?? null,
        referrerId: referrerId,
        profile: {
          image: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${wallet}`,
          displayName: ""
        }
      },
      update: email !== undefined ? { email } : {},
      select: {
        id: true,
        walletAddress: true,
        email: true,
        role: true,
        profile: true,
        referralCode: true,
        _count: { select: { referrals: true } },
      },
    });

    return NextResponse.json({
      ...user,
      referralsCount: user._count.referrals,
    });
  } catch (e: any) {
    console.error("POST /api/user error:", e?.message ?? e);
    return NextResponse.json({ error: "Database connection failed" }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  let body: { wallet: string; email?: string; role?: string; profile?: any; preferences?: any };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { wallet, email, role, profile, preferences } = body;
  if (!wallet || typeof wallet !== "string") {
    return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
  }

  try {
    // Fetch existing user to merge JSON fields
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress: wallet },
      select: { profile: true, preferences: true }
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const mergedProfile = profile
      ? { ...(existingUser.profile as any), ...profile }
      : undefined;

    const mergedPreferences = preferences
      ? { ...(existingUser.preferences as any), ...preferences }
      : undefined;

    const user = await prisma.user.update({
      where: { walletAddress: wallet },
      data: {
        ...(email !== undefined ? { email } : {}),
        ...(role && ["student", "professor"].includes(role) ? { role } : {}),
        ...(mergedProfile !== undefined ? { profile: mergedProfile } : {}),
        ...(mergedPreferences !== undefined ? { preferences: mergedPreferences } : {}),
      },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        role: true,
        profile: true,
        preferences: true,
      }
    });
    return NextResponse.json(user);
  } catch (e: any) {
    console.error("PUT /api/user error:", e?.message ?? e);
    return NextResponse.json({ error: "User not found or update failed" }, { status: 404 });
  }
}
