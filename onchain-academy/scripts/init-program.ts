#!/usr/bin/env tsx
/**
 * init-program.ts — operator CLI for the program's one-time setup and its
 * Config-level writes. The single entry point for `initialize`.
 *
 *   npx tsx onchain-academy/scripts/init-program.ts <command> --cluster devnet|mainnet [flags]
 *
 * Commands:
 *   status            Config, upgrade authority, and the backend minter role.
 *   initialize        Create Config + the XP mint. The signer must be the
 *                     program's upgrade authority. Run it right after deploy.
 *   rotate-backend    update_config(new_backend_signer), retiring the current
 *                     backend's ["minter", old] role.
 *   register-minter   register_minter with explicit caps (backend by default);
 *                     a 0 per-call cap needs --allow-unlimited; the lifetime
 *                     cap can never be 0.
 *   set-paused        update_config(paused): the minting kill switch.
 *
 * Every write is a dry run unless `--yes` is passed. Each one checks the signer
 * against the chain first and reads the result back after; any failure exits
 * non-zero.
 *
 * Flags:
 *   --cluster devnet|mainnet   required; the RPC's genesis hash must match
 *   --program-id <id>          else ACADEMY_PROGRAM_ID, else NEXT_PUBLIC_PROGRAM_ID
 *   --keypair <path>           signer keypair file; else PROGRAM_AUTHORITY_SECRET.
 *                              A bare --keypair is an error. The signer's source
 *                              and public key are printed, dry run or not.
 *   --yes                      send (otherwise print the plan only)
 *
 * The RPC comes from SOLANA_RPC_URL (else NEXT_PUBLIC_SOLANA_RPC_URL). Env vars
 * may also come from the repo's `.env.local` / `apps/web/.env.local`. This
 * script never prints the RPC URL or any secret key.
 */

import * as fs from "fs";
import * as path from "path";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  DEFAULT_BACKEND_MAX_XP_PER_CALL,
  UsageError,
  assertGenesis,
  buildInitializeIx,
  buildRegisterMinterIx,
  buildUpdateConfigIx,
  configPda,
  decodeConfig,
  decodeMinterRole,
  decodeProgramData,
  describeSignerSource,
  flagValue,
  keypairFromBytes,
  minterRolePda,
  parseArgs,
  parseBool,
  parsePubkey,
  parseU64,
  programDataAddress,
  readKeypairFile,
  redactUrls,
  resolveCluster,
  resolveProgramId,
  resolveSignerSource,
  writeKeypairFile,
  type Cluster,
  type ConfigState,
} from "./lib/program-admin";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
/** Generated XP mint keypairs land here (gitignored), never in the cwd. */
const WALLETS_DIR = path.resolve(__dirname, "..", "wallets");

const USAGE = `Usage: npx tsx onchain-academy/scripts/init-program.ts <command> --cluster devnet|mainnet [flags]

Commands:
  status
  initialize        [--xp-mint-keypair <path>]
  rotate-backend    [--backend <pubkey>]          (default: BACKEND_SIGNER_SECRET's pubkey)
  register-minter   --max-total-xp <n> [--minter <pubkey>] [--label backend] [--max-xp-per-call 100]
                    (--max-xp-per-call 0 needs --allow-unlimited; --max-total-xp is never 0)
  set-paused        --paused true|false

Common flags: --program-id <id>  --keypair <path>  --yes`;

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/** Loads the first env file found; never overrides the process env or prints values. */
function loadEnvFile(): void {
  const candidates = [
    path.join(REPO_ROOT, ".env.local"),
    path.join(REPO_ROOT, "apps", "web", ".env.local"),
    path.join(REPO_ROOT, ".env"),
    path.join(REPO_ROOT, "apps", "web", ".env"),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
    console.log(`[env] loaded ${path.relative(REPO_ROOT, file)}`);
    return;
  }
}

/**
 * The signer, from `--keypair <path>` or PROGRAM_AUTHORITY_SECRET. A bare
 * `--keypair` is an error, not a fallback to the env key. Prints the source
 * and the public key (never the secret), in dry runs too.
 */
