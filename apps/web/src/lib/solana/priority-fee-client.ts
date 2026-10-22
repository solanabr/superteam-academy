import type { PublicKey } from "@solana/web3.js";
import { PRIORITY_FEE_FLOOR_MICROLAMPORTS } from "./compute-budget";

/** Matches the route's own limit. */
const MAX_ACCOUNTS = 16;
const TIMEOUT_MS = 2_500;

/**
 * Priority-fee price for a transaction the learner's wallet will sign, from
 * `/api/solana/priority-fee` (the server's estimate, clamped there). Never
 * throws: any failure or a slow answer yields the floor, so a missing
 * estimate never blocks the learner's transaction.
 */
export async function fetchPriorityFee(
  writableAccounts: PublicKey[],
  fetchImpl: typeof fetch = fetch
): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl("/api/solana/priority-fee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accounts: writableAccounts
          .slice(0, MAX_ACCOUNTS)
          .map((a) => a.toBase58()),
      }),
      signal: controller.signal,
    });
    if (!res.ok) return PRIORITY_FEE_FLOOR_MICROLAMPORTS;
    const body = (await res.json()) as { microLamports?: unknown };
    const price = body.microLamports;
    return typeof price === "number" && Number.isFinite(price) && price >= 0
      ? Math.floor(price)
      : PRIORITY_FEE_FLOOR_MICROLAMPORTS;
  } catch {
    return PRIORITY_FEE_FLOOR_MICROLAMPORTS;
  } finally {
    clearTimeout(timer);
  }
}
