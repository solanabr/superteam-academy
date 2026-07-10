/**
 * One-time purge of legacy (pre-content-standard) Sanity docs + manual-era
 * courseTag / unsynced learningPath docs. DRY-RUN by default; --live to
 * mutate, and --live REQUIRES --expect N where N is the dry-run count.
 * SANITY_ADMIN_TOKEN is required in BOTH modes (raw perspective must see
 * drafts identically in dry-run and live — a tokenless dry-run would show
 * a different doc set than the tokened live run).
 * Run: npx tsx scripts/purge-legacy-sanity-docs.ts [--live --expect N]
 */
import { createClient } from "@sanity/client";

const LEGACY_COURSE_IDS = ["aD45H1NEbb1bqELwloGCqI", "ops2aYkxIM6NMo1gE18U1o"];

async function main(): Promise<void> {
  const live = process.argv.includes("--live");
  const expectIdx = process.argv.indexOf("--expect");
  const expected =
    expectIdx === -1 ? null : Number(process.argv[expectIdx + 1]);
  if (live && (expected === null || Number.isNaN(expected))) {
    throw new Error("--live requires --expect N (the dry-run count)");
  }
  const token = process.env.SANITY_ADMIN_TOKEN;
  if (!token) throw new Error("SANITY_ADMIN_TOKEN is required (both modes)");
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "4e3i2wwc",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    apiVersion: "2024-01-01",
    token,
    useCdn: false,
    perspective: "raw",
  });
  const targets = await client.fetch<
    { _id: string; _type: string; sync: string | null }[]
  >(
    `*[((_id in $courses || _id in $draftCourses)
       || _type == "module"
       || _type == "courseTag"
       || (_type == "learningPath" && !defined(sync.source))
       || (_type == "lesson" && !defined(sync.source) && !defined(blocks)))]
       { _id, _type, "sync": sync.source }`,
    {
      courses: LEGACY_COURSE_IDS,
      draftCourses: LEGACY_COURSE_IDS.map((id) => `drafts.${id}`),
    }
  );
  // Belt + suspenders: GROQ returns null (not undefined) for absent fields.
  const guarded = targets.filter((d) => d.sync != null);
  if (guarded.length > 0) {
    throw new Error(
      `refusing: ${guarded.length} target(s) carry sync.source: ${guarded.map((d) => d._id).join(", ")}`
    );
  }
  for (const d of targets)
    console.log(`${live ? "DELETE" : "would delete"} ${d._type} ${d._id}`);
  if (!live) {
    console.log(
      `dry-run: ${targets.length} docs. Re-run with --live --expect ${targets.length} to execute.`
    );
    return;
  }
  if (targets.length !== expected) {
    throw new Error(
      `aborting: target count ${targets.length} != --expect ${expected} (dataset changed since dry-run)`
    );
  }
  const tx = targets.reduce((t, d) => t.delete(d._id), client.transaction());
  await tx.commit();
  console.log(`deleted ${targets.length} docs`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
