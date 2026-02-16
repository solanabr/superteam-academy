/// <reference types="node" />

/**
 * setup-devnet.ts
 *
 * Deploys a Token-2022 XP mint to Solana devnet with soulbound (NonTransferable)
 * and platform-managed (PermanentDelegate) extensions.
 *
 * Usage:
 *   npx tsx scripts/setup-devnet.ts
 *
 * The script is idempotent: it loads an existing authority keypair from
 * scripts/.devnet-authority.json if present, or generates a new one and
 * airdrops 2 SOL to it.
 */

import * as fs from "fs";
import * as path from "path";

import {
  Connection,
  Keypair,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";

import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeNonTransferableMintInstruction,
  createInitializePermanentDelegateInstruction,
  createInitializeMintInstruction,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const AUTHORITY_PATH = path.resolve(__dirname, ".devnet-authority.json");
const MINT_PATH = path.resolve(__dirname, ".devnet-mint.json");
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl("devnet");
const AIRDROP_AMOUNT = 2 * LAMPORTS_PER_SOL;
const MAX_AIRDROP_RETRIES = 3;
const XP_DECIMALS = 0; // 1 token = 1 XP

/** Sample wallets to mint test XP to. Replace with real pubkeys as needed. */
const SAMPLE_WALLETS: PublicKey[] = [
  // Solana devnet faucet / example addresses for testing
  new PublicKey("11111111111111111111111111111111"),
].slice(0, 0); // Empty by default -- populate when needed

const TEST_XP_AMOUNT = 100; // Amount of XP to mint to each sample wallet

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadOrCreateAuthority(): { keypair: Keypair; isNew: boolean } {
  if (fs.existsSync(AUTHORITY_PATH)) {
    console.log("[setup] Loading existing authority from", AUTHORITY_PATH);
    const raw = fs.readFileSync(AUTHORITY_PATH, "utf-8");
    const secretKey = Uint8Array.from(JSON.parse(raw) as number[]);
    return { keypair: Keypair.fromSecretKey(secretKey), isNew: false };
  }

  console.log("[setup] Generating new authority keypair...");
  const keypair = Keypair.generate();
  fs.writeFileSync(
    AUTHORITY_PATH,
    JSON.stringify(Array.from(keypair.secretKey)),
    "utf-8"
  );
  console.log("[setup] Authority keypair saved to", AUTHORITY_PATH);
  return { keypair, isNew: true };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureFunded(
  connection: Connection,
  keypair: Keypair
): Promise<void> {
  const balance = await connection.getBalance(keypair.publicKey);
  if (balance >= LAMPORTS_PER_SOL) {
    console.log(
      `[setup] Authority balance: ${balance / LAMPORTS_PER_SOL} SOL (sufficient)`
    );
    return;
  }

  // Airdrop uses the public devnet faucet (not the custom RPC) since
  // most RPC providers don't support requestAirdrop.
  const faucetConnection = new Connection(clusterApiUrl("devnet"), "confirmed");

  for (let attempt = 1; attempt <= MAX_AIRDROP_RETRIES; attempt++) {
    try {
      console.log(
        `[setup] Requesting airdrop of 2 SOL (attempt ${attempt}/${MAX_AIRDROP_RETRIES})...`
      );
      const sig = await faucetConnection.requestAirdrop(
        keypair.publicKey,
        AIRDROP_AMOUNT
      );
      await faucetConnection.confirmTransaction(sig, "confirmed");
      const newBalance = await connection.getBalance(keypair.publicKey);
      console.log(
        `[setup] Airdrop confirmed. Balance: ${newBalance / LAMPORTS_PER_SOL} SOL`
      );
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[setup] Airdrop attempt ${attempt} failed: ${message}`);
      if (attempt < MAX_AIRDROP_RETRIES) {
        const delay = attempt * 5000;
        console.log(`[setup] Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  console.error();
  console.error("[setup] All airdrop attempts failed.");
  console.error(
    "[setup] Fund the authority manually using the Solana web faucet:"
  );
  console.error(
    `[setup]   https://faucet.solana.com/?address=${keypair.publicKey.toBase58()}`
  );
  console.error("[setup] Then re-run this script.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Deploy Mint
// ---------------------------------------------------------------------------

async function deployMint(
  connection: Connection,
  authority: Keypair,
  mintKeypair: Keypair
): Promise<void> {
  const extensions: ExtensionType[] = [
    ExtensionType.NonTransferable,
    ExtensionType.PermanentDelegate,
  ];
  const mintLen = getMintLen(extensions);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  // Build the transaction with all instructions in correct order:
  //   1. Create account
  //   2. Initialize extensions (before InitializeMint)
  //   3. Initialize mint
  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: authority.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeNonTransferableMintInstruction(
      mintKeypair.publicKey,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializePermanentDelegateInstruction(
      mintKeypair.publicKey,
      authority.publicKey,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      XP_DECIMALS,
      authority.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    )
  );

  const mintTxSig = await sendAndConfirmTransaction(
    connection,
    transaction,
    [authority, mintKeypair],
    { commitment: "confirmed" }
  );

  console.log("[setup] Mint created!");
  console.log("[setup]   Mint address:", mintKeypair.publicKey.toBase58());
  console.log("[setup]   Tx signature:", mintTxSig);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("  Solarium — Devnet XP Mint Setup (Token-2022)");
  console.log("=".repeat(60));
  console.log();

  // 1. Connection
  const connection = new Connection(RPC_URL, "confirmed");
  console.log("[setup] Connected to", RPC_URL);

  // 2. Authority keypair (idempotent)
  const { keypair: authority, isNew } = loadOrCreateAuthority();
  console.log("[setup] Authority pubkey:", authority.publicKey.toBase58());

  // 3. Fund if needed
  if (isNew) {
    await ensureFunded(connection, authority);
  } else {
    // Even for existing keys, check balance in case it drained
    await ensureFunded(connection, authority);
  }

  // 4. Create Token-2022 mint with extensions (idempotent — reuses saved keypair)
  let mintKeypair: Keypair;

  if (fs.existsSync(MINT_PATH)) {
    console.log();
    console.log("[setup] Loading existing mint keypair from", MINT_PATH);
    const raw = fs.readFileSync(MINT_PATH, "utf-8");
    const secretKey = Uint8Array.from(JSON.parse(raw) as number[]);
    mintKeypair = Keypair.fromSecretKey(secretKey);
    console.log("[setup] Mint address:", mintKeypair.publicKey.toBase58());

    // Check if mint already exists on-chain
    const mintInfo = await connection.getAccountInfo(mintKeypair.publicKey);
    if (mintInfo) {
      console.log("[setup] Mint already deployed on-chain. Skipping creation.");
    } else {
      console.log("[setup] Mint keypair exists but not deployed. Deploying...");
      await deployMint(connection, authority, mintKeypair);
    }
  } else {
    console.log();
    console.log("[setup] Creating Token-2022 XP mint...");
    mintKeypair = Keypair.generate();
    fs.writeFileSync(
      MINT_PATH,
      JSON.stringify(Array.from(mintKeypair.secretKey)),
      "utf-8"
    );
    console.log("[setup] Mint keypair saved to", MINT_PATH);
    await deployMint(connection, authority, mintKeypair);
  }

  // 5. Mint test XP to sample wallets
  if (SAMPLE_WALLETS.length > 0) {
    console.log();
    console.log(
      `[setup] Minting ${TEST_XP_AMOUNT} XP to ${SAMPLE_WALLETS.length} sample wallet(s)...`
    );

    for (const wallet of SAMPLE_WALLETS) {
      try {
        // Get or create the associated token account for Token-2022
        const ata = await getOrCreateAssociatedTokenAccount(
          connection,
          authority, // payer
          mintKeypair.publicKey,
          wallet,
          false, // allowOwnerOffCurve
          "confirmed",
          undefined,
          TOKEN_2022_PROGRAM_ID
        );

        // Mint XP tokens
        const mintSig = await mintTo(
          connection,
          authority, // payer
          mintKeypair.publicKey,
          ata.address,
          authority.publicKey, // mint authority
          TEST_XP_AMOUNT,
          [],
          undefined,
          TOKEN_2022_PROGRAM_ID
        );

        console.log(
          `[setup]   Minted ${TEST_XP_AMOUNT} XP to ${wallet.toBase58()} (tx: ${mintSig})`
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[setup]   Failed to mint to ${wallet.toBase58()}: ${message}`
        );
      }
    }
  } else {
    console.log();
    console.log(
      "[setup] No sample wallets configured. Skipping test XP minting."
    );
    console.log(
      "[setup] Edit SAMPLE_WALLETS in setup-devnet.ts to add wallet pubkeys."
    );
  }

  // 6. Output env config
  console.log();
  console.log("=".repeat(60));
  console.log("  Environment Configuration");
  console.log("=".repeat(60));
  console.log();
  console.log("Add these to your .env.local or .env:");
  console.log();
  console.log(
    `NEXT_PUBLIC_XP_MINT_ADDRESS=${mintKeypair.publicKey.toBase58()}`
  );
  console.log(
    `XP_MINT_AUTHORITY_SECRET='${JSON.stringify(Array.from(authority.secretKey))}'`
  );
  console.log();
  console.log(
    "The authority keypair is BOTH the mint authority AND the PermanentDelegate."
  );
  console.log(
    "It can mint XP on lesson completion and burn XP on wallet unlink."
  );
  console.log();
  console.log(
    "IMPORTANT: The secret key is also stored at scripts/.devnet-authority.json"
  );
  console.log(
    "           These files are gitignored. Do NOT commit them to version control."
  );
  console.log();
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("[setup] Fatal error:", message);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});
