import { parse as parseYaml } from "yaml";
import {
  Course,
  Lesson,
  SlotsLock,
  Achievement,
  Quest,
  LearningPath,
  Instructor,
  type CourseT,
  type LessonT,
  type SlotsLockT,
} from "@superteam-lms/content-schema";
import type { RepoTree } from "./types";
import { ContentValidationError } from "./types";
import { gateCodeBlock, type GraderSet } from "./executor-gate";

export interface ValidatedContent {
  courses: CourseT[];
  lessons: { dir: string; lesson: LessonT }[];
  achievements: unknown[];
  quests: unknown[];
  paths: unknown[];
  instructors: unknown[];
  slots: Map<string, SlotsLockT>; // course dir → lockfile
  prose: Map<string, string>; // md path → body
  code: Map<string, string>; // ts/rs path → body
  idl: Map<string, string>; // idl path → json
  assets: Map<string, Uint8Array>; // image path → bytes
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
    instructors: [],
    slots: new Map(),
    prose: new Map(),
    code: new Map(),
    idl: new Map(),
    assets: new Map(),
  };

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
    if (path.endsWith("/course.yaml")) {
      const c = zod(Course, parseYaml(text(bytes)), path);
      if (c) v.courses.push(c);
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
    } else if (path.startsWith("instructors/") && path.endsWith(".yaml")) {
      const i = zod(Instructor, parseYaml(text(bytes)), path);
      if (i) v.instructors.push(i);
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

  // Executor gate on TS-standard code blocks only, in lockstep with content-lint
  // gate 6 (gate6-executor.ts): rust and buildable blocks are DEFERRED. Grading
  // them here rejected content that CI accepts — the build server is off in prod,
  // and the two-sided "starter must fail" rule is incoherent for compile-graded
  // buildable blocks (a `todo!()` scaffold compiles, so its starter "passes").
  // Runtime grading is unchanged and stays fail-closed per block.
  for (const { dir, lesson } of v.lessons) {
    for (const block of lesson.blocks) {
      if (block.type !== "code") continue;
      if (block.language !== "typescript" || block.buildType === "buildable") {
        continue; // deferred to runtime grading, exactly as CI gate 6 defers it
      }
      const starter = v.code.get(`${dir}/${block.starter}`);
      const solution = v.code.get(`${dir}/${block.solution}`);
      const testsRaw = tree.get(`${dir}/${block.tests}`);
      if (!starter || !solution || !testsRaw) {
        issues.push(
          `lesson ${lesson.id} block ${block.key}: missing starter/solution/tests file`
        );
        continue;
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

  if (issues.length > 0) throw new ContentValidationError(issues);
  return v;
}
