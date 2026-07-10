/**
 * cs8-extract.ts — CS-8 Phase-1 extraction (spec §15, plan #388).
 *
 * READ-ONLY on every live system. Reads the public Sanity dataset over
 * unauthenticated GROQ and writes the content-standard tree into a local
 * `courses-academy` checkout. Writes NOTHING to Sanity, Supabase, or chain.
 *
 * Slots are frozen from the LIVE flattened `modules[].lessons[]` order, which is
 * the order `findLessonIndex` used to set every `Enrollment.lesson_flags` bit.
 * `assignSlots` is imported from `@superteam-lms/content-schema` rather than
 * reimplemented, so slot semantics cannot drift from the app.
 *
 * Run (resolves `yaml` + content-schema from content-lint's node_modules):
 *   pnpm --filter @superteam-lms/content-lint exec tsx \
 *     "$(pwd)/scripts/cs8-extraction/extract.ts" ~/Documents/STBR/courses-academy
 *
 * Then gate it:
 *   pnpm --filter @superteam-lms/content-lint exec tsx src/cli.ts <out>
 *   pnpm --filter @superteam-lms/web exec tsx scripts/cs8-verify-bits.ts
 */

import { mkdirSync, rmSync, writeFileSync, cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

import YAML from "yaml";
import {
  assignSlots,
  Course,
  Lesson,
  Achievement,
  Quest,
  LearningPath,
  Instructor,
} from "@superteam-lms/content-schema";

// ── config ───────────────────────────────────────────────────────────────────

const PROJECT_ID = "4e3i2wwc";
const DATASET = "production";

/** Platform-authored mock content. All six courses are owned by the repo owner. */
const OWNER_GITHUB_ID = "61333600"; // gh api users/thomgabriel --jq .id

/**
 * Owner decision: drop `solana-101` (`aD45H1NEbb1bqELwloGCqI`) and the junk draft
 * (`ops2aYkxIM6NMo1gE18U1o`). Both ids violate `^course-<kebab>$`, so the schema
 * forbids them regardless. Their lessons are dropped with them.
 */
const isExtractableCourseId = (id: string): boolean =>
  /^course-[a-z0-9-]+$/.test(id);

/**
 * Capability wiring (gate 13a). Only the BFSP course threads capabilities, and
 * its live lesson order already places producers before consumers:
 *   slot 12 airdrop  → produces funded-wallet
 *   slot 13 deploy   → consumes funded-wallet, produces deployed-program
 *   slot 14 interact → consumes deployed-program
 *   slot 15 capstone → consumes deployed-program
 */
const CODE_CAPS: Record<string, { consumes?: string[]; produces?: string }> = {
  "lesson-bfsp-m4-deploy": {
    consumes: ["funded-wallet"],
    produces: "deployed-program",
  },
};

/**
 * The curated achievement set (owner decision). `speed-runner` and
 * `perfect-score` are deleted: no first-try / timing signal exists, so no award
 * kind can express them. No community achievements — none are live.
 */
const AWARDS: Record<string, unknown> = {
  "achievement-first-steps": { kind: "lessons-completed", gte: 1 },
  "achievement-course-completer": {
    kind: "course-completed",
    course: "course-solana-fundamentals",
  },
  "achievement-week-warrior": { kind: "streak", days: 7 },
  "achievement-monthly-master": { kind: "streak", days: 30 },
  "achievement-consistency-king": { kind: "streak", days: 100 },
  "achievement-rust-rookie": {
    kind: "lessons-completed-in-course",
    course: "course-rust-for-solana",
    gte: 1,
  },
  "achievement-anchor-expert": {
    kind: "course-completed",
    course: "course-anchor-framework",
  },
  "achievement-full-stack-solana": {
    kind: "path-completed",
    path: "path-solana-core",
  },
  "achievement-early-adopter": { kind: "user-number", lte: 100 },
  // achievements.ts:60 — admin-granted by design.
  "achievement-bug-hunter": { kind: "manual" },
};
const DROPPED_ACHIEVEMENTS = new Set([
  "achievement-speed-runner",
  "achievement-perfect-score",
]);

// ── live export ──────────────────────────────────────────────────────────────

interface SanityDoc {
  _id: string;
  _type: string;
  [k: string]: unknown;
}

async function exportLive(): Promise<SanityDoc[]> {
  const query = `*[_type in ["course","module","lesson","achievement","quest","learningPath","instructor"]]`;
  const url =
    `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${DATASET}` +
    `?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity export failed: ${res.status}`);
  const body = (await res.json()) as { result: SanityDoc[] };
  return body.result;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const ref = (v: unknown): string => (v as { _ref: string })._ref;
const slugOf = (d: SanityDoc): string =>
  (d.slug as { current: string }).current;

function writeYaml(file: string, data: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, YAML.stringify(data, { lineWidth: 0 }), "utf8");
}

