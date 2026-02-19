#!/usr/bin/env tsx
/**
 * init-program.ts — Superteam Academy admin CLI
 *
 * Usage (tsx is already installed in this repo):
 *   pnpm tsx scripts/init-program.ts status
 *   pnpm tsx scripts/init-program.ts initialize
 *   pnpm tsx scripts/init-program.ts register-minter
 *   pnpm tsx scripts/init-program.ts sync-courses
 *   pnpm tsx scripts/init-program.ts sync-achievements
 *
 * Or via npx (no local install needed):
 *   npx tsx scripts/init-program.ts status
 *
 * Prerequisites:
 *   - tsx (already installed: node_modules/.bin/tsx)
 *   - .env.local (or .env) with the variables listed below
 *
 * Required env vars:
 *   NEXT_PUBLIC_SOLANA_RPC_URL     — Solana RPC endpoint
 *   PROGRAM_AUTHORITY_SECRET       — JSON array [64 numbers] for authority keypair
 *   BACKEND_SIGNER_SECRET          — JSON array [64 numbers] for backend signer keypair
 *   NEXT_PUBLIC_APP_URL            — Base URL for API calls (default: http://localhost:3000)
 *   ADMIN_SECRET                   — Bearer token for admin API calls
 *
 * Run from the repo root:
 *   pnpm tsx scripts/init-program.ts status
 *
 * tsx does not require a tsconfig — it strips types at runtime.
 * If you need strict type-checking first: tsc --noEmit --project apps/web/tsconfig.json
 */

import * as fs from "fs";
import * as path from "path";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  clusterApiUrl,
} from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

// ---------------------------------------------------------------------------
// Path helpers (resolved relative to this file, not cwd)
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, "..");
const WEB_SRC = path.join(REPO_ROOT, "apps", "web", "src");
const IDL_PATH = path.join(
  WEB_SRC,
  "lib",
  "solana",
  "idl",
  "superteam_academy.json"
);
const XP_MINT_KEYPAIR_PATH = path.join(
  REPO_ROOT,
  "wallets",
  "xp-mint-keypair.json"
);

// ---------------------------------------------------------------------------
// Manual dotenv loader — no external dependency
// ---------------------------------------------------------------------------

function loadEnv(): void {
  const candidates = [
    path.join(REPO_ROOT, ".env.local"),
    path.join(REPO_ROOT, "apps", "web", ".env.local"),
    path.join(REPO_ROOT, ".env"),
    path.join(REPO_ROOT, "apps", "web", ".env"),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;

    const content = fs.readFileSync(candidate, "utf-8");
    for (const line of content.split("\n")) {
      // Skip blank lines and comments
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      // Find first "=" (values may contain "=")
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;

      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();

      // Strip surrounding quotes (single or double)
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Do NOT override variables already set in the process environment
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }

    console.log(`[env] Loaded ${candidate}`);
    break; // Use first file found
  }
}

// ---------------------------------------------------------------------------
// Keypair helpers
// ---------------------------------------------------------------------------

function loadKeypairFromEnv(envVar: string, label: string): Keypair {
  const raw = process.env[envVar];
  if (!raw) {
    console.error(`Error: ${envVar} is not set. Cannot proceed.`);
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(`Error: ${envVar} is not valid JSON.`);
    process.exit(1);
  }

  if (!Array.isArray(parsed) || parsed.length !== 64) {
    console.error(
      `Error: ${envVar} must be a 64-element JSON array (got ${Array.isArray(parsed) ? parsed.length : typeof parsed} elements).`
    );
    process.exit(1);
  }

  try {
    const kp = Keypair.fromSecretKey(Uint8Array.from(parsed as number[]));
    console.log(`[keys] ${label}: ${kp.publicKey.toBase58()}`);
    return kp;
  } catch (e) {
    console.error(
      `Error: Failed to create keypair from ${envVar}: ${e instanceof Error ? e.message : String(e)}`
    );
    process.exit(1);
  }
}

