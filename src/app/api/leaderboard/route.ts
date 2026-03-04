import { NextRequest, NextResponse } from "next/server";
import type { Connection, ParsedAccountData, PublicKey } from "@solana/web3.js";
import { getConnection, XP_MINT } from "@/lib/anchor";
import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardResponse } from "@/types";

export const dynamic = "force-dynamic";

const WINDOW_DAYS: Record<Exclude<LeaderboardPeriod, "all-time">, number> = {
  weekly: 7,
  monthly: 30,
};

const MAX_SIGNATURE_SCAN = 1200;
const SIGNATURE_PAGE_SIZE = 100;
const TX_BATCH_SIZE = 20;

function parsePeriod(value: string | null): LeaderboardPeriod {
  if (value === "weekly" || value === "monthly" || value === "all-time") {
    return value;
  }
  return "all-time";
}

function shortWallet(wallet: string): string {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function toNumberSafe(value: bigint): number {
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  return Number(value > max ? max : value);
}

function toBigInt(value: string | number | bigint | undefined | null): bigint {
  if (value === null || value === undefined) return BigInt(0);
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.max(0, Math.floor(value)));
  try {
    return BigInt(value);
  } catch {
    return BigInt(0);
  }
}

function buildEntries(
  balances: Map<string, bigint>,
  limit: number,
): LeaderboardEntry[] {
  return Array.from(balances.entries())
    .filter(([, amount]) => amount > BigInt(0))
    .sort((a, b) => (a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0))
    .slice(0, limit)
    .map(([wallet, amount], idx) => {
      const xp = toNumberSafe(amount);
      return {
        rank: idx + 1,
        wallet,
        walletShort: shortWallet(wallet),
        xp,
        level: Math.floor(Math.sqrt(xp / 100)),
        isCurrentUser: false,
      };
    });
}

async function getOwner(
  connection: Connection,
  account: PublicKey,
): Promise<string | null> {
  const info = await connection.getParsedAccountInfo(account, "confirmed");
  const data = info.value?.data;

  if (!data || typeof data !== "object" || !("parsed" in data)) return null;

  const parsed = data as ParsedAccountData;
  const owner = parsed.parsed?.info?.owner;
  return typeof owner === "string" ? owner : null;
}

async function buildAllTimeBalances(
  connection: Connection,
  limit: number,
): Promise<Map<string, bigint>> {
  const largest = await connection.getTokenLargestAccounts(XP_MINT);
  const nonZero = largest.value.filter((item) => toBigInt(item.amount) > BigInt(0));
  const candidateAccounts = nonZero.slice(0, Math.max(limit * 3, 30));

  const ownerPairs = await Promise.all(
    candidateAccounts.map(async (entry) => {
      const owner = await getOwner(connection, entry.address);
      return owner ? { owner, amount: toBigInt(entry.amount) } : null;
    }),
  );

  const byWallet = new Map<string, bigint>();
  for (const pair of ownerPairs) {
    if (!pair) continue;
    byWallet.set(pair.owner, (byWallet.get(pair.owner) ?? BigInt(0)) + pair.amount);
  }

  return byWallet;
}

async function collectWindowSignatures(
  connection: Connection,
  sinceUnix: number,
): Promise<string[]> {
  const signatures: string[] = [];
  let before: string | undefined;
  let shouldStop = false;

  while (!shouldStop && signatures.length < MAX_SIGNATURE_SCAN) {
    const page = await connection.getSignaturesForAddress(
      XP_MINT,
      {
        before,
        limit: SIGNATURE_PAGE_SIZE,
      },
      "confirmed",
    );

    if (page.length === 0) break;

    for (const info of page) {
      if (typeof info.blockTime === "number" && info.blockTime < sinceUnix) {
        shouldStop = true;
        break;
      }
      if (!info.err) signatures.push(info.signature);
      if (signatures.length >= MAX_SIGNATURE_SCAN) {
        shouldStop = true;
        break;
      }
    }

    before = page[page.length - 1]?.signature;
  }

  return signatures;
}

async function buildWindowBalances(
  connection: Connection,
  sinceUnix: number,
): Promise<Map<string, bigint>> {
  const mint = XP_MINT.toBase58();
  const signatures = await collectWindowSignatures(connection, sinceUnix);
  const byWallet = new Map<string, bigint>();

  for (let i = 0; i < signatures.length; i += TX_BATCH_SIZE) {
    const batch = signatures.slice(i, i + TX_BATCH_SIZE);
    const txs = await Promise.all(
      batch.map((signature) =>
        connection.getTransaction(signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        }),
      ),
    );

    for (const tx of txs) {
      if (!tx?.meta) continue;
      const blockTime = tx.blockTime ?? 0;
      if (blockTime < sinceUnix) continue;

      const pre = tx.meta.preTokenBalances ?? [];
      const post = tx.meta.postTokenBalances ?? [];
      const byIndex = new Map<number, { pre: bigint; post: bigint; owner: string | null }>();

      for (const balance of pre) {
        if (balance.mint !== mint) continue;
        const existing = byIndex.get(balance.accountIndex) ?? {
          pre: BigInt(0),
          post: BigInt(0),
          owner: null,
        };
        byIndex.set(balance.accountIndex, {
          pre: toBigInt(balance.uiTokenAmount?.amount),
          post: existing.post,
          owner: balance.owner ?? existing.owner,
        });
      }

      for (const balance of post) {
        if (balance.mint !== mint) continue;
        const existing = byIndex.get(balance.accountIndex) ?? {
          pre: BigInt(0),
          post: BigInt(0),
          owner: null,
        };
        byIndex.set(balance.accountIndex, {
          pre: existing.pre,
          post: toBigInt(balance.uiTokenAmount?.amount),
          owner: balance.owner ?? existing.owner,
        });
      }

      for (const { pre: preAmount, post: postAmount, owner } of byIndex.values()) {
        if (!owner) continue;
        const delta = postAmount - preAmount;
        if (delta <= BigInt(0)) continue;
        byWallet.set(owner, (byWallet.get(owner) ?? BigInt(0)) + delta);
      }
    }
  }

  return byWallet;
}

export async function GET(req: NextRequest) {
  const period = parsePeriod(req.nextUrl.searchParams.get("timeframe"));
  const limitRaw = Number(req.nextUrl.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(Math.floor(limitRaw), 1), 50)
    : 20;

  try {
    const connection = getConnection();
    let balances: Map<string, bigint>;
    let fallbackToAllTime = false;
    let notice: string | undefined;

    if (period === "all-time") {
      balances = await buildAllTimeBalances(connection, limit);
    } else {
      const days = WINDOW_DAYS[period];
      const sinceUnix = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
      try {
        balances = await buildWindowBalances(connection, sinceUnix);
        notice = `Ranked by XP earned in the last ${days} days.`;
      } catch (windowErr) {
        console.warn(`[leaderboard] ${period} window ranking failed, using all-time`, windowErr);
        balances = await buildAllTimeBalances(connection, limit);
        fallbackToAllTime = true;
        notice = `Could not compute ${period} deltas; showing all-time balances.`;
      }
    }

    const entries = buildEntries(balances, limit);

    const response: LeaderboardResponse = {
      timeframe: period,
      entries,
      fallbackToAllTime,
      notice,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[leaderboard] failed to fetch", error);
    return NextResponse.json(
      {
        timeframe: period,
        entries: [],
        fallbackToAllTime: true,
        notice: "Leaderboard unavailable. Please retry shortly.",
      } satisfies LeaderboardResponse,
      { status: 200 },
    );
  }
}
