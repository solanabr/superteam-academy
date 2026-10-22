import "server-only";

/**
 * Server-side Token-2022 XP minting and burning.
 *
 * Loads the mint authority keypair from `XP_MINT_AUTHORITY_SECRET` env var
 * and mints/burns soulbound XP tokens on users' wallets.
 *
 * Burn capability uses the PermanentDelegate extension — the authority can
 * burn tokens from any holder's ATA without their signature. This is used
 * when a user unlinks their wallet to prevent double-spending.
 *
 * This module must ONLY be imported from API routes (server-side).
 */

import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  burn,
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { serverEnv } from "@/lib/env.server";
import { resolveFeePayer } from "./sponsor";
import { sendPlatformTransaction } from "./platform-tx";
import { COMPUTE_UNIT_LIMITS } from "./compute-budget";

// ---------------------------------------------------------------------------
// Lazy-loaded singletons (initialized on first call)
// ---------------------------------------------------------------------------

let _connection: Connection | null = null;
let _authority: Keypair | null = null;
let _xpMint: PublicKey | null = null;
let _initialized = false;

function initialize(): { ready: boolean } {
  if (_initialized) {
    return { ready: _authority !== null && _xpMint !== null };
  }
  _initialized = true;

  _connection = new Connection(serverEnv.SOLANA_RPC_URL, "confirmed");

  const mintAddress = process.env.NEXT_PUBLIC_XP_MINT_ADDRESS;
  if (!mintAddress) {
    console.warn(
      "[xp-mint] NEXT_PUBLIC_XP_MINT_ADDRESS not set. On-chain XP minting disabled."
    );
    return { ready: false };
  }
  _xpMint = new PublicKey(mintAddress);

  const authoritySecret = serverEnv.XP_MINT_AUTHORITY_SECRET;
  if (!authoritySecret) {
    console.warn(
      "[xp-mint] XP_MINT_AUTHORITY_SECRET not set. On-chain XP minting disabled."
    );
    return { ready: false };
  }

  try {
    const secretKey = Uint8Array.from(JSON.parse(authoritySecret) as number[]);
    _authority = Keypair.fromSecretKey(secretKey);
  } catch {
    console.error("[xp-mint] Failed to parse XP_MINT_AUTHORITY_SECRET.");
    return { ready: false };
  }

  return { ready: true };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface XpTxResult {
  success: boolean;
  signature?: string;
  amount?: number;
  error?: string;
}

/**
 * Mint Token-2022 XP tokens to a user's wallet.
 *
 * Creates the user's Associated Token Account if it doesn't exist and mints
 * `amount` XP tokens, in one transaction. The sponsor wallet pays the fee and
 * the token account rent (the mint authority on devnet without
 * `SPONSOR_SECRET`); the mint authority only signs the mint.
 *
 * This function is non-blocking for the lesson completion flow —
 * callers should fire-and-forget or await but not fail the request
 * if on-chain minting fails.
 */
export async function mintXpToWallet(
  walletAddress: string,
  amount: number
): Promise<XpTxResult> {
  const { ready } = initialize();
  if (!ready || !_connection || !_authority || !_xpMint) {
    return { success: false, error: "On-chain XP minting not configured" };
  }

  const authority = _authority;
  try {
    const recipient = new PublicKey(walletAddress);
    const feePayer = await resolveFeePayer(_connection, () => ({
      keypair: authority,
      role: "authority",
    }));

    const ata = getAssociatedTokenAddressSync(
      _xpMint,
      recipient,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const tx = new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(
        feePayer.keypair.publicKey,
        ata,
        recipient,
        _xpMint,
        TOKEN_2022_PROGRAM_ID
      ),
      createMintToInstruction(
        _xpMint,
        ata,
        authority.publicKey,
        amount,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );

    const signature = await sendPlatformTransaction(_connection, tx, {
      feePayer,
      signers: [authority],
      computeUnits: COMPUTE_UNIT_LIMITS.xpMint,
      context: { action: "xp_mint", wallet: walletAddress },
    });

    return { success: true, signature, amount };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[xp-mint] Failed to mint ${amount} XP to ${walletAddress}: ${message}`
    );
    return { success: false, error: message };
  }
}

/**
 * Burn ALL Token-2022 XP tokens from a user's wallet.
 *
 * Uses the PermanentDelegate authority to burn without the wallet owner's
 * signature. Called when a user unlinks their wallet to prevent
 * double-spending (XP is re-minted to a new wallet on re-link).
 *
 * Returns the amount burned so the caller can verify it matches Supabase.
 */
export async function burnXpFromWallet(
  walletAddress: string
): Promise<XpTxResult> {
  const { ready } = initialize();
  if (!ready || !_connection || !_authority || !_xpMint) {
    return { success: false, error: "On-chain XP minting not configured" };
  }

  try {
    const owner = new PublicKey(walletAddress);
    const ata = getAssociatedTokenAddressSync(
      _xpMint,
      owner,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    // Read current balance — if ATA doesn't exist or balance is 0, nothing to burn
    let balance: number;
    try {
      const account = await getAccount(
        _connection,
        ata,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      balance = Number(account.amount);
    } catch {
      // ATA doesn't exist — no tokens to burn
      return { success: true, amount: 0 };
    }

    if (balance === 0) {
      return { success: true, amount: 0 };
    }

    // Burn using PermanentDelegate authority (no wallet owner signature needed)
    const signature = await burn(
      _connection,
      _authority, // payer
      ata, // token account to burn from
      _xpMint, // mint
      _authority, // authority (PermanentDelegate)
      balance, // burn all
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    return { success: true, signature, amount: balance };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[xp-mint] Failed to burn XP from ${walletAddress}: ${message}`
    );
    return { success: false, error: message };
  }
}
