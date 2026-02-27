import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { isAdminRequest } from "@/lib/auth/admin";
import { connection } from "@/lib/solana/connection";
import { XP_MINT_ADDRESS, calculateLevel } from "@/lib/constants";

export interface AdminUser {
  wallet: string;
  xp: number;
  level: number;
  tokenAccount: string;
}

let cache: { data: AdminUser[]; ts: number } | null = null;
const CACHE_TTL = 60_000;

export async function GET(req: Request) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    if (!XP_MINT_ADDRESS) {
      return NextResponse.json([]);
    }

    const mint = new PublicKey(XP_MINT_ADDRESS);
    const largestAccounts = await connection.getTokenLargestAccounts(mint);

    const users: AdminUser[] = [];

    for (const account of largestAccounts.value) {
      if (account.uiAmount === null || account.uiAmount === 0) continue;

      // Resolve owner of token account
      const accountInfo = await connection.getParsedAccountInfo(
        account.address,
      );
      const data = accountInfo.value?.data;
      const parsed =
        typeof data === "object" && data !== null && "parsed" in data
          ? (data as { parsed: { info?: { owner?: string } } }).parsed
          : undefined;
      const owner = parsed?.info?.owner;
      if (!owner) continue;

      const xp = account.uiAmount;
      users.push({
        wallet: owner,
        xp,
        level: calculateLevel(xp),
        tokenAccount: account.address.toBase58(),
      });
    }

    users.sort((a, b) => b.xp - a.xp);

    cache = { data: users, ts: Date.now() };
    return NextResponse.json(users);
  } catch (err: unknown) {
    console.error("Admin users error:", err);
    return NextResponse.json([]);
  }
}
