#!/usr/bin/env tsx
/**
 * cs8-verify-bits.ts — §15.3 bit-verification (safety gate G2 for CS-4/#356, CS-8/#359)
 *
 * READ-ONLY. Reads live DB (Supabase) + live Sanity + devnet on-chain state, asserts the
 * §15.3 invariant, prints a report. WRITES NOTHING to any of them. No secrets printed.
 *
 * The invariant (spec docs/superpowers/specs/2026-07-09-course-content-standard-design.md §15.3):
 *   `Enrollment.lesson_flags` bits were set by lesson ARRAY POSITION in the flattened
 *   `modules[].lessons[]` order. BEFORE freezing slots.lock / resetting courses (close_course),
 *   verify each completed `user_progress` row maps to a SET bit at its lesson's position in
 *   TODAY's live order. A mismatch means the destructive reset would corrupt real progress → STOP.
 *
 * Run from apps/web (deps resolve from apps/web/node_modules):
 *   pnpm tsx scripts/cs8-verify-bits.ts
 *   (reads apps/web/.env.local; override the file with ENV_FILE=/path/to/.env)
 *
 * Data sources (the app's existing config/helpers):
 *   - DB     : @supabase/supabase-js with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *              (mirrors lib/supabase/admin.ts createAdminClient()).
 *   - Sanity : next-sanity createClient with NEXT_PUBLIC_SANITY_PROJECT_ID/dataset, no token,
 *              published perspective (mirrors lib/sanity/client.ts). GROQ replicates
 *              getCourseById's ordering (modules | order(order asc); lessons | order(order asc)).
 *   - Chain  : @solana/web3.js Connection to devnet; Enrollment PDA via lib/solana/pda.ts;
 *              lesson_flags decoded via lib/solana/academy-reads.ts fetchEnrollment (raw
 *              BorshCoder → snake_case `lesson_flags: [u64;4]`).
 *
 * Reused app helpers (load-bearing): findLessonIndex, isLessonComplete, findEnrollmentPDA,
 * fetchEnrollment. Clients are constructed directly (the app's admin.ts / client.ts pull
 * `server-only` + zod env and cannot run outside Next).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");

// --- env loading (parse .env.local; do NOT overwrite already-set vars) ---
function loadEnv(file: string): void {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
loadEnv(process.env.ENV_FILE ?? path.join(APP_ROOT, ".env.local"));

import { Connection, PublicKey } from "@solana/web3.js";
import { utils } from "@coral-xyz/anchor";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { createClient as createSanity } from "next-sanity";

import { findLessonIndex } from "../src/lib/courses/lesson-index";
import { isLessonComplete } from "../src/lib/solana/bitmap";
import { findEnrollmentPDA } from "../src/lib/solana/pda";
import { fetchEnrollment } from "../src/lib/solana/academy-reads";
import IDL from "../src/lib/solana/idl/superteam_academy.json";

const EXPECTED_ENROLLMENTS = 13; // spec §15.1 snapshot (2026-07-09)
const PROGRAM_ID = "7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V";

// --- types ---
interface ProgressRow {
  user_id: string;
  course_id: string;
  lesson_id: string;
  lesson_index: number | null;
  completed_at: string | null;
}
interface ProfileRow {
  id: string;
  wallet_address: string | null;
  username: string | null;
}
interface SanityStructure {
  modules: { lessons: ({ _id: string } | null)[] | null }[] | null;
}
interface DecodedEnrollment {
  lesson_flags: Array<{ toString(): string }>;
  completed_at: { toString(): string } | null;
}
interface EnrollmentState {
  found: boolean;
  pda: string;
  flags: bigint[] | null;
  popcount: number | null;
}
interface RowResult {
  userShort: string;
  courseId: string;
  lessonId: string;
  slot: number; // index in TODAY's live flattened order (-1 if absent)
  dbIndex: number | null; // completion-time index stored in user_progress
  bitSetAtSlot: boolean;
  bitSetAtDbIndex: boolean | null;
  indexMatch: boolean | null; // dbIndex === slot (null when dbIndex null)
  verdict: "PASS" | "FAIL" | "FLAG";
  reason: string;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(
      `FATAL: missing required env var ${name} — cannot proceed. Aborting.`
    );
    process.exit(2);
  }
  return v;
}

function maskHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "<unparseable>";
  }
}

function popcount256(words: bigint[]): number {
  let n = 0;
  for (const w of words) {
    let x = w;
    while (x > 0n) {
      n += Number(x & 1n);
      x >>= 1n;
    }
  }
  return n;
}

// Flatten a Sanity course structure into ordered lesson ids, preserving dangling
// (null) references as positional placeholders so bitmap slot alignment matches the
// app's findLessonIndex exactly. Returns the sanitized shape + a dangling count.
function sanitizeStructure(s: SanityStructure): {
  course: { modules: { lessons: { _id: string }[] }[] };
  dangling: number;
} {
  let dangling = 0;
  const modules = (s.modules ?? []).map((m) => ({
    lessons: (m.lessons ?? []).map((l, i) => {
      if (l && typeof l._id === "string") return { _id: l._id };
      dangling += 1;
      return { _id: `__dangling_${i}_${Math.random().toString(36).slice(2)}` };
    }),
  }));
  return { course: { modules }, dangling };
}

async function main(): Promise<void> {
  const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const SUPABASE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const SANITY_PROJECT = requireEnv("NEXT_PUBLIC_SANITY_PROJECT_ID");
  const SANITY_DATASET = requireEnv("NEXT_PUBLIC_SANITY_DATASET");
  const ENV_PROGRAM_ID = requireEnv("NEXT_PUBLIC_PROGRAM_ID");

  if (ENV_PROGRAM_ID !== PROGRAM_ID) {
    console.error(
      `FATAL: NEXT_PUBLIC_PROGRAM_ID (${ENV_PROGRAM_ID}) != expected devnet program ${PROGRAM_ID}. Aborting.`
    );
    process.exit(2);
  }
  const programId = new PublicKey(PROGRAM_ID);

  // RPC selection: prefer a devnet Helius/SOLANA_RPC_URL; fall back to public devnet.
  // Never touch mainnet (reads only, but keep the guard explicit).
  const candidates = [
    process.env.SOLANA_RPC_URL,
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  ].filter((u): u is string => typeof u === "string" && u.length > 0);
  let rpcUrl = "https://api.devnet.solana.com";
  for (const c of candidates) {
    const host = maskHost(c).toLowerCase();
    if (host.includes("mainnet")) {
      console.error(
        `FATAL: RPC host ${host} looks like mainnet. Aborting (devnet only).`
      );
      process.exit(2);
    }
    if (host.includes("devnet")) {
      rpcUrl = c;
      break;
    }
  }
  const rpcHost = maskHost(rpcUrl);
  if (!rpcHost.toLowerCase().includes("devnet")) {
    console.error(
      `FATAL: resolved RPC host ${rpcHost} is not devnet. Aborting.`
    );
    process.exit(2);
  }
  const connection = new Connection(rpcUrl, "confirmed");

  const supabase = createSupabase(SUPABASE_URL, SUPABASE_KEY);
  const sanity = createSanity({
    projectId: SANITY_PROJECT,
    dataset: SANITY_DATASET,
    apiVersion: "2024-01-01",
    useCdn: false,
    perspective: "published",
  });

  console.log("=".repeat(78));
  console.log(
    "§15.3 BIT-VERIFICATION (G2)  —  READ-ONLY  —  CS-4/#356, CS-8/#359"
  );
  console.log("=".repeat(78));
  console.log(`DB     : ${maskHost(SUPABASE_URL)} (service-role read)`);
  console.log(
    `Sanity : project=${SANITY_PROJECT} dataset=${SANITY_DATASET} (published, no token)`
  );
  console.log(`Chain  : ${rpcHost}  program=${PROGRAM_ID}`);
  console.log("");

  // --- 1. DB: all completed user_progress rows + wallet map ---
  const { data: rawRows, error: rowErr } = await supabase
    .from("user_progress")
    .select("user_id,course_id,lesson_id,lesson_index,completed_at")
    .eq("completed", true);
  if (rowErr) {
    console.error(
      `FATAL: DB read of user_progress failed: ${rowErr.message}. Aborting.`
    );
    process.exit(2);
  }
  const rows = (rawRows ?? []) as ProgressRow[];
  const userIds = [...new Set(rows.map((r) => r.user_id))];

  const { data: rawProfiles, error: profErr } = await supabase
    .from("profiles")
    .select("id,wallet_address,username")
    .in("id", userIds);
  if (profErr) {
    console.error(
      `FATAL: DB read of profiles failed: ${profErr.message}. Aborting.`
    );
    process.exit(2);
  }
  const profileById = new Map<string, ProfileRow>();
  for (const p of (rawProfiles ?? []) as ProfileRow[]) profileById.set(p.id, p);

  // --- 2. Total Enrollment PDAs on devnet (memcmp on discriminator) ---
  const disc = (
    IDL as { accounts: { name: string; discriminator: number[] }[] }
  ).accounts.find((a) => a.name === "Enrollment")?.discriminator;
  if (!disc) {
    console.error(
      "FATAL: Enrollment discriminator not found in IDL. Aborting."
    );
    process.exit(2);
  }
  const discBytes = utils.bytes.bs58.encode(Buffer.from(disc));
  const allEnrollments = await connection.getProgramAccounts(programId, {
    filters: [{ memcmp: { offset: 0, bytes: discBytes } }],
    dataSlice: { offset: 0, length: 0 },
  });
  const totalEnrollments = allEnrollments.length;

  // --- 3. Sanity: live flattened order per distinct course ---
  const courseIds = [...new Set(rows.map((r) => r.course_id))];
  const structureByCourse = new Map<
    string,
    {
      course: { modules: { lessons: { _id: string }[] }[] };
      count: number;
      dangling: number;
    } | null
  >();
  for (const cid of courseIds) {
    const s = await sanity.fetch<SanityStructure | null>(
      `*[_type == "course" && _id == $id][0]{
         "modules": modules[]->{
           order,
           "lessons": lessons[]->{ _id } | order(order asc)
         } | order(order asc)
       }`,
      { id: cid }
    );
    if (!s) {
      structureByCourse.set(cid, null);
      continue;
    }
    const { course, dangling } = sanitizeStructure(s);
    const count = course.modules.reduce((n, m) => n + m.lessons.length, 0);
    structureByCourse.set(cid, { course, count, dangling });
  }

  // --- 4. Enrollment PDAs for each distinct (user, course) with a completion ---
  const pairKey = (u: string, c: string): string => `${u}::${c}`;
  const enrollmentState = new Map<string, EnrollmentState>();
  const pairs = new Set(rows.map((r) => pairKey(r.user_id, r.course_id)));
  for (const key of pairs) {
    const [uid, cid] = key.split("::");
    const wallet = profileById.get(uid)?.wallet_address ?? null;
    if (!wallet) {
      enrollmentState.set(key, {
        found: false,
        pda: "<no-wallet>",
        flags: null,
        popcount: null,
      });
      continue;
    }
    let walletPk: PublicKey;
    try {
      walletPk = new PublicKey(wallet);
    } catch {
      enrollmentState.set(key, {
        found: false,
        pda: "<bad-wallet>",
        flags: null,
        popcount: null,
      });
      continue;
    }
    const [pda] = findEnrollmentPDA(cid, walletPk, programId);
    let decoded: DecodedEnrollment | null = null;
    try {
      decoded = (await fetchEnrollment(
        cid,
        walletPk,
        connection,
        programId
      )) as unknown as DecodedEnrollment | null;
    } catch {
      decoded = null;
    }
    if (!decoded) {
      enrollmentState.set(key, {
        found: false,
        pda: pda.toBase58(),
        flags: null,
        popcount: null,
      });
      continue;
    }
    const flags = decoded.lesson_flags.map((w) => BigInt(w.toString()));
    enrollmentState.set(key, {
      found: true,
      pda: pda.toBase58(),
      flags,
      popcount: popcount256(flags),
    });
  }

  // --- 5. Per-completion check ---
  const results: RowResult[] = [];
  for (const r of rows) {
    const userShort = (profileById.get(r.user_id)?.username ?? r.user_id).slice(
      0,
      14
    );
    const struct = structureByCourse.get(r.course_id);
    const est = enrollmentState.get(pairKey(r.user_id, r.course_id));

    const base: Omit<RowResult, "verdict" | "reason"> = {
      userShort,
      courseId: r.course_id,
      lessonId: r.lesson_id,
      slot: -1,
      dbIndex: r.lesson_index,
      bitSetAtSlot: false,
      bitSetAtDbIndex: null,
      indexMatch: null,
    };

    if (!struct) {
      results.push({
        ...base,
        verdict: "FLAG",
        reason: "no live Sanity course doc (deleted/renamed)",
      });
      continue;
    }
    const slot = findLessonIndex(struct.course, r.lesson_id);
    base.slot = slot;
    if (slot === -1) {
      results.push({
        ...base,
        verdict: "FLAG",
        reason:
          "lesson_id absent from live flattened order (deleted/moved out)",
      });
      continue;
    }
    if (!est || !est.found || !est.flags) {
      results.push({
        ...base,
        verdict: "FLAG",
        reason:
          est?.pda === "<no-wallet>"
            ? "profile has no wallet_address"
            : "Enrollment PDA not found on devnet",
      });
      continue;
    }
    const flags = est.flags;
    const bitSetAtSlot = isLessonComplete(flags, slot);
    base.bitSetAtSlot = bitSetAtSlot;
    const dbIndex = r.lesson_index;
    const bitSetAtDbIndex =
      dbIndex != null ? isLessonComplete(flags, dbIndex) : null;
    base.bitSetAtDbIndex = bitSetAtDbIndex;
    const indexMatch = dbIndex != null ? dbIndex === slot : null;
    base.indexMatch = indexMatch;

    if (!bitSetAtSlot) {
      const moved =
        dbIndex != null && dbIndex !== slot
          ? ` — lesson MOVED: completion-time index ${dbIndex} != today slot ${slot}` +
            (bitSetAtDbIndex ? ` (bit IS set at old index ${dbIndex})` : "")
          : "";
      results.push({
        ...base,
        verdict: "FAIL",
        reason: `bit NOT set at today's slot ${slot}${moved}`,
      });
      continue;
    }
    if (indexMatch === false) {
      results.push({
        ...base,
        verdict: "FLAG",
        reason: `bit set at slot ${slot} BUT completion-time index ${dbIndex} != today slot ${slot} (lesson moved; live order != completion order)`,
      });
      continue;
    }
    results.push({ ...base, verdict: "PASS", reason: "" });
  }

  // --- 6. Report ---
  const pass = results.filter((r) => r.verdict === "PASS").length;
  const fail = results.filter((r) => r.verdict === "FAIL");
  const flag = results.filter((r) => r.verdict === "FLAG");

  console.log("-".repeat(78));
  console.log("DATA SOURCES");
  console.log("-".repeat(78));
  console.log(`completed user_progress rows : ${rows.length}`);
  console.log(`distinct users               : ${userIds.length}`);
  console.log(`distinct (user,course) pairs : ${pairs.size}`);
  console.log(
    `rows with NULL lesson_index  : ${rows.filter((r) => r.lesson_index == null).length}`
  );
  console.log(
    `Enrollment PDAs on devnet    : ${totalEnrollments}  (spec §15.1 expected ${EXPECTED_ENROLLMENTS})`
  );
  console.log("");

  console.log("-".repeat(78));
  console.log(
    "PER-ENROLLMENT: popcount(lesson_flags) vs completed-row count in DB"
  );
  console.log("-".repeat(78));
  console.log(
    ["user", "course", "PDA?", "popcount", "db#", "match"]
      .map((s) => s.padEnd(0))
      .join("  ")
  );
  const enrollRows: string[] = [];
  for (const key of [...pairs].sort()) {
    const [uid, cid] = key.split("::");
    const est = enrollmentState.get(key);
    const dbCount = rows.filter(
      (r) => r.user_id === uid && r.course_id === cid
    ).length;
    const uShort = (profileById.get(uid)?.username ?? uid).slice(0, 12);
    const pc = est?.popcount;
    const match =
      est?.found && pc != null
        ? pc === dbCount
          ? "ok"
          : `DIFF(${pc} vs ${dbCount})`
        : "no-PDA";
    enrollRows.push(
      `${uShort.padEnd(13)} ${cid.padEnd(32)} ${(est?.found ? "yes" : "NO").padEnd(4)} ${String(pc ?? "-").padStart(8)} ${String(dbCount).padStart(4)}  ${match}`
    );
  }
  console.log(enrollRows.join("\n"));
  console.log("");

  console.log("-".repeat(78));
  console.log(
    "PER-COMPLETION RESULTS (FAIL/FLAG shown in full; PASS summarized per enrollment)"
  );
  console.log("-".repeat(78));
  if (fail.length + flag.length > 0) {
    console.log(
      `user           course                            lesson_id                       slot  dbIdx  bit@slot  verdict  reason`
    );
    for (const r of [...fail, ...flag]) {
      console.log(
        `${r.userShort.padEnd(14)} ${r.courseId.padEnd(33)} ${r.lessonId.slice(0, 30).padEnd(31)} ${String(r.slot).padStart(4)}  ${String(r.dbIndex ?? "-").padStart(5)}  ${String(r.bitSetAtSlot).padEnd(8)}  ${r.verdict.padEnd(7)}  ${r.reason}`
      );
    }
    console.log("");
  } else {
    console.log("(no FAIL/FLAG rows)");
    console.log("");
  }
  // PASS summary per enrollment — recount from the aligned rows/results arrays.
  const passPairCount = new Map<string, number>();
  results.forEach((r, i) => {
    if (r.verdict !== "PASS") return;
    const orig = rows[i];
    const k = pairKey(orig.user_id, orig.course_id);
    passPairCount.set(k, (passPairCount.get(k) ?? 0) + 1);
  });
  console.log("PASS counts per enrollment:");
  for (const key of [...pairs].sort()) {
    const [uid, cid] = key.split("::");
    const uShort = (profileById.get(uid)?.username ?? uid).slice(0, 12);
    const total = rows.filter(
      (r) => r.user_id === uid && r.course_id === cid
    ).length;
    const p = passPairCount.get(key) ?? 0;
    console.log(
      `  ${uShort.padEnd(13)} ${cid.padEnd(32)} ${String(p).padStart(3)}/${total} PASS`
    );
  }
  console.log("");

  // dangling / missing-structure notes
  const danglingCourses = [...structureByCourse.entries()].filter(
    ([, v]) => v && v.dangling > 0
  );
  if (danglingCourses.length) {
    console.log(
      "NOTE — courses with dangling lesson references (occupy bitmap slots):"
    );
    for (const [cid, v] of danglingCourses)
      console.log(`  ${cid}: ${v?.dangling} dangling`);
    console.log("");
  }

  console.log("=".repeat(78));
  console.log(
    `TALLY: ${pass} PASS  |  ${fail.length} FAIL  |  ${flag.length} FLAG   (of ${results.length} completed rows)`
  );
  const enrollMismatch = totalEnrollments !== EXPECTED_ENROLLMENTS;
  if (fail.length === 0 && flag.length === 0) {
    console.log(
      "VERDICT: ALL PASS — G2 CLEAR. Cutover (close_course reset) is safe to proceed."
    );
    if (enrollMismatch) {
      console.log(
        `  (advisory: ${totalEnrollments} Enrollment PDAs on devnet vs spec's ${EXPECTED_ENROLLMENTS}; snapshot grew — not a G2 blocker)`
      );
    }
  } else {
    console.log(
      `VERDICT: ${fail.length + flag.length} MISMATCH(ES) — G2 STOP CONDITION. Do NOT reset courses; file a P0.`
    );
  }
  console.log("=".repeat(78));

  // Non-zero exit on any FAIL so CI/cutover automation can gate on it.
  if (fail.length > 0) process.exit(1);
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`FATAL: unexpected error — ${msg}`);
  process.exit(2);
});