function writeJson(file: string, data: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function writeText(file: string, body: string): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body.endsWith("\n") ? body : body + "\n", "utf8");
}

/** Drop undefined so YAML never emits `key: null` for an absent optional. */
function compact<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined && v !== null)
  ) as T;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const out = process.argv[2];
  if (!out) throw new Error("usage: extract.ts <courses-academy checkout>");

  const docs = await exportLive();
  const byId = new Map(docs.map((d) => [d._id, d]));
  const of = (t: string): SanityDoc[] => docs.filter((d) => d._type === t);

  const courses = of("course").filter((c) => isExtractableCourseId(c._id));
  const dropped = of("course").filter((c) => !isExtractableCourseId(c._id));
  console.log(
    `courses: ${courses.length} extractable, ${dropped.length} dropped (${dropped
      .map((d) => d._id)
      .join(", ")})`
  );

  // Wipe only the generated trees; leave scaffolding (README, schema/, .github) alone.
  for (const dir of [
    "courses",
    "achievements",
    "quests",
    "paths",
    "instructors",
  ]) {
    rmSync(join(out, dir), { recursive: true, force: true });
  }

  const usedLessons = new Set<string>();
  let lessonCount = 0;

  for (const course of courses) {
    const courseDir = join(out, "courses", slugOf(course));

    const modules = (course.modules as unknown[]).map((m) => byId.get(ref(m))!);
    const flatLessonIds: string[] = [];

    const courseYaml = compact({
      id: course._id,
      slug: slugOf(course),
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      duration: course.duration,
      xpPerLesson: course.xpPerLesson,
      xpReward: course.xpReward,
      creatorRewardXp: course.creatorRewardXp,
      minCompletionsForReward: course.minCompletionsForReward,
      trackId: course.trackId,
      trackLevel: course.trackLevel,
      tags: course.tags,
      creator: { githubId: OWNER_GITHUB_ID },
      instructor: course.instructor ? ref(course.instructor) : undefined,
      modules: modules.map((m) => {
        const lessonIds = (m.lessons as unknown[]).map(ref);
        flatLessonIds.push(...lessonIds);
        return compact({
          key: m._id.replace(/^module-/, ""),
          title: m.title,
          description: m.description,
          lessons: lessonIds,
        });
      }),
    });

    Course.parse(courseYaml);
    writeYaml(join(courseDir, "course.yaml"), courseYaml);

    // Slots frozen from the LIVE flattened order (spec §15.3).
    writeJson(
      join(courseDir, "slots.lock.json"),
      assignSlots(null, flatLessonIds)
    );

    for (const lid of flatLessonIds) {
      const l = byId.get(lid)!;
      usedLessons.add(lid);
      lessonCount += 1;
      const lessonDir = join(courseDir, "lessons", slugOf(l));
      const blocks: Record<string, unknown>[] = [];

      // prose — every surviving lesson has markdown content.
      writeText(join(lessonDir, "intro.md"), l.content as string);
      blocks.push({ key: "intro", type: "prose", src: "intro.md" });

      if (l.videoUrl) {
        blocks.push({ key: "watch", type: "video", url: l.videoUrl });
      }

      if (l.type === "challenge") {
        const language = (l.language as string) ?? "typescript";
        const ext = language === "rust" ? "rs" : "ts";
        const buildType = (l.buildType as string) ?? "standard";
        const caps = CODE_CAPS[lid] ?? {};

        writeText(
          join(lessonDir, "exercise", `starter.${ext}`),
          l.code as string
        );
        writeText(
          join(lessonDir, "exercise", `solution.${ext}`),
          l.solution as string
        );
        writeJson(
          join(lessonDir, "exercise", "tests.json"),
          (l.tests as Record<string, unknown>[]).map((t) => ({
            // Live test cases have no `id` — the array item `_key` is the stable
            // identifier the app already coalesces to (`coalesce(id, _key)`).
            id: t._key,
            description: t.description,
            input: t.input,
            expectedOutput: t.expectedOutput,
            // `hidden` is deliberately dropped (decision D4: no answer secrecy).
          }))
        );

        blocks.push(
          compact({
            key: "exercise",
            type: "code",
            language,
            buildType: buildType === "standard" ? undefined : buildType,
            deployable: l.deployable ? true : undefined,
            starter: `exercise/starter.${ext}`,
            solution: `exercise/solution.${ext}`,
            tests: "exercise/tests.json",
            hints: (l.hints as string[] | undefined)?.length
              ? l.hints
              : undefined,
            consumes: caps.consumes,
            produces: caps.produces,
          })
        );
      }

      for (const w of (l.widgets as string[] | undefined) ?? []) {
        if (w === "wallet-funding") {
          blocks.push({
            key: "fund",
            type: "wallet-funding",
            produces: "funded-wallet",
          });
        } else if (w === "program-explorer") {
          writeText(
            join(lessonDir, "program.idl.json"),
            l.programIdl as string
          );
          blocks.push({
            key: "explore",
            type: "program-explorer",
            idl: "program.idl.json",
            consumes: ["deployed-program"],
          });
        } else if (w === "deployed-program-card") {
          blocks.push({
            key: "deployed",
            type: "deployed-program-card",
            consumes: ["deployed-program"],
          });
        } else {
          throw new Error(`${lid}: unknown widget "${w}"`);
        }
      }

      const lessonYaml = { id: l._id, slug: slugOf(l), title: l.title, blocks };
      Lesson.parse(lessonYaml);
      writeYaml(join(lessonDir, "lesson.yaml"), lessonYaml);
    }
  }

  // ── achievements (curated) ────────────────────────────────────────────────
  let nAch = 0;
  for (const a of of("achievement")) {
    if (DROPPED_ACHIEVEMENTS.has(a._id)) continue;
    const award = AWARDS[a._id];
    if (!award) throw new Error(`no award mapping for ${a._id}`);
    const doc = compact({
      id: a._id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      glyph: a.glyph,
      solTier: a.solTier,
      category: a.category,
      xpReward: a.xpReward,
      maxSupply: a.maxSupply,
      metadataUri: a.metadataUri,
      award,
    });
    Achievement.parse(doc);
    writeYaml(
      join(out, "achievements", `${a._id.replace(/^achievement-/, "")}.yaml`),
      doc
    );
    nAch += 1;
  }

  // ── quests ────────────────────────────────────────────────────────────────
  for (const q of of("quest")) {
    const doc = compact({
      id: q._id,
      name: q.name,
      description: q.description,
      type: q.type,
      icon: q.icon,
      xpReward: q.xpReward,
      targetValue: q.targetValue,
      resetType: q.resetType,
      active: q.active,
    });
    Quest.parse(doc);
    writeYaml(join(out, "quests", `${q._id.replace(/^quest-/, "")}.yaml`), doc);
  }

  // ── paths ─────────────────────────────────────────────────────────────────
  // A path that references only dropped courses becomes empty; the schema
  // requires a non-draft path to hold ≥1 course, so it is marked draft.
  for (const p of of("learningPath")) {
    const kept = ((p.courses as unknown[] | undefined) ?? [])
      .map(ref)
      .filter(isExtractableCourseId);
    const doc = compact({
      id: p._id,
      slug: slugOf(p),
      title: p.title,
      description: p.description,
      tag: p.tag,
      order: p.order,
      difficulty: p.difficulty,
      draft: kept.length === 0 ? true : undefined,
      courses: kept,
    });
    LearningPath.parse(doc);
    writeYaml(join(out, "paths", `${p._id.replace(/^path-/, "")}.yaml`), doc);
  }

  // ── instructors ───────────────────────────────────────────────────────────
  for (const i of of("instructor")) {
    const social = (i.socialLinks as Record<string, string> | undefined) ?? {};
    const doc = compact({
      id: i._id,
      name: i.name,
      bio: i.bio,
      socialLinks: Object.keys(social).length ? compact(social) : undefined,
    });
    Instructor.parse(doc);
    writeYaml(
      join(out, "instructors", `${i._id.replace(/^instructor-/, "")}.yaml`),
      doc
    );
  }

  // ── _template (verbatim copy of the verified content-lint fixture) ────────
  // Linted, but excluded from the sync by `content-sync/tarball.ts:5`.
  const fixture = join(
    dirname(new URL(import.meta.url).pathname),
    "..",
    "..",
    "packages/content-lint/src/__tests__/fixtures/good/courses/template"
  );
  if (existsSync(fixture)) {
    cpSync(fixture, join(out, "courses", "_template"), { recursive: true });
  }

  console.log(
    `\nwrote ${courses.length} courses, ${lessonCount} lessons, ${nAch} achievements, ` +
      `${of("quest").length} quests, ${of("learningPath").length} paths, ` +
      `${of("instructor").length} instructors -> ${out}`
  );
  const orphaned = of("lesson").filter((l) => !usedLessons.has(l._id));
  console.log(`lessons dropped with their course: ${orphaned.length}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