function signerFrom(flags: Record<string, string>): Keypair {
  const source = resolveSignerSource(flags, process.env);
  let signer: Keypair;
  if (source.kind === "file") {
    signer = readKeypairFile(path.resolve(source.path));
  } else {
    let parsed: unknown;
    try {
      parsed = JSON.parse(process.env.PROGRAM_AUTHORITY_SECRET ?? "");
    } catch {
      throw new UsageError("PROGRAM_AUTHORITY_SECRET is not a JSON byte array");
    }
    signer = keypairFromBytes(parsed, "PROGRAM_AUTHORITY_SECRET");
  }
  console.log(
    `[signer] ${signer.publicKey.toBase58()} (from ${describeSignerSource(source)})`
  );
  return signer;
}

interface Ctx {
  cluster: Cluster;
  connection: Connection;
  programId: PublicKey;
  flags: Record<string, string>;
  send: boolean;
}

async function connect(flags: Record<string, string>): Promise<Ctx> {
  const cluster = resolveCluster(flags);
  const rpcUrl =
    process.env.SOLANA_RPC_URL ?? process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (!rpcUrl) {
    throw new UsageError("Set SOLANA_RPC_URL (or NEXT_PUBLIC_SOLANA_RPC_URL)");
  }
  const connection = new Connection(rpcUrl, "confirmed");
  assertGenesis(cluster, await connection.getGenesisHash());
  const programId = resolveProgramId(flags, process.env);
  console.log(`[rpc] ${cluster} (genesis hash verified)`);
  console.log(`[program] ${programId.toBase58()}`);
  return { cluster, connection, programId, flags, send: flags.yes === "true" };
}

// ---------------------------------------------------------------------------
// Chain reads
// ---------------------------------------------------------------------------

async function readConfig(ctx: Ctx): Promise<ConfigState | null> {
  const info = await ctx.connection.getAccountInfo(configPda(ctx.programId));
  return info ? decodeConfig(info.data) : null;
}

async function requireConfig(ctx: Ctx): Promise<ConfigState> {
  const config = await readConfig(ctx);
  if (!config)
    throw new UsageError("Config does not exist: run initialize first");
  return config;
}

async function readUpgradeAuthority(ctx: Ctx): Promise<PublicKey | null> {
  const info = await ctx.connection.getAccountInfo(
    programDataAddress(ctx.programId)
  );
  if (!info) {
    throw new UsageError(
      "No ProgramData account for this program id: it is not deployed with the upgradeable loader"
    );
  }
  return decodeProgramData(info.data).upgradeAuthority;
}

function requireAuthority(config: ConfigState, signer: Keypair): void {
  if (!config.authority.equals(signer.publicKey)) {
    throw new UsageError(
      `The signer ${signer.publicKey.toBase58()} is not Config.authority (${config.authority.toBase58()})`
    );
  }
}

/** Sends `ixs` when `--yes` was passed; otherwise reports the dry run. */
async function sendOrDryRun(
  ctx: Ctx,
  label: string,
  ixs: TransactionInstruction[],
  signers: Keypair[]
): Promise<boolean> {
  if (!ctx.send) {
    console.log(
      `\nDry run: ${label} was not sent. Re-run with --yes to send it.`
    );
    return false;
  }
  const signature = await sendAndConfirmTransaction(
    ctx.connection,
    new Transaction().add(...ixs),
    signers,
    { commitment: "confirmed" }
  );
  console.log(`\n${label} landed: ${signature}`);
  return true;
}

