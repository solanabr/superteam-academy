#!/usr/bin/env tsx
/**
 * close-course.ts — audited CLOSE-ONLY tool for retiring one on-chain Course
 * PDA (built for the pre-reset cleanup of the old-era `solana-101` ghost
 * course, before the census must read a clean 6 courses).
 *
 * ⚠️  DESTRUCTIVE at --execute. Closes exactly ONE Course PDA, permanently.
 *
 * THE SINGLE AUDITED PATH. The close is performed by calling ONE function —
 * `closeCoursePda` from `@/lib/solana/admin-signer` — the EXACT function
 * `recreateCourse` (src/lib/admin/recreate-course.ts) calls to close a course
 * (`const closed = await closeCoursePda(courseId);`). This script contains NO
 * second `close_course` implementation; it only sequences a read, a devnet
 * pin, one call to that function, and a post-close re-read.
 *
 * SAFETY (default is DRY-RUN):
 *   - No --execute                          → DRY-RUN: reads and prints the
 *                                              Course PDA (size/creator via
 *                                              the length-aware `fetchCourse`
 *                                              from `@/lib/solana/academy-reads`).
 *                                              ZERO destructive calls.
 *   - --execute WITHOUT the exact token     → still DRY-RUN.
 *   - --execute --i-understand-this-closes-<courseId> → DESTRUCTIVE. Also
 *     re-asserts the RPC is devnet by genesis hash FIRST — `closeCoursePda`
 *     itself performs no network check, so this script owns that gate, and
 *     `closeCoursePda` is structurally unreachable if the assertion throws.
 *
 * RPC: `SOLANA_RPC_URL` — the EXACT server env `closeCoursePda`'s own
 * `initialize()` connects to internally (see admin-signer.ts), so the
 * pre-close read/pin can never target a different endpoint than the one that
 * actually performs the close. Never printed raw — see `redactUrl` /
 * `redactRpcUrls` below.
 *
 * OWNER-FIRED. Signs with the authority key loaded INSIDE `closeCoursePda`
 * (`PROGRAM_AUTHORITY_SECRET`). No key is ever embedded or printed here.
 *
 * Run (from apps/web):
 *
 *   # dry-run preview (safe, default):
 *   pnpm close-course --course-id aD45H1NEbb1bqELwloGCqI
 *
 *   # destructive (typed confirmation token must match --course-id exactly):
 *   pnpm close-course --course-id aD45H1NEbb1bqELwloGCqI \
 *     --execute --i-understand-this-closes-aD45H1NEbb1bqELwloGCqI
 *
 * `pnpm close-course` runs via a script-scoped tsconfig
 * (`scripts/close-course.tsconfig.json`) that stubs the `server-only` marker
 * module the admin-signer import graph carries, so it resolves under plain
 * `tsx` — WITHOUT `--conditions=react-server`, which would flip React into
 * its RSC-only subset and crash the run.
 */
import { pathToFileURL } from "node:url";
import { Connection, PublicKey } from "@solana/web3.js";
import { fetchCourse, type DecodedCourse } from "@/lib/solana/academy-reads";
import { closeCoursePda } from "@/lib/solana/admin-signer";
import { findCoursePDA, getProgramId } from "@/lib/solana/pda";

/**
 * Solana devnet's genesis hash (public, stable — devnet has never been
 * re-genesised). Mirrors the constant in `preflightRecreate`
 * (src/lib/admin/recreate-course.ts). `closeCoursePda` performs no network
 * check of its own, so this script is the ONLY thing standing between
 * `--execute` and a close on the wrong cluster — it must run before the close
 * unconditionally.
 */
export const DEVNET_GENESIS_HASH =
  "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

const RPC_URL_PATTERN = /https?:\/\/\S+/gi;

/**
 * Strip any bare URL from arbitrary text. A web3.js fetch error can embed the
 * full RPC URL (which may carry a privileged API key in its path or query) —
 * every error that reaches the console goes through this first.
 */
export function redactRpcUrls(text: string): string {
  return text.replace(RPC_URL_PATTERN, "[redacted-rpc-url]");
}

/** Host-only redaction for the one deliberate "connected to" info line. */
export function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "[unparseable-url]";
  }
}

