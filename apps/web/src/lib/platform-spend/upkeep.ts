import "server-only";

import type { Connection } from "@solana/web3.js";
import { logEvent } from "@/lib/logging";
import { settlePendingSpend, type SettleSummary } from "./settle";
import {
  checkPlatformBalances,
  defaultBalanceCheckDeps,
  type BalanceCheckSummary,
} from "./balance-check";

export interface SpendUpkeepSummary {
  settled: SettleSummary | null;
  balances: BalanceCheckSummary | null;
}

/**
 * The spend half of the on-chain queue cron: settle pending ledger rows, then
 * check the wallet balances. Each step is isolated, so a failure in one is
 * logged and reported as `null` without failing the drain or the other step.
 */
export async function runSpendUpkeep(
  connection: Connection
): Promise<SpendUpkeepSummary> {
  let settled: SettleSummary | null = null;
  try {
    settled = await settlePendingSpend(connection);
  } catch (err) {
    logEvent({
      event: "SPEND_LEDGER_003",
      level: "error",
      context: { reason: err instanceof Error ? err.message : String(err) },
    });
  }

  let balances: BalanceCheckSummary | null = null;
  try {
    balances = await checkPlatformBalances(defaultBalanceCheckDeps(connection));
  } catch (err) {
    logEvent({
      event: "SPONSOR_BALANCE_003",
      level: "error",
      context: { reason: err instanceof Error ? err.message : String(err) },
    });
  }

  return { settled, balances };
}
