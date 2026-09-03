import { parse as parseYaml } from "yaml";
import {
  Course,
  Lesson,
  SlotsLock,
  Achievement,
  Quest,
  LearningPath,
  SkillsTaxonomy,
  checkSkillVocabulary,
  isExcludedContentPath,
  type CourseT,
  type LessonT,
  type SlotsLockT,
  type SkillsTaxonomyT,
} from "@superteam-lms/content-schema";
import type { RepoTree } from "@/lib/github/types";
import { ContentValidationError } from "./types";
import { gateCodeBlock, type GraderSet } from "./executor-gate";
import { collectL10nFile, validateL10n, type L10nOverlays } from "./l10n";

export interface ValidatedContent {
  courses: CourseT[];
  lessons: { dir: string; lesson: LessonT }[];
  achievements: unknown[];
  quests: unknown[];
  paths: unknown[];
  slots: Map<string, SlotsLockT>; // course dir → lockfile
  /**
   * The canonical skill vocabulary from a repo-root `skills.yaml`, or `[]` if
   * the file is absent. Every lesson `skills` slug is cross-checked against
   * this vocabulary below (#466 C3, `checkSkillVocabulary`) — an absent file
   * with any tagged lesson (schema requires >=1 skill per lesson) fails closed.
   */
  skills: SkillsTaxonomyT;
  prose: Map<string, string>; // md path → body
  code: Map<string, string>; // ts/rs path → body
  idl: Map<string, string>; // idl path → json
  assets: Map<string, Uint8Array>; // image path → bytes
  /**
   * Course translation overlays (`courses/<slug>/l10n/<locale>/`), keyed by
   * course dir + locale — see `l10n.ts`. Collected FIRST in the classifier so
   * nothing under `l10n/` is ever read as a source document or source asset.
   */
  l10n: L10nOverlays;
}

const text = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);
const dirOf = (path: string): string => path.slice(0, path.lastIndexOf("/"));

/**
 * Re-parse and Zod-validate every YAML/JSON in the tree, load prose/code/idl/
 * asset bodies, and run the two-sided executor gate on every `code` block. This
 * is the authoritative validation (§9.2 step 2) — the repo's PR check may not
 * have run against this exact SHA. Accumulates all issues, then throws once.
 */
