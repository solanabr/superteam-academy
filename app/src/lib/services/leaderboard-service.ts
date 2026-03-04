import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, wallets, xp_snapshots } from "@/lib/db/schema";
import type { LeaderboardQuery } from "@/lib/validators/leaderboard";
import { XP_MINT } from "@/lib/services/blockchain-service";

const helius_api_key = process.env.HELIUS_API_KEY;
const helius_das_url =
  process.env.HELIUS_DAS_URL ?? (helius_api_key ? `https://rpc.helius.xyz/?api-key=${helius_api_key}` : null);

export type LeaderboardEntry = {
  user_id: string;
  wallet_public_key: string;
  email: string | null;
  total_xp: number;
};

export async function get_leaderboard(
  query: LeaderboardQuery,
): Promise<{ entries: LeaderboardEntry[] }> {
  const { limit, offset, timeframe } = query;

  const now = new Date();
  let cutoff: Date | null = null;
  if (timeframe === "30d") cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (timeframe === "7d") cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (timeframe === "24h") cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const where_clause = cutoff ? gte(xp_snapshots.snapshot_at, cutoff) : undefined;

  const rows = await db
    .select({
      user_id: xp_snapshots.user_id,
      wallet_public_key: xp_snapshots.wallet_public_key,
      total_xp: xp_snapshots.total_xp,
      email: users.email,
    })
    .from(xp_snapshots)
    .innerJoin(users, eq(users.id, xp_snapshots.user_id))
    .innerJoin(wallets, eq(wallets.public_key, xp_snapshots.wallet_public_key))
    .where(where_clause)
    .orderBy(desc(xp_snapshots.total_xp), desc(xp_snapshots.snapshot_at))
    .limit(limit)
    .offset(offset);

  return { entries: rows };
}

export async function refresh_leaderboard_from_chain(): Promise<void> {
  if (!helius_das_url || !helius_api_key || !XP_MINT) return;

  type Holder = {
    owner: string;
    amount: string;
  };

  type DasResponse = {
    result?: {
      token_accounts?: Holder[];
    };
  };

  const body = {
    jsonrpc: "2.0",
    id: "xp-leaderboard",
    method: "getTokenAccounts",
    params: {
      mint: XP_MINT,
      page: 1,
      limit: 1000,
    },
  };

  const response = await fetch(helius_das_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return;
  }

  const json = (await response.json()) as DasResponse;
  const accounts = json.result?.token_accounts ?? [];
  const now = new Date();

  for (const account of accounts) {
    const wallet_public_key = account.owner;
    const raw_amount = Number(account.amount);
    const total_xp = Number.isFinite(raw_amount) ? raw_amount : 0;
    if (total_xp <= 0) continue;

    const [wallet_row] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.public_key, wallet_public_key))
      .limit(1);

    if (!wallet_row) continue;

    await db.insert(xp_snapshots).values({
      user_id: wallet_row.user_id,
      wallet_public_key,
      total_xp,
      snapshot_at: now,
    });
  }
}
