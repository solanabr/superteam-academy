"use client";

import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletAdapter } from "@superteam-lms/deploy";
import { parseWalletAddress } from "@/lib/solana/linked-wallet";
import {
  signAllWithDynamicWallet,
  signWithDynamicWallet,
} from "@/lib/dynamic/solana";
import {
  startDynamicSocialSignIn,
  type DynamicSocialProvider,
} from "@/lib/dynamic/social";
import { isDynamicEnabled } from "@/lib/dynamic/config";
import { useDynamicSessionState } from "@/hooks/use-dynamic-session-state";

/**
 * Write transactions signed per `signAllTransactions` call on the embedded
 * wallet.
 *
 * PROVISIONAL — pending the owner's measurement against a real Dynamic session
 * (spec C3). Every batch shares one blockhash fetched just before signing, and
 * that blockhash lives ~60-90s on devnet, so the batch size is bounded by how
 * long an MPC `signAllTransactions` call takes for N transactions. The
 * wallet-adapter default is 50, where the cost is one popup and the learner's
 * click; MPC signing instead scales with N over the network, and that latency
 * is unmeasured. 15 is the conservative starting point: three times fewer
 * signatures per call than the adapter path, still only ~8 batches for a
 * 100 KB program. The deploy panel logs per-batch signing time in development
 * so the number can be replaced with a measured one.
 */
export const EMBEDDED_BATCH_SIZE = 15;

export type DeploySignerStatus = "resolving" | "none" | "expired" | "ready";

export interface DeploySignerState {
  status: DeploySignerStatus;
  /** Non-null exactly when `status === "ready"`. */
  signer: WalletAdapter | null;
  kind: "adapter" | "embedded" | null;
  /**
   * Batch size to pass to `deployProgram` / `resumeDeployment`, or undefined to
   * keep the package default (the adapter path, unchanged).
   */
  batchSize: number | undefined;
  /** Starts the Dynamic social redirect — for the `expired` reauth card. */
  startReauth: (provider: DynamicSocialProvider) => Promise<void>;
}

/**
 * The wallet that will sign and pay for a program deploy — extension or
 * embedded.
 *
 * `DeployPanel` and `WalletFundingCard` used to read `useWallet()` alone, so a
 * learner who signed in with Google had no `publicKey` and Deploy stayed
 * disabled forever — the same dead end enrol had before #1004, with the extra
 * problem that an embedded wallet also starts at zero SOL. The resolution order
 * mirrors `use-on-chain-enroll`: adapter first, then the Dynamic session, and
 * the four states are the session's own so callers branch on one vocabulary.
 *
 * With `isDynamicEnabled()` false this degrades to exactly the adapter-only
 * behaviour that shipped before — no Dynamic read, no reauth card.
 */
export function useDeploySigner(): DeploySignerState {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const dynamicSession = useDynamicSessionState();
  const dynamicEnabled = isDynamicEnabled();
  const account = dynamicEnabled ? dynamicSession.account : null;
  // Read before the memo so the adapter branch does not depend on it.
  const embeddedKey = parseWalletAddress(account?.address ?? null);

  return useMemo<DeploySignerState>(() => {
    const startReauth = (provider: DynamicSocialProvider) =>
      startDynamicSocialSignIn(provider);

    if (publicKey && signTransaction && signAllTransactions) {
      return {
        status: "ready",
        signer: { publicKey, signTransaction, signAllTransactions },
        kind: "adapter",
        batchSize: undefined,
        startReauth,
      };
    }

    const idle = {
      signer: null,
      kind: null,
      batchSize: undefined,
      startReauth,
    } as const;

    if (!dynamicEnabled) return { status: "none", ...idle };

    if (account && embeddedKey) {
      return {
        status: "ready",
        signer: {
          publicKey: embeddedKey,
          // The MPC signer attaches its signature to the transaction it is
          // given rather than rebuilding it, so these are safe to hand a
          // partially-signed tx (the buffer/program keypair's signature).
          signTransaction: async (tx) =>
            (await signWithDynamicWallet(tx, account)) as typeof tx,
          signAllTransactions: async (txs) =>
            (await signAllWithDynamicWallet(txs, account)) as typeof txs,
        },
        kind: "embedded",
        batchSize: EMBEDDED_BATCH_SIZE,
        startReauth,
      };
    }

    switch (dynamicSession.status) {
      case "loading":
        return { status: "resolving", ...idle };
      case "expired":
        return { status: "expired", ...idle };
      default:
        return { status: "none", ...idle };
    }
  }, [
    publicKey,
    signTransaction,
    signAllTransactions,
    dynamicEnabled,
    dynamicSession.status,
    account,
    embeddedKey,
  ]);
}