export async function parseAndValidateTree(
  tree: RepoTree,
  graders: GraderSet
): Promise<ValidatedContent> {
  const issues: string[] = [];
  const v: ValidatedContent = {
    courses: [],
    lessons: [],
    achievements: [],
    quests: [],
    paths: [],
    slots: new Map(),
    skills: [],
    prose: new Map(),
    code: new Map(),
    idl: new Map(),
    assets: new Map(),
    l10n: new Map(),
  };
  /** course id → repo dir, so overlays can be bound to their course. */
  const courseDirById = new Map<string, string>();

  const zod = <T>(
    schema: { parse: (x: unknown) => T },
    raw: unknown,
    where: string
  ): T | null => {
    try {
      return schema.parse(raw);
    } catch (e) {
      issues.push(`${where}: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  };

  for (const [path, bytes] of tree) {
    // #973: mirrors compile-bundle.ts's validateTree — excluded paths never
    // reach classification, so a tree not built by `extractTarball` cannot
    // slip a parked (`_draft/`) doc past this validator.
    if (isExcludedContentPath(path)) continue;
    // Translation overlays first: a file under `l10n/` is fully owned by that
    // branch, whatever its name, so the unanchored suffix checks below can
    // never mistake an overlay for a course, a lesson or a source asset.
    if (collectL10nFile(path, bytes, v.l10n, issues)) continue;
    if (path === "skills.yaml") {
      // The only content type at the repo root, not nested under a course/
      // collection dir — a single canonical skill vocabulary, not one doc per
      // file. The compiler tolerates its absence (`v.skills` stays `[]`), but
      // every lesson `skills` slug is checked against it below (#466 C3).
      const s = zod(SkillsTaxonomy, parseYaml(text(bytes)), path);
      if (s) v.skills = s;
    } else if (path.endsWith("/course.yaml")) {
      const c = zod(Course, parseYaml(text(bytes)), path);
      if (c) {
        v.courses.push(c);
        courseDirById.set(c.id, dirOf(path));
      }
    } else if (path.endsWith("/slots.lock.json")) {
      const s = zod(SlotsLock, JSON.parse(text(bytes)), path);
      if (s) v.slots.set(dirOf(path), s);
    } else if (path.endsWith("/lesson.yaml")) {
      const l = zod(Lesson, parseYaml(text(bytes)), path);
      if (l) v.lessons.push({ dir: dirOf(path), lesson: l });
    } else if (path.startsWith("achievements/") && path.endsWith(".yaml")) {
      const a = zod(Achievement, parseYaml(text(bytes)), path);
      if (a) v.achievements.push(a);
    } else if (path.startsWith("quests/") && path.endsWith(".yaml")) {
      const q = zod(Quest, parseYaml(text(bytes)), path);
      if (q) v.quests.push(q);
    } else if (path.startsWith("paths/") && path.endsWith(".yaml")) {
      const p = zod(LearningPath, parseYaml(text(bytes)), path);
      if (p) v.paths.push(p);
    } else if (path.endsWith(".md")) {
      v.prose.set(path, text(bytes));
    } else if (path.endsWith(".ts") || path.endsWith(".rs")) {
      v.code.set(path, text(bytes));
    } else if (path.endsWith(".idl.json")) {
      v.idl.set(path, text(bytes));
    } else if (/\.(png|jpe?g|gif|webp|svg)$/i.test(path)) {
      v.assets.set(path, bytes);
    }
  }

  // #466 C3: every lesson `skills` slug must be a member of the canonical
  // vocabulary — the allowlist guarantee, kept in sync with the offline
  // compiler's `validateTree` (compile-bundle.ts).
  issues.push(
    ...checkSkillVocabulary(
      v.lessons.map(({ lesson }) => ({
        id: lesson.id,
        skills: lesson.skills,
      })),
      v.skills
    )
  );

  // Every code block must have its files present — checked for ALL languages so a
  // broken lesson can't publish silently. The two-sided EXECUTOR gate then runs on
  // TS-standard blocks only, in lockstep with content-lint gate 6
  // (gate6-executor.ts): rust and buildable are DEFERRED. Grading them here
  // rejected content that CI accepts — the build server is off in prod, and the
  // "starter must fail" rule is incoherent for compile-graded buildable blocks (a
  // `todo!()` scaffold compiles, so its starter "passes"). Runtime grading is
  // unchanged and stays fail-closed per block.
  for (const { dir, lesson } of v.lessons) {
    for (const block of lesson.blocks) {
      if (block.type !== "code") continue;
      const starter = v.code.get(`${dir}/${block.starter}`);
      const solution = v.code.get(`${dir}/${block.solution}`);
      const testsRaw = tree.get(`${dir}/${block.tests}`);
      if (!starter || !solution || !testsRaw) {
        issues.push(
          `lesson ${lesson.id} block ${block.key}: missing starter/solution/tests file`
        );
        continue;
      }
      if (block.language !== "typescript" || block.buildType === "buildable") {
        continue; // grading deferred to runtime, exactly as CI gate 6 defers it
      }
      const tests = JSON.parse(text(testsRaw)) as unknown[];
      const blockIssues = await gateCodeBlock(
        {
          key: block.key,
          type: "code",
          language: block.language,
          buildType: block.buildType,
        },
        { starter, solution, tests },
        graders
      );
      issues.push(...blockIssues);
    }
  }

  // Every overlay key must bind to something real in the source course — a
  // module key, a lesson slug, a block of the right type, a question/option/
  // test id, an image the source has. Same check as the bundle compiler's.
  issues.push(
    ...validateL10n(
      v.l10n,
      { courses: v.courses, lessons: v.lessons, courseDirById },
      tree,
      (dir, rel) => {
        const raw = tree.get(`${dir}/${rel}`);
        return raw ? (JSON.parse(text(raw)) as { id?: unknown }[]) : [];
      }
    )
  );

  if (issues.length > 0) throw new ContentValidationError(issues);
  return v;
}