export interface CloseCourseArgs {
  courseId: string | undefined;
  execute: boolean;
  /** True only when the exact `--i-understand-this-closes-<courseId>` token is present. */
  confirmed: boolean;
}

/** Pure argv parser — no I/O, so it's trivial to unit test. */
export function parseArgs(argv: string[]): CloseCourseArgs {
  let courseId: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--course-id") {
      courseId = argv[i + 1];
    }
  }
  const execute = argv.includes("--execute");
  const confirmed =
    courseId !== undefined &&
    argv.includes(`--i-understand-this-closes-${courseId}`);
  return { courseId, execute, confirmed };
}

/**
 * Authenticate the ACTUAL RPC connection as devnet, by genesis hash — never
 * just an env label. Fail-closed: any error fetching the hash, or a mismatch,
 * refuses. Mirrors the F3 check in `preflightRecreate`; unlike `recreateCourse`,
 * `closeCoursePda` performs no such check on its own, so this MUST run before
 * every `--execute` call in this script, and must throw (not just warn) on
 * any doubt.
 */
export async function assertDevnetGenesis(
  connection: Connection
): Promise<void> {
  let genesisHash: string;
  try {
    genesisHash = await connection.getGenesisHash();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      redactRpcUrls(
        `Could not verify the RPC's genesis hash (${message}) — refusing to close. ` +
          `An unverifiable RPC must never be treated as devnet for a destructive close.`
      )
    );
  }
  if (genesisHash !== DEVNET_GENESIS_HASH) {
    throw new Error(
      `RPC genesis hash "${genesisHash}" does not match devnet's (${DEVNET_GENESIS_HASH}) — ` +
        `refusing to close. This tool only closes courses on devnet.`
    );
  }
}

export interface ClosePreview {
  courseId: string;
  coursePda: string;
  exists: boolean;
  sizeBytes: number | null;
  creator: string | null;
  isActive: boolean | null;
  totalEnrollments: number | null;
  totalCompletions: number | null;
  decodeError: string | null;
}

/**
 * Read-only preview of the course that would be closed. Never mutates
 * anything — safe to call unconditionally, in both dry-run and --execute.
 */
export async function previewCourse(
  courseId: string,
  connection: Connection,
  programId: PublicKey
): Promise<ClosePreview> {
  const [coursePda] = findCoursePDA(courseId, programId);
  const accountInfo = await connection.getAccountInfo(coursePda);
  if (!accountInfo) {
    return {
      courseId,
      coursePda: coursePda.toBase58(),
      exists: false,
      sizeBytes: null,
      creator: null,
      isActive: null,
      totalEnrollments: null,
      totalCompletions: null,
      decodeError: null,
    };
  }

  let decoded: DecodedCourse | null = null;
  let decodeError: string | null = null;
  try {
    decoded = await fetchCourse(courseId, connection, programId);
  } catch (err) {
    decodeError = err instanceof Error ? err.message : String(err);
  }

  return {
    courseId,
    coursePda: coursePda.toBase58(),
    exists: true,
    sizeBytes: accountInfo.data.length,
    creator: decoded ? decoded.creator.toBase58() : null,
    isActive: decoded ? decoded.is_active : null,
    totalEnrollments: decoded ? decoded.total_enrollments : null,
    totalCompletions: decoded ? decoded.total_completions : null,
    decodeError,
  };
}

function formatPreview(preview: ClosePreview): string[] {
  const lines = [
    `Course id:    ${preview.courseId}`,
    `Course PDA:   ${preview.coursePda}`,
  ];
  if (!preview.exists) {
    lines.push("On-chain:     NOT deployed — nothing to close.");
    return lines;
  }
  lines.push(`On-chain:     deployed (${preview.sizeBytes} bytes)`);
  if (preview.decodeError) {
    lines.push(
      `Decode:       FAILED (${preview.decodeError}) — creator/flags unavailable`
    );
  } else {
    lines.push(`Creator:      ${preview.creator}`);
    lines.push(`Active:       ${preview.isActive}`);
    lines.push(`Enrollments:  ${preview.totalEnrollments}`);
    lines.push(`Completions:  ${preview.totalCompletions}`);
  }
  return lines;
}

/** A refusal that never touched the chain — always safe, never fatal to the caller's data. */
export class CloseCourseRefusal extends Error {}

