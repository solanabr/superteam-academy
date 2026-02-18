import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getAuthenticatedUser } from "@/lib/server/auth-adapter";
import {
  invalidateEnrollmentCache,
  fetchEnrollment,
} from "@/lib/server/academy-program";

type RefreshBody = { slug?: string };

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as RefreshBody;
  const slug = body.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const userPubkey = new PublicKey(user.walletAddress);

  // Clear the stale cache entry so fetchEnrollment does a fresh RPC call
  invalidateEnrollmentCache(userPubkey, slug);

  let enrollment: { lessonsCompleted: number } | null = null;
  try {
    enrollment = await fetchEnrollment(userPubkey, slug);
  } catch {
    // RPC error — return unknown state
  }

  return NextResponse.json({
    enrolled: Boolean(enrollment),
    lessonsCompleted: enrollment ? Number(enrollment.lessonsCompleted) : 0,
  });
}