function fail(message: string): never {
  console.error(`\nFAILED: ${message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdStatus(ctx: Ctx): Promise<void> {
  const upgradeAuthority = await readUpgradeAuthority(ctx);
  console.log(
    `\nupgrade authority: ${upgradeAuthority?.toBase58() ?? "none (immutable)"}`
  );
  const config = await readConfig(ctx);
  if (!config) {
    console.log("Config: NOT INITIALIZED");
    return;
  }
  console.log(`Config ${configPda(ctx.programId).toBase58()}`);
  console.log(`  authority:      ${config.authority.toBase58()}`);
  console.log(`  backend_signer: ${config.backendSigner.toBase58()}`);
  console.log(`  xp_mint:        ${config.xpMint.toBase58()}`);
  console.log(`  paused:         ${config.paused}`);
  console.log(`  course_nonce:   ${config.courseNonce}`);
  const role = await ctx.connection.getAccountInfo(
    minterRolePda(config.backendSigner, ctx.programId)
  );
  if (!role) {
    console.log("backend minter role: none");
    return;
  }
  const r = decodeMinterRole(role.data);
  console.log(
    `backend minter role: label=${r.label} active=${r.isActive} max_xp_per_call=${r.maxXpPerCall} ` +
      `max_total_xp=${r.maxTotalXp} (0 = unlimited) minted=${r.totalXpMinted}`
  );
  if (config.backendSigner.equals(config.authority)) {
    console.log(
      "\nNote: backend_signer is still the authority. Run rotate-backend, then register-minter."
    );
  }
}

async function cmdInitialize(ctx: Ctx): Promise<void> {
  const signer = signerFrom(ctx.flags);
  if (await readConfig(ctx)) {
    fail("Config already exists: this program is initialized. Run status.");
  }
  const upgradeAuthority = await readUpgradeAuthority(ctx);
  if (!upgradeAuthority?.equals(signer.publicKey)) {
    fail(
      `initialize must be signed by the program's upgrade authority ` +
        `(${upgradeAuthority?.toBase58() ?? "none: the program is immutable"}); ` +
        `the signer is ${signer.publicKey.toBase58()}`
    );
  }

  const mintFlag = flagValue(ctx.flags, "xp-mint-keypair");
  let xpMint: Keypair;
  if (mintFlag !== undefined) {
    xpMint = readKeypairFile(path.resolve(mintFlag));
    console.log(`XP mint (from file): ${xpMint.publicKey.toBase58()}`);
  } else {
    xpMint = Keypair.generate();
    if (ctx.send) {
      const file = writeKeypairFile(
        WALLETS_DIR,
        `xp-mint-${xpMint.publicKey.toBase58()}.json`,
        xpMint
      );
      console.log(
        `XP mint (new): ${xpMint.publicKey.toBase58()}, keypair saved to ${file} (0600)`
      );
    } else {
      console.log(
        `XP mint: a new keypair would be generated and saved under ${WALLETS_DIR}`
      );
    }
  }
  console.log(
    `authority / initial backend signer: ${signer.publicKey.toBase58()}`
  );

  const ix = buildInitializeIx(
    ctx.programId,
    signer.publicKey,
    xpMint.publicKey
  );
  if (!(await sendOrDryRun(ctx, "initialize", [ix], [signer, xpMint]))) return;

  const config = await readConfig(ctx);
  if (
    !config ||
    !config.authority.equals(signer.publicKey) ||
    !config.backendSigner.equals(signer.publicKey) ||
    !config.xpMint.equals(xpMint.publicKey)
  ) {
    fail("Config read back does not match what initialize should have written");
  }
  console.log("Config verified: authority, backend_signer and xp_mint match.");
  console.log(
    "\nNext: rotate-backend to the backend key, then register-minter with caps. " +
      "Set NEXT_PUBLIC_XP_MINT_ADDRESS to the mint above."
  );
}

async function cmdRotateBackend(ctx: Ctx): Promise<void> {
  const signer = signerFrom(ctx.flags);
  const config = await requireConfig(ctx);
  requireAuthority(config, signer);

  let backend: PublicKey;
  const backendFlag = flagValue(ctx.flags, "backend");
  if (backendFlag !== undefined) {
    backend = parsePubkey(backendFlag, "--backend");
  } else if (process.env.BACKEND_SIGNER_SECRET) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(process.env.BACKEND_SIGNER_SECRET);
    } catch {
      throw new UsageError("BACKEND_SIGNER_SECRET is not a JSON byte array");
    }
    backend = keypairFromBytes(parsed, "BACKEND_SIGNER_SECRET").publicKey;
  } else {
    throw new UsageError(
      "Pass --backend <pubkey> or set BACKEND_SIGNER_SECRET"
    );
  }
  if (backend.equals(PublicKey.default))
    fail("Refusing the zero pubkey as backend signer");
  if (backend.equals(config.backendSigner)) {
    console.log(
      `backend_signer is already ${backend.toBase58()}: nothing to do.`
    );
    return;
  }

  const oldRole = minterRolePda(config.backendSigner, ctx.programId);
  console.log(
    `backend_signer: ${config.backendSigner.toBase58()} -> ${backend.toBase58()}`
  );
  console.log(
    `retires minter role ${oldRole.toBase58()} (of the current backend)`
  );
  const ix = buildUpdateConfigIx(
    ctx.programId,
    signer.publicKey,
    { newBackendSigner: backend },
    config.backendSigner
  );
  if (
    !(await sendOrDryRun(ctx, "update_config (rotate backend)", [ix], [signer]))
  )
    return;

  const after = await requireConfig(ctx);
  if (!after.backendSigner.equals(backend))
    fail("backend_signer did not change");
  const role = await ctx.connection.getAccountInfo(oldRole);
  if (role && decodeMinterRole(role.data).isActive)
    fail("the old backend's minter role is still active");
  console.log("Verified: backend_signer rotated and the old role is inactive.");
  console.log(
    "\nNext: register-minter --max-total-xp <budget> for the new backend, then deploy BACKEND_SIGNER_SECRET."
  );
}

