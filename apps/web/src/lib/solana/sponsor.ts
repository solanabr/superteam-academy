import "server-only";

import { Keypair } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import { serverEnv } from "@/lib/env.server";
import { logEvent } from "@/lib/logging";
import {
  isMainnetCluster,
  isMainnetFailClosed,
  resolveSolanaNetwork,
} from "./network";

/**
 * Who pays a server-sent transaction. `sponsor` is the dedicated wallet for
 * learner usage (`SPONSOR_SECRET`); `backend` is the backend signer, which only
 * pays when the sponsor is unset on devnet, or where the program itself names
 * it as a rent payer; `authority` is the program authority, which pays for
 * admin course writes.
 */
export type PayerRole = "sponsor" | "backend" | "authority";

export interface FeePayer {
  keypair: Keypair;
  role: PayerRole;
}

/** Client-facing text for {@link SponsorUnavailableError}. */
export const SPONSOR_UNAVAILABLE_MESSAGE =
  "The sponsor wallet is not configured (SPONSOR_SECRET), so nothing was sent.";

/**
 * `SPONSOR_SECRET` is unset and the backend signer may not stand in: the
 * cluster is mainnet, or it could not be verified as anything else.
 */
export class SponsorUnavailableError extends Error {
  constructor(reason: string) {
    super(`${SPONSOR_UNAVAILABLE_MESSAGE} ${reason}`);
    this.name = "SponsorUnavailableError";
  }
}

/** Parse a 64-byte JSON keypair secret. Never echoes the value. */
export function parseKeypairSecret(name: string, secret: string): Keypair {
  let parsed: unknown;
  try {
    parsed = JSON.parse(secret);
  } catch {
    throw new Error(`${name} is not valid JSON`);
  }
  if (!Array.isArray(parsed) || parsed.length !== 64) {
    throw new Error(`${name} must be a 64-element JSON array`);
  }
  return Keypair.fromSecretKey(Uint8Array.from(parsed as number[]));
}

let _sponsor: Keypair | null | undefined;

/** The sponsor keypair, or `null` when `SPONSOR_SECRET` is unset. */
export function getSponsorKeypair(): Keypair | null {
  if (_sponsor !== undefined) return _sponsor;
  const secret = serverEnv.SPONSOR_SECRET;
  _sponsor = secret ? parseKeypairSecret("SPONSOR_SECRET", secret) : null;
  return _sponsor;
}

// A verified "not mainnet" answer for the fallback below. Cached per process:
// the RPC URL is read once at boot, so it cannot change under a running
// process, and the cache only decides who pays a fee, never whether an
// irreversible write happens. Failures are never cached.
let _fallbackClusterVerified = false;
let _fallbackWarned = false;

/**
 * The fee payer for a server-sent transaction: the sponsor when
 * `SPONSOR_SECRET` is set. Without it, `fallback()` (the key that paid before
 * the sponsor existed) pays, but only on a cluster verified not to be mainnet,
 * and the first use per process logs `SPONSOR_001`. On mainnet, or when the
 * cluster can't be verified, this throws {@link SponsorUnavailableError}.
 */
export async function resolveFeePayer(
  connection: Connection,
  fallback: () => FeePayer
): Promise<FeePayer> {
  const sponsor = getSponsorKeypair();
  if (sponsor) return { keypair: sponsor, role: "sponsor" };

  if (!_fallbackClusterVerified) {
    let mainnet: boolean;
    try {
      mainnet = await isMainnetFailClosed(connection.rpcEndpoint, () =>
        connection.getGenesisHash()
      );
    } catch {
      throw new SponsorUnavailableError(
        "The RPC's cluster could not be verified."
      );
    }
    if (mainnet) {
      throw new SponsorUnavailableError(
        "The backend signer does not stand in on mainnet."
      );
    }
    _fallbackClusterVerified = true;
  }

  const payer = fallback();
  if (!_fallbackWarned) {
    _fallbackWarned = true;
    logEvent({
      event: "SPONSOR_001",
      context: {
        reason: "SPONSOR_SECRET is unset; devnet fallback",
        payerRole: payer.role,
      },
    });
  }
  return payer;
}

/** The cluster label recorded on ledger rows and analytics events. */
export function spendCluster(): string {
  if (isMainnetCluster(serverEnv.SOLANA_RPC_URL)) return "mainnet";
  return resolveSolanaNetwork().network.trim().toLowerCase() || "devnet";
}

/**
 * Base58 public keys of every platform wallet configured on this server, by
 * role. Settlement uses it to count rent paid by any of them, not only the fee
 * payer. A secret that fails to parse is skipped; boot validation and the
 * signing paths report those.
 */
export function getPlatformPayerKeys(): Map<string, PayerRole> {
  const keys = new Map<string, PayerRole>();
  const add = (name: string, secret: string | undefined, role: PayerRole) => {
    if (!secret) return;
    try {
      const pubkey = parseKeypairSecret(name, secret).publicKey.toBase58();
      if (!keys.has(pubkey)) keys.set(pubkey, role);
    } catch {
      // Reported elsewhere.
    }
  };
  add("SPONSOR_SECRET", serverEnv.SPONSOR_SECRET, "sponsor");
  add("BACKEND_SIGNER_SECRET", serverEnv.BACKEND_SIGNER_SECRET, "backend");
  add(
    "PROGRAM_AUTHORITY_SECRET",
    serverEnv.PROGRAM_AUTHORITY_SECRET,
    "authority"
  );
  add(
    "XP_MINT_AUTHORITY_SECRET",
    serverEnv.XP_MINT_AUTHORITY_SECRET,
    "authority"
  );
  return keys;
}

/** Test seam: forget the cached keypair and fallback state. */
export function resetSponsorStateForTests(): void {
  _sponsor = undefined;
  _fallbackClusterVerified = false;
  _fallbackWarned = false;
}
