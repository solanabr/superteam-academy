import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

interface CachedLeaderboard {
  data: { wallet: string; xp: number; rank: number }[];
  timestamp: number;
}

let cache: CachedLeaderboard | null = null;
const TTL = 5 * 60 * 1000; // 5 min

function getXpMint(): PublicKey {
  return new PublicKey(
    process.env.NEXT_PUBLIC_XP_MINT || "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3"
  );
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < TTL) {
      return NextResponse.json(cache.data);
    }

    const heliusUrl = process.env.NEXT_PUBLIC_HELIUS_URL || "https://api.devnet.solana.com";
    const xpMint = getXpMint();

    // Use getTokenAccounts via Helius DAS
    const res = await fetch(heliusUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "leaderboard",
        method: "getTokenAccounts",
        params: {
          mint: xpMint.toBase58(),
          limit: 100,
          options: { showZeroBalance: false },
        },
      }),
    });

    const json = await res.json();
    const accounts = json.result?.token_accounts ?? [];

    // Map and sort
    const entries = accounts
      .map((acc: { owner: string; amount: number }) => ({
        wallet: acc.owner,
        xp: Number(acc.amount),
      }))
      .sort((a: { xp: number }, b: { xp: number }) => b.xp - a.xp)
      .map((entry: { wallet: string; xp: number }, i: number) => ({
        ...entry,
        rank: i + 1,
      }));

    cache = { data: entries, timestamp: Date.now() };
    return NextResponse.json(entries);
  } catch (err) {
    console.error("leaderboard error:", err);

    // Fallback: use getProgramAccounts if Helius DAS not available
    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_HELIUS_URL || "https://api.devnet.solana.com"
      );
      const xpMint = getXpMint();
      const accounts = await connection.getProgramAccounts(TOKEN_2022, {
        filters: [
          { dataSize: 165 },
          { memcmp: { offset: 0, bytes: xpMint.toBase58() } },
        ],
      });

      // Parse token account data (simplified)
      const entries = accounts
        .map((acc) => {
          const data = acc.account.data;
          const owner = new PublicKey(data.slice(32, 64)).toBase58();
          const amount = data.readBigUInt64LE(64);
          return { wallet: owner, xp: Number(amount) };
        })
        .filter((e) => e.xp > 0)
        .sort((a, b) => b.xp - a.xp)
        .map((entry, i) => ({ ...entry, rank: i + 1 }));

      cache = { data: entries, timestamp: Date.now() };
      return NextResponse.json(entries);
    } catch {
      return NextResponse.json([], { status: 200 });
    }
  }
}