export type CloseCourseOutcome =
  | { kind: "not-deployed" }
  | { kind: "dry-run" }
  | { kind: "refused-unconfirmed" }
  | { kind: "closed"; signature: string };

/**
 * The full orchestration for one course, given an already-resolved
 * Connection. Throws `CloseCourseRefusal` for bad input (never reaches the
 * chain), and a plain `Error` for anything destructive that failed (devnet
 * mismatch, `closeCoursePda` failure, or a failed post-close assertion).
 *
 * `log` receives human-readable progress lines (defaults to `console.error`,
 * kept off stdout so a caller can still use stdout for machine-readable
 * output later if it wants).
 */
export async function runCloseCourse(
  args: CloseCourseArgs,
  connection: Connection,
  programId: PublicKey,
  log: (line: string) => void = (line) => console.error(line)
): Promise<CloseCourseOutcome> {
  if (!args.courseId) {
    throw new CloseCourseRefusal(
      "Missing --course-id <id>. Usage: close-course --course-id <id> " +
        "[--execute --i-understand-this-closes-<id>]"
    );
  }
  const { courseId } = args;

  const preview = await previewCourse(courseId, connection, programId);
  for (const line of formatPreview(preview)) log(line);

  // Nothing to close — this is not an error state, and closeCoursePda must
  // never be called here regardless of --execute/the token.
  if (!preview.exists) {
    log("Nothing to close.");
    return { kind: "not-deployed" };
  }

  if (!args.execute) {
    log("DRY-RUN (no --execute) — no on-chain call made.");
    return { kind: "dry-run" };
  }
  if (!args.confirmed) {
    log(
      `DRY-RUN — --execute given without the exact token ` +
        `"--i-understand-this-closes-${courseId}" — no on-chain call made.`
    );
    return { kind: "refused-unconfirmed" };
  }

  // From here on, this is destructive. The devnet pin runs FIRST —
  // closeCoursePda is structurally unreachable below if this throws.
  await assertDevnetGenesis(connection);

  log(`Closing course "${courseId}" (${preview.coursePda})…`);
  const result = await closeCoursePda(courseId);
  if (!result.success) {
    throw new Error(
      redactRpcUrls(`closeCoursePda failed: ${result.error ?? "unknown error"}`)
    );
  }
  log(`Closed. signature=${result.signature}`);

  // Post-close assertion: re-read and confirm the PDA no longer decodes as a
  // live Course account. A closed account may not be instantly garbage
  // collected by the RPC's view, so "still present but undecodable" also
  // counts as closed — only "still decodes as a Course" is a hard failure.
  const [coursePda] = findCoursePDA(courseId, programId);
  const postInfo = await connection.getAccountInfo(coursePda);
  let stillDecodes = false;
  if (postInfo) {
    try {
      stillDecodes =
        (await fetchCourse(courseId, connection, programId)) !== null;
    } catch {
      stillDecodes = false;
    }
  }
  if (stillDecodes) {
    throw new Error(
      `Post-close assertion FAILED — course "${courseId}" PDA ` +
        `(${coursePda.toBase58()}) still decodes as a live Course account after close.`
    );
  }
  log(
    postInfo
      ? `Post-close: PDA account still present (${postInfo.data.length} bytes, pending GC) but no longer decodes as a Course — closed successfully.`
      : `Post-close: PDA account ${coursePda.toBase58()} no longer exists — closed successfully.`
  );

  return { kind: "closed", signature: result.signature! };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl) {
    throw new Error(
      "SOLANA_RPC_URL is required — this is the exact server env " +
        "closeCoursePda connects with internally, so it must be set for the " +
        "preview to reflect what --execute would actually target."
    );
  }

  const programId = getProgramId();
  const connection = new Connection(rpcUrl, "confirmed");
  console.error(`Program ${programId.toBase58()} | RPC ${redactUrl(rpcUrl)}`);

  const outcome = await runCloseCourse(args, connection, programId);
  if (outcome.kind === "refused-unconfirmed") {
    // Not a crash — the tool stayed safe — but a wrapper watching the exit
    // code should still be able to tell "asked for --execute, didn't happen"
    // apart from a plain informational dry-run preview.
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((err: unknown) => {
    console.error(
      redactRpcUrls(err instanceof Error ? err.message : String(err))
    );
    process.exitCode = 1;
  });
}
