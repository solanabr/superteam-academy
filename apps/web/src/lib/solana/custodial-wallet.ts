import "server-only";

import { createHash, hkdfSync } from "crypto";
import { Keypair } from "@solana/web3.js";

/**
 * Platform-custodied learner wallets ("Academy Wallet").
 *
 * A learner who signs in with Google/GitHub has no wallet, and every embedded-
 * wallet provider needs an external approval (Phantom Portal domain review)
 * the platform cannot control. This is the dependency-free fallback: the
 * server DERIVES a keypair per account from one master secret, so a walletless
 * learner can enrol — and therefore learn, earn XP, and receive credentials —
 * the moment they sign in, with zero prompts and zero installs.
 *
 * ## Custody trade-off, stated plainly
 *
 * The server holds (derives) the learner's key, so this is custodial. That is
 * acceptable here and only here because these wallets can never hold value:
 * XP is a NonTransferable Token-2022 balance and credentials are
 * PermanentFreezeDelegate-frozen Core NFTs — there is nothing to steal but
 * soulbound reputation, and the same master-secret trust already applies to
 * BACKEND_SIGNER_SECRET and XP_MINT_AUTHORITY_SECRET sitting in the same env.
 * Do NOT extend this to anything that can hold transferable assets.
 *
 * ## Derivation, not storage
 *
 * Keys are re-derived on demand via HKDF(master, userId) — no private key is
 * ever written to the database, so there is no key table to leak, back up, or
 * migrate. The cost of that choice: ROTATING THE MASTER SECRET CHANGES EVERY
 * DERIVED ADDRESS, silently orphaning all existing custodial enrolments/XP.
 * The `v1` salt below exists so a deliberate migration can bump the version
 * and re-derive; never rotate casually.
 */

const HKDF_SALT = "superteam-academy-custodial-v1";
const MIN_SECRET_LENGTH = 32;

/**
 * Feature gate — mirrors the NEXT_PUBLIC_PHANTOM_APP_ID convention: unset (or
 * too short to be a real secret) means the custodial path is OFF and the
 * route 503s; nothing else may depend on it being present.
 */
export function isCustodialWalletEnabled(): boolean {
  const secret = process.env.CUSTODIAL_WALLET_SECRET;
  return typeof secret === "string" && secret.length >= MIN_SECRET_LENGTH;
}

/**
 * Derives the one custodial keypair for a Supabase user id. Deterministic:
 * the same user always gets the same address, so the derived pubkey can be
 * compared against `profiles.wallet_address` to recognise a returning
 * custodial account.
 */
export function deriveCustodialKeypair(userId: string): Keypair {
  const secret = process.env.CUSTODIAL_WALLET_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `CUSTODIAL_WALLET_SECRET must be set (>= ${MIN_SECRET_LENGTH} chars) to derive custodial wallets`
    );
  }
  // Hash first so the master secret's format (passphrase, hex, base64) never
  // affects the key material's entropy distribution.
  const ikm = createHash("sha256").update(secret, "utf8").digest();
  const seed = hkdfSync(
    "sha256",
    ikm,
    Buffer.from(HKDF_SALT, "utf8"),
    Buffer.from(userId, "utf8"),
    32
  );
  return Keypair.fromSeed(new Uint8Array(seed));
}