async function cmdRegisterMinter(ctx: Ctx): Promise<void> {
  const signer = signerFrom(ctx.flags);
  const config = await requireConfig(ctx);
  requireAuthority(config, signer);

  const minterFlag = flagValue(ctx.flags, "minter");
  const minter =
    minterFlag !== undefined
      ? parsePubkey(minterFlag, "--minter")
      : config.backendSigner;
  const label = flagValue(ctx.flags, "label") ?? "backend";
  const maxXpPerCall = parseU64(
    ctx.flags,
    "max-xp-per-call",
    DEFAULT_BACKEND_MAX_XP_PER_CALL
  );
  const maxTotalXp = parseU64(ctx.flags, "max-total-xp");
  const allowUnlimited = ctx.flags["allow-unlimited"] === "true";

  const rolePda = minterRolePda(minter, ctx.programId);
  if (await ctx.connection.getAccountInfo(rolePda)) {
    fail(
      `A minter role already exists for ${minter.toBase58()} (${rolePda.toBase58()})`
    );
  }
  console.log(`minter ${minter.toBase58()} label=${label}`);
  console.log(`max_xp_per_call=${maxXpPerCall} max_total_xp=${maxTotalXp}`);
  const ix = buildRegisterMinterIx(ctx.programId, signer.publicKey, {
    minter,
    label,
    maxXpPerCall,
    maxTotalXp,
    allowUnlimited,
  });
  if (maxXpPerCall === 0n) {
    console.log(
      "WARNING: the per-call cap is UNLIMITED on-chain (--allow-unlimited)."
    );
  }
  if (!(await sendOrDryRun(ctx, "register_minter", [ix], [signer]))) return;

  const role = await ctx.connection.getAccountInfo(rolePda);
  if (!role) fail("the minter role was not created");
  const r = decodeMinterRole(role.data);
  if (
    !r.isActive ||
    r.maxXpPerCall !== maxXpPerCall ||
    r.maxTotalXp !== maxTotalXp
  ) {
    fail("the minter role read back does not match the requested caps");
  }
  console.log("Verified: minter role active with the requested caps.");
}

async function cmdSetPaused(ctx: Ctx): Promise<void> {
  const signer = signerFrom(ctx.flags);
  const paused = parseBool(ctx.flags, "paused");
  const config = await requireConfig(ctx);
  requireAuthority(config, signer);
  if (config.paused === paused) {
    console.log(`paused is already ${paused}: nothing to do.`);
    return;
  }
  console.log(`paused: ${config.paused} -> ${paused}`);
  const ix = buildUpdateConfigIx(ctx.programId, signer.publicKey, { paused });
  if (!(await sendOrDryRun(ctx, "update_config (paused)", [ix], [signer])))
    return;
  if ((await requireConfig(ctx)).paused !== paused)
    fail("paused did not change");
  console.log(`Verified: paused = ${paused}.`);
}

const COMMANDS: Record<string, (ctx: Ctx) => Promise<void>> = {
  status: cmdStatus,
  initialize: cmdInitialize,
  "rotate-backend": cmdRotateBackend,
  "register-minter": cmdRegisterMinter,
  "set-paused": cmdSetPaused,
};

async function main(): Promise<void> {
  const { command, flags } = parseArgs(process.argv.slice(2));
  const run = command ? COMMANDS[command] : undefined;
  if (!run) {
    console.error(USAGE);
    process.exit(1);
  }
  loadEnvFile();
  await run(await connect(flags));
}

main().catch((e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  console.error(
    `\n${e instanceof UsageError ? "" : "Error: "}${redactUrls(message)}`
  );
  if (e instanceof UsageError) console.error(`\n${USAGE}`);
  process.exit(1);
});
