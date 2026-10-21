import "server-only";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { Connection, PublicKey } from "@solana/web3.js";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env.server";
import { logEvent } from "@/lib/logging";
import { notifyModeration } from "@/lib/community/moderation-notify";
import {
  getSponsorKeypair,
  parseKeypairSecret,
  spendCluster,
  type PayerRole,
} from "@/lib/solana/sponsor";
import {
  balanceSnapshotEvent,
  emitServerEvent,
  lowBalanceEvent,
  type ServerEvent,
} from "./events";

/**
 * The cron's wallet check: read the sponsor and backend signer balances, send
 * an hourly balance snapshot to PostHog, and alert when one drops below
 * `SPONSOR_LOW_BALANCE_SOL`. Both are throttled in the DB
 * (`claim_platform_alert`), so the 15-minute cron neither floods PostHog nor
 * repeats an alert every tick.
 */

/**
 * Just under an hour, so a cron tick a few seconds early still snapshots on
 * the hour instead of slipping to the next 15-minute tick.
 */
export const SNAPSHOT_INTERVAL_S = 59 * 60;
/** A low-balance alert repeats at most this often per wallet. */
export const LOW_BALANCE_ALERT_INTERVAL_S = 4 * 60 * 60;

export interface WatchedWallet {
  role: PayerRole;
  pubkey: PublicKey;
}

export interface BalanceCheckDeps {
  connection: Pick<Connection, "getBalance">;
  wallets: WatchedWallet[];
  cluster: string;
  thresholdLamports: number | null;
  /** True when this key may fire now (and records that it did). */
  claim: (key: string, minIntervalSeconds: number) => Promise<boolean>;
  emit: (event: ServerEvent) => Promise<void>;
  notify: (message: string) => Promise<void>;
}

export interface BalanceCheckSummary {
  checked: number;
  snapshots: number;
  alerts: number;
}

export async function checkPlatformBalances(
  deps: BalanceCheckDeps
): Promise<BalanceCheckSummary> {
  const summary: BalanceCheckSummary = { checked: 0, snapshots: 0, alerts: 0 };

  for (const wallet of deps.wallets) {
    let balance: number;
    try {
      balance = await deps.connection.getBalance(wallet.pubkey, "confirmed");
    } catch (err) {
      logEvent({
        event: "SPONSOR_BALANCE_001",
        context: {
          role: wallet.role,
          reason: err instanceof Error ? err.message : String(err),
        },
      });
      continue;
    }
    summary.checked += 1;

    if (
      await deps.claim(
        `snapshot:${deps.cluster}:${wallet.role}`,
        SNAPSHOT_INTERVAL_S
      )
    ) {
      summary.snapshots += 1;
      await deps.emit(
        balanceSnapshotEvent({
          payerRole: wallet.role,
          balanceLamports: balance,
          cluster: deps.cluster,
        })
      );
    }

    if (
      deps.thresholdLamports !== null &&
      balance < deps.thresholdLamports &&
      (await deps.claim(
        `low_balance:${deps.cluster}:${wallet.role}`,
        LOW_BALANCE_ALERT_INTERVAL_S
      ))
    ) {
      summary.alerts += 1;
      const sol = (lamports: number) =>
        (lamports / LAMPORTS_PER_SOL).toFixed(3);
      await Promise.all([
        deps.notify(
          `Low balance: the ${wallet.role} wallet on ${deps.cluster} holds ${sol(balance)} SOL, under the ${sol(deps.thresholdLamports)} SOL threshold. Top it up: ${wallet.pubkey.toBase58()}`
        ),
        deps.emit(
          lowBalanceEvent({
            payerRole: wallet.role,
            balanceLamports: balance,
            thresholdLamports: deps.thresholdLamports,
            cluster: deps.cluster,
          })
        ),
      ]);
      logEvent({
        event: "SPONSOR_LOW_BALANCE",
        level: "error",
        context: { role: wallet.role, cluster: deps.cluster },
      });
    }
  }
  return summary;
}

/** The sponsor and backend signer, whichever are configured. */
function watchedWallets(): WatchedWallet[] {
  const wallets: WatchedWallet[] = [];
  try {
    const sponsor = getSponsorKeypair();
    if (sponsor) wallets.push({ role: "sponsor", pubkey: sponsor.publicKey });
  } catch {
    // Malformed secret: the send paths report it.
  }
  const backend = serverEnv.BACKEND_SIGNER_SECRET;
  if (backend) {
    try {
      const pubkey = parseKeypairSecret(
        "BACKEND_SIGNER_SECRET",
        backend
      ).publicKey;
      wallets.push({ role: "backend", pubkey });
    } catch {
      // As above.
    }
  }
  return wallets;
}

async function claimAlert(
  key: string,
  minIntervalSeconds: number
): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc(
    "claim_platform_alert",
    { p_key: key, p_min_interval_seconds: minIntervalSeconds }
  );
  if (error) {
    // Unclaimed on error: a broken throttle must not turn into alert spam.
    logEvent({
      event: "SPONSOR_BALANCE_002",
      context: { key, reason: error.message },
    });
    return false;
  }
  return data === true;
}

export function defaultBalanceCheckDeps(
  connection: Pick<Connection, "getBalance">
): BalanceCheckDeps {
  const thresholdSol = serverEnv.SPONSOR_LOW_BALANCE_SOL;
  return {
    connection,
    wallets: watchedWallets(),
    cluster: spendCluster(),
    thresholdLamports:
      thresholdSol === undefined
        ? null
        : Math.round(thresholdSol * LAMPORTS_PER_SOL),
    claim: claimAlert,
    emit: emitServerEvent,
    notify: notifyModeration,
  };
}