function loadXpMintKeypair(): Keypair {
  if (fs.existsSync(XP_MINT_KEYPAIR_PATH)) {
    try {
      const raw = fs.readFileSync(XP_MINT_KEYPAIR_PATH, "utf-8");
      const parsed = JSON.parse(raw) as number[];
      const kp = Keypair.fromSecretKey(Uint8Array.from(parsed));
      console.log(
        `[keys] XP mint keypair loaded from wallets/xp-mint-keypair.json: ${kp.publicKey.toBase58()}`
      );
      return kp;
    } catch (e) {
      console.error(
        `Warning: Failed to load wallets/xp-mint-keypair.json: ${e instanceof Error ? e.message : String(e)}`
      );
      console.error("Generating a fresh ephemeral keypair instead.");
    }
  } else {
    console.log(
      "[keys] wallets/xp-mint-keypair.json not found — generating ephemeral XP mint keypair."
    );
    console.log(
      "[keys] IMPORTANT: Save this keypair if the transaction succeeds so you can reference the mint later."
    );
  }

  const fresh = Keypair.generate();
  console.log(`[keys] Ephemeral XP mint pubkey: ${fresh.publicKey.toBase58()}`);
  console.log(
    `[keys] Secret key (save to wallets/xp-mint-keypair.json): ${JSON.stringify(Array.from(fresh.secretKey))}`
  );
  return fresh;
}

// ---------------------------------------------------------------------------
// PDA derivation (mirrors apps/web/src/lib/solana/pda.ts exactly)
// ---------------------------------------------------------------------------

// Program ID from the IDL (same as pda.ts fallback, but read from IDL directly
// so this script is standalone)
function loadProgramId(): PublicKey {
  const idl = loadIdl();
  return new PublicKey(idl.address as string);
}

function findConfigPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], programId);
}

function findMinterRolePDA(
  minter: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    programId
  );
}

