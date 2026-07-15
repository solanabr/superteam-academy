#!/usr/bin/env tsx
/**
 * reset-vnext.ts — B3, the bulk v-next devnet reset orchestration script (#356).
 *
 * ⚠️  DESTRUCTIVE. Run with `--execute` (plus the typed confirmation token) and
 * this CLOSES and RECREATES every on-chain Course PDA. It is the platform's most
 * destructive operation. HELD for the deploy window: it runs ONLY after B1's
 * v-next write-path cutover and the v-next program deploy have landed.
 *
 * THE SINGLE AUDITED PATH. The close+recreate is performed by calling ONE
 * function — `recreateCourse` from `src/lib/admin/recreate-course.ts`, the exact
 * function the admin UI route calls. This script contains NO second
 * close/create/`close_course` implementation; it only sequences calls to
 * `recreateCourse` and runs the frozen B4 `verifyReset` between each. The devnet
 * genesis-hash pin and the mainnet hard-refuse live INSIDE `recreateCourse`'s
 * preflight and are inherited here unchanged.
 *
 * SAFETY (default is DRY-RUN):
 *   - No `--execute`               → DRY-RUN: census + read-only per-course
 *                                    `preflightRecreate`, printing what WOULD
 *                                    change. ZERO destructive calls.
 *   - `--execute` WITHOUT the token → still DRY-RUN.
 *   - `--execute --i-understand-this-destroys-<N>-courses` (N = the live course
 *                                    count) → DESTRUCTIVE. Also re-asserts the
 *                                    RPC is devnet by genesis hash first.
 *
 * The primary RPC is `SOLANA_RPC_URL` — the EXACT endpoint `recreateCourse`
 * writes to — so the census/verify and the destroy can never target different
 * clusters. `--rpc2 <url>` adds an independent second-RPC completeness
 * cross-check on the PRE census (closes B4's single-RPC blind spot). Neither URL
 * is ever printed raw (they may carry a key) — only a redacted host.
 *
 * OWNER-FIRED. Signs with the authority key via the server env
 * (`PROGRAM_AUTHORITY_SECRET`, loaded inside `recreateCourse`). No key is ever
 * embedded or printed here.
 *
 * Run (from apps/web):
 *
 *   # dry-run readiness check (safe):
 *   pnpm reset-vnext --expect-courses 6 --expect-enrollments 42
 *
 *   # destructive (deploy window only):
 *   pnpm reset-vnext --expect-courses 6 --expect-enrollments 42 \
 *     --execute --i-understand-this-destroys-6-courses
 *
 * `pnpm reset-vnext` == `tsx --tsconfig scripts/tsconfig.reset.json
 * scripts/reset-vnext.ts`. That script-scoped tsconfig stubs the `server-only`
 * marker module (which the recreate path imports) to an empty module so it
 * resolves under tsx — WITHOUT the `--conditions=react-server` flag, which would
 * flip React into its RSC-only subset and crash the run.
 */
import { Connection } from "@solana/web3.js";
import { serverEnv } from "@/lib/env.server";
import { getProgramId } from "@/lib/solana/pda";
import { getAllCoursesAdmin } from "@/lib/content/queries";
import { snapshotOnChainState, verifyReset } from "@/lib/admin/reset-verify";
import { preflightRecreate, recreateCourse } from "@/lib/admin/recreate-course";
import {
  ALLOW_UNUSUAL_CREATOR,
  assertCensusComplete,
  assertDevnetGenesis,
  bindRecreate,
  buildExpected,
  DEFAULT_CREATOR_REWARD_XP,
  orchestrateReset,
  parseCensusExpectation,
  parseFlags,
  resolveMode,
  ResetStopError,
} from "@/lib/admin/reset-orchestrator";

const USAGE = `reset-vnext — bulk v-next devnet reset (B3, #356)

Required:
  --expect-courses <N>       the live on-chain Course count (completeness baseline)
  --expect-enrollments <M>   the live on-chain Enrollment count (completeness baseline)

Destruction (both required, else DRY-RUN):
  --execute
  --i-understand-this-destroys-<N>-courses    N must equal the live course count

Optional:
  --rpc2 <url>               independent second RPC for a PRE-census cross-check
  --expect-reward-xp <N>     expected creator_reward_xp (default ${DEFAULT_CREATOR_REWARD_XP})
  --help

Default (no --execute) is a read-only DRY-RUN. Primary RPC = SOLANA_RPC_URL.`;

