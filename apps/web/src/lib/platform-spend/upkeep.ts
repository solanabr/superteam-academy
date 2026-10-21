import "server-only";

import type { Connection } from "@solana/web3.js";
import { logEvent } from "@/lib/logging";
import {
  defaultSettleDeps,
  settlePendingSpend,
  type SettleSummary,
} from "./settle";
import {
  checkPlatformBalances,
  defaultBalanceCheckDeps,
  type BalanceCheckSummary,
} from "./balance-check";

export interface SpendUpkeepSummary {
  settled: SettleSummary | null;
  balances: BalanceCheckSummary | null;
  /** True when the budget ran out before both steps finished. */
  timedOut: boolean;
}

/** What the cron gives spend upkeep, out of its 300 s `maxDuration`. */
export const SPEND_UPKEEP_BUDGET_MS = 30_000;

/**
 * The spend half of the on-chain queue cron: settle unsettled ledger rows,
 * then check the wallet balances. It runs before the drain, inside a fixed
 * budget, so a long drain can never starve it and it can never eat the
 * drain's time: settlement stops taking new rows at 80% of the budget, and
 * the whole step is abandoned at 100% (a hung RPC call included). Each step
 * is isolated: a failure is logged and reported as `null`.
 */
export async function runSpendUpkeep(
  connection: Connection,
  budgetMs: number = SPEND_UPKEEP_BUDGET_MS
): Promise<SpendUpkeepSummary> {
  const summary: SpendUpkeepSummary = {
    settled: null,
    balances: null,
    timedOut: false,
  };
  const startedAt = Date.now();

  const work = (async () => {
    try {
      summary.settled = await settlePendingSpend(connection, {
        ...defaultSettleDeps(connection),
        deadline: startedAt + budgetMs * 0.8,
      });
    } catch (err) {
      logEvent({
        event: "SPEND_LEDGER_003",
        level: "error",
        context: { reason: err instanceof Error ? err.message : String(err) },
      });
    }

    try {
      summary.balances = await checkPlatformBalances(
        defaultBalanceCheckDeps(connection)
      );
    } catch (err) {
      logEvent({
        event: "SPONSOR_BALANCE_003",
        level: "error",
        context: { reason: err instanceof Error ? err.message : String(err) },
      });
    }
  })();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const budget = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), budgetMs);
  });
  try {
    if ((await Promise.race([work, budget])) === "timeout") {
      summary.timedOut = true;
      logEvent({
        event: "SPEND_LEDGER_004",
        context: { reason: `spend upkeep exceeded ${budgetMs}ms` },
      });
    }
  } finally {
    clearTimeout(timer);
  }
  return summary;
}