// ---------------------------------------------------------------------------
// IDL loader
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadIdl(): Record<string, any> {
  try {
    const raw = fs.readFileSync(IDL_PATH, "utf-8");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(raw);
  } catch (e) {
    console.error(
      `Error: Failed to load IDL from ${IDL_PATH}: ${e instanceof Error ? e.message : String(e)}`
    );
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Anchor program builder
// ---------------------------------------------------------------------------

interface AnchorSetup {
  connection: Connection;
  authority: Keypair;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: Program<any>;
  programId: PublicKey;
}

function buildAnchorSetup(): AnchorSetup {
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet");
  console.log(`[rpc] Connecting to ${rpcUrl}`);
  const connection = new Connection(rpcUrl, "confirmed");

  const authority = loadKeypairFromEnv("PROGRAM_AUTHORITY_SECRET", "Authority");
  const idl = loadIdl();
  const programId = new PublicKey(idl.address as string);

  const wallet = new NodeWallet(authority);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(idl as unknown as Idl, provider);

  return { connection, authority, program, programId };
}

// ---------------------------------------------------------------------------
// Config account raw decoder
// Config layout (after 8-byte discriminator):
//   authority:      pubkey  [8..40]
//   backend_signer: pubkey  [40..72]
//   xp_mint:        pubkey  [72..104]
//   _reserved:      [u8;8]  [104..112]
//   bump:           u8      [112]
// ---------------------------------------------------------------------------

interface ConfigState {
  authority: string;
  backendSigner: string;
  xpMint: string;
  bump: number;
}

function decodeConfigAccount(data: Buffer): ConfigState | null {
  // Minimum size: 8 (discriminator) + 32 + 32 + 32 + 8 + 1 = 113 bytes
  if (data.length < 113) return null;

  const authority = new PublicKey(data.slice(8, 40)).toBase58();
  const backendSigner = new PublicKey(data.slice(40, 72)).toBase58();
  const xpMint = new PublicKey(data.slice(72, 104)).toBase58();
  const bump = data[112];

  return { authority, backendSigner, xpMint, bump: bump ?? 0 };
}

// ---------------------------------------------------------------------------
// Subcommand: status
// ---------------------------------------------------------------------------

async function cmdStatus(): Promise<void> {
  console.log("\n=== Config PDA Status ===\n");

  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet");
  console.log(`RPC: ${rpcUrl}`);

  const connection = new Connection(rpcUrl, "confirmed");
  const idl = loadIdl();
  const programId = new PublicKey(idl.address as string);

  console.log(`Program ID: ${programId.toBase58()}`);

  const [configPDA, configBump] = findConfigPDA(programId);
  console.log(
    `Config PDA: ${configPDA.toBase58()} (expected bump: ${configBump})`
  );

  const accountInfo = await connection.getAccountInfo(configPDA);

  if (!accountInfo) {
    console.log("\nStatus: NOT INITIALIZED");
    console.log("Run: pnpm tsx scripts/init-program.ts initialize");
    return;
  }

  console.log(`Account size: ${accountInfo.data.length} bytes`);
  console.log(`Owner: ${accountInfo.owner.toBase58()}`);
  console.log(`Lamports: ${accountInfo.lamports}`);

  const config = decodeConfigAccount(accountInfo.data as Buffer);
  if (!config) {
    console.log("\nWarning: Account exists but data is too short to decode.");
    return;
  }

  console.log("\nConfig state:");
  console.log(`  authority:      ${config.authority}`);
  console.log(`  backend_signer: ${config.backendSigner}`);
  console.log(`  xp_mint:        ${config.xpMint}`);
  console.log(`  bump:           ${config.bump}`);

  // Check if authority matches PROGRAM_AUTHORITY_SECRET if set
  const authoritySecret = process.env.PROGRAM_AUTHORITY_SECRET;
  if (authoritySecret) {
    try {
      const parsed = JSON.parse(authoritySecret) as number[];
      const localKp = Keypair.fromSecretKey(Uint8Array.from(parsed));
      const localKey = localKp.publicKey.toBase58();
      const matches = localKey === config.authority;
      console.log(`\n  Local authority key: ${localKey}`);
      console.log(
        `  Matches on-chain:    ${matches ? "YES" : "NO — keypair mismatch!"}`
      );
    } catch {
      // env var present but unparseable — skip match check
    }
  }

  console.log("\nStatus: INITIALIZED");
}

// ---------------------------------------------------------------------------
// Subcommand: initialize
// ---------------------------------------------------------------------------

async function cmdInitialize(): Promise<void> {
  console.log("\n=== Initialize Program ===\n");

  const { connection, authority, program, programId } = buildAnchorSetup();

  const [configPDA] = findConfigPDA(programId);
  console.log(`Config PDA:    ${configPDA.toBase58()}`);

  // Check if already initialized
  const existing = await connection.getAccountInfo(configPDA);
  if (existing) {
    console.log("Config PDA already exists — program is already initialized.");
    console.log("Run 'status' to inspect the current state.");
    return;
  }

  // Load (or generate) the XP mint keypair
  const xpMintKeypair = loadXpMintKeypair();
  console.log(`XP Mint:       ${xpMintKeypair.publicKey.toBase58()}`);

  // The backend_minter_role PDA is seeded from the authority pubkey (not the
  // backend signer). This is what the IDL shows:
  //   seeds: ["minter", authority]
  // On initialize, the program auto-registers the authority as minter.
  const [backendMinterRolePDA] = findMinterRolePDA(
    authority.publicKey,
    programId
  );
  console.log(`MinterRole PDA (authority): ${backendMinterRolePDA.toBase58()}`);

  const TOKEN_2022_PROGRAM_ID = new PublicKey(
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
  );

  console.log("\nSending initialize transaction...");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const signature: string = await program.methods
    .initialize()
    .accountsPartial({
      config: configPDA,
      xpMint: xpMintKeypair.publicKey,
      authority: authority.publicKey,
      backendMinterRole: backendMinterRolePDA,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .signers([authority, xpMintKeypair])
    .rpc();

  console.log(`\nSuccess! Signature: ${signature}`);
  console.log(
    `Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`
  );
  console.log(`\nXP Mint address: ${xpMintKeypair.publicKey.toBase58()}`);
  console.log(`Config PDA:      ${configPDA.toBase58()}`);
  console.log("\nNext step: pnpm tsx scripts/init-program.ts register-minter");
}

// ---------------------------------------------------------------------------
// Subcommand: register-minter
// ---------------------------------------------------------------------------

async function cmdRegisterMinter(): Promise<void> {
  console.log("\n=== Register Minter ===\n");

  const { authority, program, programId } = buildAnchorSetup();

  // Load backend signer keypair — this is the key that will be registered as minter
  const backendSigner = loadKeypairFromEnv(
    "BACKEND_SIGNER_SECRET",
    "Backend signer"
  );

  const [configPDA] = findConfigPDA(programId);
  console.log(`Config PDA:         ${configPDA.toBase58()}`);

  const [minterRolePDA] = findMinterRolePDA(backendSigner.publicKey, programId);
  console.log(`MinterRole PDA:     ${minterRolePDA.toBase58()}`);
  console.log(`Minter being added: ${backendSigner.publicKey.toBase58()}`);

  // RegisterMinterParams { minter: Pubkey, label: string, max_xp_per_call: u64 }
  // max_xp_per_call: 100 matches the server-side cap documented in CLAUDE.md
  const params = {
    minter: backendSigner.publicKey,
    label: "backend-signer",
    maxXpPerCall: new BN(100),
  };

  console.log(`\nParams:`);
  console.log(`  minter:          ${params.minter.toBase58()}`);
  console.log(`  label:           ${params.label}`);
  console.log(`  max_xp_per_call: ${params.maxXpPerCall.toString()}`);
  console.log("\nSending register_minter transaction...");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const signature: string = await program.methods
    .registerMinter(params)
    .accountsPartial({
      config: configPDA,
      minterRole: minterRolePDA,
      authority: authority.publicKey,
      payer: authority.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([authority])
    .rpc();

  console.log(`\nSuccess! Signature: ${signature}`);
  console.log(
    `Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`
  );
  console.log(
    `\nMinter ${backendSigner.publicKey.toBase58()} registered with max_xp_per_call=100`
  );
}

// ---------------------------------------------------------------------------
// Subcommand: sync-courses
// ---------------------------------------------------------------------------

async function cmdSyncCourses(): Promise<void> {
  console.log("\n=== Sync Courses ===\n");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    console.error(
      "Error: ADMIN_SECRET is not set. Cannot call admin API routes."
    );
    process.exit(1);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminSecret}`,
  };

  // Step 1: Fetch the list of courses and their sync status from the admin status endpoint
  console.log(
    `Fetching course sync status from ${baseUrl}/api/admin/status ...`
  );

  let statusData: AdminStatusResponse;
  try {
    const res = await fetch(`${baseUrl}/api/admin/status`, { headers });
    if (!res.ok) {
      const body = await res.text();
      console.error(
        `Error: GET /api/admin/status returned ${res.status}: ${body}`
      );
      process.exit(1);
    }
    statusData = (await res.json()) as AdminStatusResponse;
  } catch (e) {
    console.error(
      `Error: Failed to reach ${baseUrl}/api/admin/status: ${e instanceof Error ? e.message : String(e)}`
    );
    console.error(
      "Make sure the Next.js app is running (pnpm dev) and NEXT_PUBLIC_APP_URL is correct."
    );
    process.exit(1);
  }

  const courses = statusData.courses ?? [];
  console.log(`Found ${courses.length} course(s) in Sanity.`);

  const unsynced = courses.filter((c) => c.syncStatus !== "synced");
  console.log(`Courses not yet synced: ${unsynced.length}`);

  if (unsynced.length === 0) {
    console.log("All courses are already synced. Nothing to do.");
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const course of unsynced) {
    console.log(
      `\nSyncing course: ${course.courseId} (status: ${course.syncStatus})`
    );

    if (course.syncStatus === "draft") {
      console.log(`  Skipping — draft documents cannot be deployed.`);
      continue;
    }

    if (course.syncStatus === "missing_fields") {
      const missing = course.missingFields?.join(", ") ?? "unknown";
      console.log(`  Skipping — missing required fields: ${missing}`);
      failCount++;
      continue;
    }

    try {
      const syncRes = await fetch(`${baseUrl}/api/admin/courses/sync`, {
        method: "POST",
        headers,
        body: JSON.stringify({ courseId: course.courseId }),
      });

      const syncBody = (await syncRes.json()) as {
        success?: boolean;
        error?: string;
        signature?: string;
      };

      if (!syncRes.ok || !syncBody.success) {
        console.error(
          `  Error syncing ${course.courseId}: ${syncBody.error ?? syncRes.statusText}`
        );
        failCount++;
      } else {
        console.log(`  Synced. Signature: ${syncBody.signature ?? "n/a"}`);
        successCount++;
      }
    } catch (e) {
      console.error(
        `  Exception syncing ${course.courseId}: ${e instanceof Error ? e.message : String(e)}`
      );
      failCount++;
    }
  }

  console.log(`\n=== Courses Sync Summary ===`);
  console.log(`  Succeeded: ${successCount}`);
  console.log(`  Failed:    ${failCount}`);
  console.log(`  Skipped:   ${unsynced.length - successCount - failCount}`);

  if (failCount > 0) {
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Subcommand: sync-achievements
// ---------------------------------------------------------------------------

async function cmdSyncAchievements(): Promise<void> {
  console.log("\n=== Sync Achievements ===\n");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    console.error(
      "Error: ADMIN_SECRET is not set. Cannot call admin API routes."
    );
    process.exit(1);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminSecret}`,
  };

  // Step 1: Fetch achievement sync status
  console.log(
    `Fetching achievement sync status from ${baseUrl}/api/admin/status ...`
  );

  let statusData: AdminStatusResponse;
  try {
    const res = await fetch(`${baseUrl}/api/admin/status`, { headers });
    if (!res.ok) {
      const body = await res.text();
      console.error(
        `Error: GET /api/admin/status returned ${res.status}: ${body}`
      );
      process.exit(1);
    }
    statusData = (await res.json()) as AdminStatusResponse;
  } catch (e) {
    console.error(
      `Error: Failed to reach ${baseUrl}/api/admin/status: ${e instanceof Error ? e.message : String(e)}`
    );
    console.error(
      "Make sure the Next.js app is running (pnpm dev) and NEXT_PUBLIC_APP_URL is correct."
    );
    process.exit(1);
  }

  const achievements = statusData.achievements ?? [];
  console.log(`Found ${achievements.length} achievement(s) in Sanity.`);

  const unsynced = achievements.filter((a) => a.syncStatus !== "synced");
  console.log(`Achievements not yet synced: ${unsynced.length}`);

  if (unsynced.length === 0) {
    console.log("All achievements are already synced. Nothing to do.");
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const achievement of unsynced) {
    console.log(
      `\nSyncing achievement: ${achievement.achievementId} (status: ${achievement.syncStatus})`
    );

    if (achievement.syncStatus === "draft") {
      console.log(`  Skipping — draft documents cannot be deployed.`);
      continue;
    }

    if (achievement.syncStatus === "missing_fields") {
      const missing = achievement.missingFields?.join(", ") ?? "unknown";
      console.log(`  Skipping — missing required fields: ${missing}`);
      failCount++;
      continue;
    }

    try {
      const syncRes = await fetch(`${baseUrl}/api/admin/achievements/sync`, {
        method: "POST",
        headers,
        body: JSON.stringify({ achievementId: achievement.achievementId }),
      });

      const syncBody = (await syncRes.json()) as {
        success?: boolean;
        error?: string;
        signature?: string;
        collectionAddress?: string;
      };

      if (!syncRes.ok || !syncBody.success) {
        console.error(
          `  Error syncing ${achievement.achievementId}: ${syncBody.error ?? syncRes.statusText}`
        );
        failCount++;
      } else {
        console.log(`  Synced. Signature: ${syncBody.signature ?? "n/a"}`);
        if (syncBody.collectionAddress) {
          console.log(`  Collection address: ${syncBody.collectionAddress}`);
        }
        successCount++;
      }
    } catch (e) {
      console.error(
        `  Exception syncing ${achievement.achievementId}: ${e instanceof Error ? e.message : String(e)}`
      );
      failCount++;
    }
  }

  console.log(`\n=== Achievements Sync Summary ===`);
  console.log(`  Succeeded: ${successCount}`);
  console.log(`  Failed:    ${failCount}`);
  console.log(`  Skipped:   ${unsynced.length - successCount - failCount}`);

  if (failCount > 0) {
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Admin status API response types
// ---------------------------------------------------------------------------

interface CourseStatusEntry {
  courseId: string;
  syncStatus: string;
  missingFields?: string[];
}

interface AchievementStatusEntry {
  achievementId: string;
  syncStatus: string;
  missingFields?: string[];
}

interface AdminStatusResponse {
  courses?: CourseStatusEntry[];
  achievements?: AchievementStatusEntry[];
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Load env first so all subsequent reads pick up the values
  loadEnv();

  const command = process.argv[2];

  switch (command) {
    case "status":
      return await cmdStatus();
    case "initialize":
      return await cmdInitialize();
    case "register-minter":
      return await cmdRegisterMinter();
    case "sync-courses":
      return await cmdSyncCourses();
    case "sync-achievements":
      return await cmdSyncAchievements();
    default:
      console.error("Usage: pnpm tsx scripts/init-program.ts <command>");
      console.error("");
      console.error("Commands:");
      console.error("  status              Show Config PDA state on-chain");
      console.error(
        "  initialize          Call initialize instruction (creates Config + XP mint)"
      );
      console.error(
        "  register-minter     Call register_minter (registers BACKEND_SIGNER_SECRET as minter)"
      );
      console.error(
        "  sync-courses        Sync all Sanity courses to on-chain via admin API"
      );
      console.error(
        "  sync-achievements   Sync all Sanity achievements to on-chain via admin API"
      );
      process.exit(1);
  }
}

main().catch((e: unknown) => {
  console.error("\nFatal:", e instanceof Error ? e.message : String(e));
  if (e instanceof Error && e.stack) {
    console.error(e.stack);
  }
  process.exit(1);
});
