import { Request, Response } from "express";
import { Connection, PublicKey } from "@solana/web3.js";
import { getConnection, getXpMint, TOKEN_2022 } from "../lib/config";

interface CachedLeaderboard {
  data: { wallet: string; xp: number; rank: number }[];
  timestamp: number;
}

let cache: CachedLeaderboard | null = null;
const TTL = 5 * 60 * 1000;

export async function leaderboardHandler(_req: Request, res: Response) {
  try {
    if (cache && Date.now() - cache.timestamp < TTL) {
      return res.json(cache.data);
    }

    const heliusUrl = process.env.HELIUS_URL || "https://api.devnet.solana.com";
    const xpMint = getXpMint();

    const response = await fetch(heliusUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "leaderboard",
        method: "getTokenAccounts",
        params: { mint: xpMint.toBase58(), limit: 100, options: { showZeroBalance: false } },
      }),
    });

    const json = await response.json();
    const accounts = json.result?.token_accounts ?? [];

    const entries = accounts
      .map((acc: { owner: string; amount: number }) => ({ wallet: acc.owner, xp: Number(acc.amount) }))
      .sort((a: { xp: number }, b: { xp: number }) => b.xp - a.xp)
      .map((entry: { wallet: string; xp: number }, i: number) => ({ ...entry, rank: i + 1 }));

    cache = { data: entries, timestamp: Date.now() };
    res.json(entries);
  } catch (err) {
    console.error("leaderboard error:", err);

    // Fallback: getProgramAccounts
    try {
      const connection = getConnection();
      const xpMint = getXpMint();
      const accounts = await connection.getProgramAccounts(TOKEN_2022, {
        filters: [{ dataSize: 165 }, { memcmp: { offset: 0, bytes: xpMint.toBase58() } }],
      });

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
      res.json(entries);
    } catch {
      res.json([]);
    }
  }
}
