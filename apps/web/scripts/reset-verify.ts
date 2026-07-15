#!/usr/bin/env tsx
/**
 * reset-verify.ts — the second-observer CLI for the B4 read-only reset
 * verification harness (#356).
 *
 * SAFE lane: this script only reads (`getProgramAccounts`) and diffs JSON —
 * it never builds, signs, or sends a transaction, and never touches the
 * close+recreate path (`src/lib/admin/recreate-course.ts`).
 *
 * Usage (run from apps/web):
 *
 *   pnpm tsx scripts/reset-verify.ts snapshot --out pre.json
 *     [--rpc <url>] [--program <programId>]
 *
 *     Reads every Course + Enrollment account live under the program and
 *     writes the structured snapshot as JSON to --out (or stdout if omitted).
 *
 *   pnpm tsx scripts/reset-verify.ts diff --pre pre.json --post post.json \
 *     --expected expected.json [--out result.json]
 *
 *     Diffs two saved snapshots against the expected per-course post-recreate
 *     values (see `ExpectedByCourseId` in reset-verify.ts) and prints/writes
 *     the structured pass/fail result. Exits 1 if any invariant failed, so it
 *     can gate a CI step or a human operator's "next course" decision.
 *
 *     `expected.json` shape: { "<courseId>": { "expectedSize": 253,
 *     "expectedCreator": "<base58>", "expectedRewardXp": 30 }, ... }
 *
 * Env (no key required — read-only over any RPC):
 *   --rpc / SOLANA_RPC_URL / NEXT_PUBLIC_SOLANA_RPC_URL, defaulting to the
 *   public devnet RPC.
 *   --program / NEXT_PUBLIC_PROGRAM_ID (required — no hardcoded program id).
 */
import * as fs from "node:fs";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  snapshotOnChainState,
  verifyReset,
  type ExpectedByCourseId,
  type ResetSnapshot,
} from "../src/lib/admin/reset-verify";

const DEFAULT_DEVNET_RPC = "https://api.devnet.solana.com";

interface ParsedArgs {
  command: string;
  flags: Record<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv;
  const flags: Record<string, string> = {};
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (token?.startsWith("--")) {
      const key = token.slice(2);
      const value = rest[i + 1];
      if (value === undefined || value.startsWith("--")) {
        flags[key] = "true";
      } else {
        flags[key] = value;
        i++;
      }
    }
  }
  return { command: command ?? "", flags };
}

function resolveRpcUrl(flags: Record<string, string>): string {
  return (
    flags.rpc ??
    process.env.SOLANA_RPC_URL ??
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
    DEFAULT_DEVNET_RPC
  );
}

function resolveProgramId(flags: Record<string, string>): PublicKey {
  const raw = flags.program ?? process.env.NEXT_PUBLIC_PROGRAM_ID;
  if (!raw) {
    throw new Error(
      "No program id given — pass --program <id> or set NEXT_PUBLIC_PROGRAM_ID"
    );
  }
  return new PublicKey(raw);
}

function writeOutput(json: unknown, outPath: string | undefined): void {
  const text = JSON.stringify(json, null, 2);
  if (outPath) {
    fs.writeFileSync(outPath, `${text}\n`, "utf8");
    console.error(`Wrote ${outPath}`);
  } else {
    console.log(text);
  }
}

function readJsonFile<T>(path: string): T {
  return JSON.parse(fs.readFileSync(path, "utf8")) as T;
}

async function runSnapshot(flags: Record<string, string>): Promise<void> {
  const rpcUrl = resolveRpcUrl(flags);
  const programId = resolveProgramId(flags);
  console.error(`Snapshotting program ${programId.toBase58()} via ${rpcUrl}…`);
  const connection = new Connection(rpcUrl, "confirmed");
  const snapshot = await snapshotOnChainState(connection, programId);
  console.error(
    `Courses: ${snapshot.courses.length} decoded, ${snapshot.undecodedCourses.length} undecoded. ` +
      `Enrollments: ${snapshot.enrollments.length} decoded, ${snapshot.undecodedEnrollments.length} undecoded.`
  );
  writeOutput(snapshot, flags.out);
}

function runDiff(flags: Record<string, string>): void {
  if (!flags.pre || !flags.post || !flags.expected) {
    throw new Error(
      "diff requires --pre <file> --post <file> --expected <file>"
    );
  }
  const pre = readJsonFile<ResetSnapshot>(flags.pre);
  const post = readJsonFile<ResetSnapshot>(flags.post);
  const expected = readJsonFile<ExpectedByCourseId>(flags.expected);

  const result = verifyReset(pre, post, expected);
  writeOutput(result, flags.out);

  if (!result.ok) {
    console.error(
      `\n${result.failures.length} invariant failure(s) — see "failures" above.`
    );
    process.exitCode = 1;
  } else {
    console.error("\nAll invariants passed.");
  }
}

async function main(): Promise<void> {
  const { command, flags } = parseArgs(process.argv.slice(2));
  switch (command) {
    case "snapshot":
      await runSnapshot(flags);
      break;
    case "diff":
      runDiff(flags);
      break;
    default:
      console.error(
        "Usage: tsx scripts/reset-verify.ts <snapshot|diff> [flags]\n" +
          "  snapshot --out <file> [--rpc <url>] [--program <id>]\n" +
          "  diff --pre <file> --post <file> --expected <file> [--out <file>]"
      );
      process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
