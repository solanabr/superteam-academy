import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { ensureUser } from "@/lib/db/helpers";
import { fetchConfig, fetchXPBalance } from "@/lib/solana/readers";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json(0);

  // Try on-chain first
  try {
    const config = await fetchConfig();
    if (config) {
      const wallet = new PublicKey(userId);
      const balance = await fetchXPBalance(wallet, config.xpMint);
      if (balance > 0) return NextResponse.json(balance);
    }
  } catch {
    // fallback to MongoDB
  }

  const user = await ensureUser(userId);
  return NextResponse.json(user.xp);
}