/** Redact any userinfo/query (a key may live there) — log a host+path only. */
function redactUrl(raw: string): string {
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return "<unparseable-url>";
  }
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));
  if (flags.help === "true") {
    console.error(USAGE);
    return;
  }

  const censusExpectation = parseCensusExpectation(flags);
  const rewardXp =
    flags["expect-reward-xp"] !== undefined &&
    flags["expect-reward-xp"] !== "true"
      ? Number(flags["expect-reward-xp"])
      : DEFAULT_CREATOR_REWARD_XP;

  const programId = getProgramId();
  const primaryConnection = new Connection(
    serverEnv.SOLANA_RPC_URL,
    "confirmed"
  );
  console.error(
    `Program ${programId.toBase58()} | primary RPC ${redactUrl(serverEnv.SOLANA_RPC_URL)} (the endpoint recreateCourse writes to)`
  );

  // STEP 1 — initial full census + completeness guard (optionally cross-RPC).
  console.error("Taking PRE census…");
  const preSnapshot = await snapshotOnChainState(primaryConnection, programId);
  console.error(
    `PRE census: ${preSnapshot.courses.length} course(s) (${preSnapshot.undecodedCourses.length} undecoded), ` +
      `${preSnapshot.enrollments.length} enrollment(s) (${preSnapshot.undecodedEnrollments.length} undecoded).`
  );

  let secondarySnapshot = undefined;
  if (flags.rpc2 && flags.rpc2 !== "true") {
    console.error(
      `Cross-checking against second RPC ${redactUrl(flags.rpc2)}…`
    );
    const secondaryConnection = new Connection(flags.rpc2, "confirmed");
    secondarySnapshot = await snapshotOnChainState(
      secondaryConnection,
      programId
    );
  }

  assertCensusComplete(preSnapshot, censusExpectation, secondarySnapshot);
  console.error("Census completeness guard passed.");

  // STEP 2 — build the expected map for ALL on-chain courses (never omit one).
  const allCourses = await getAllCoursesAdmin();
  const censusIds = new Set(preSnapshot.courses.map((c) => c.courseId));
  const bundleForCensus = allCourses.filter((c) => censusIds.has(c._id));
  const expected = buildExpected(bundleForCensus, rewardXp);

  // Mode: dry-run by default; destruction requires --execute + the typed token.
  const mode = resolveMode(flags, preSnapshot.courses.length);
  console.error(mode.note);

  // Belt-and-suspenders: authenticate the RPC as devnet before ANY destruction
  // (recreateCourse re-checks this internally too).
  if (mode.execute) {
    const genesisHash = await primaryConnection.getGenesisHash();
    assertDevnetGenesis(genesisHash);
    console.error(`Devnet genesis confirmed (${genesisHash}).`);
    console.error(`allowUnusualCreator is pinned to ${ALLOW_UNUSUAL_CREATOR}.`);
  }

  const result = await orchestrateReset(
    {
      snapshot: () => snapshotOnChainState(primaryConnection, programId),
      preflight: (courseId) =>
        preflightRecreate(courseId, primaryConnection, ALLOW_UNUSUAL_CREATOR),
      recreate: bindRecreate(recreateCourse),
      verify: verifyReset,
      log: (line) => console.error(line),
    },
    { preSnapshot, expected, execute: mode.execute }
  );

  if (result.dryRun) {
    console.error("\n✔ DRY-RUN OK — no on-chain state was changed.");
  } else {
    console.error(
      `\n✔ RESET COMPLETE — recreated ${result.recreated.length} course(s): ${result.recreated.join(", ")}`
    );
  }
}

main().catch((err) => {
  if (err instanceof ResetStopError) {
    console.error(`\n✖ STOP [${err.phase}]: ${err.message}`);
    for (const f of err.failures) console.error(`   - ${f}`);
  } else {
    console.error(`\n✖ ${err instanceof Error ? err.message : String(err)}`);
  }
  process.exitCode = 1;
});
