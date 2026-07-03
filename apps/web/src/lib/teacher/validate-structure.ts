import "server-only";
import type {
  DesiredModule,
  DesiredLesson,
  StructureTest,
} from "@/lib/teacher/structure";

/**
 * Validate an untrusted PUT body for the course-body builder (#267) into a
 * DesiredModule[]. Like the metadata validator, every field is read + checked
 * explicitly; nothing is spread through. Bounds are DoS guards, not the security
 * boundary (ownership is checked in the route; the planner only ever writes
 * module/lesson docs referenced by the owned course).
 */

const MAX_MODULES = 50;
const MAX_LESSONS_PER_MODULE = 100;
const MAX_TESTS = 50;
const MAX_TITLE = 200;
const MAX_TEXT = 20000;
const MAX_HINTS = 20;
const MAX_ID = 256;
const LANGUAGES = ["typescript", "rust"];
const BUILD_TYPES = ["standard", "buildable"];

export type StructureValidation =
  | { ok: true; value: DesiredModule[] }
  | { ok: false; error: string };

function fail(msg: string): { ok: false; error: string } {
  return { ok: false, error: msg };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function optStr(v: unknown, max: number): string | null | undefined {
  if (v === undefined || v === null) return v as null | undefined;
  if (typeof v !== "string" || v.length > max) return undefined;
  return v;
}

function validateTests(raw: unknown): StructureTest[] | string {
  if (!Array.isArray(raw)) return "tests must be an array";
  if (raw.length > MAX_TESTS) return `tests must have at most ${MAX_TESTS} items`;
  const out: StructureTest[] = [];
  for (const t of raw) {
    if (!isObj(t)) return "each test must be an object";
    if (typeof t.id !== "string" || !t.id || t.id.length > MAX_ID) {
      return "test id must be a non-empty string";
    }
    if (typeof t.description !== "string" || t.description.length > MAX_TITLE) {
      return "test description invalid";
    }
    const input = optStr(t.input, MAX_TEXT);
    const expectedOutput = optStr(t.expectedOutput, MAX_TEXT);
    if (input === undefined && t.input !== undefined) return "test input invalid";
    if (expectedOutput === undefined && t.expectedOutput !== undefined) {
      return "test expectedOutput invalid";
    }
    out.push({
      id: t.id,
      description: t.description,
      input: input ?? undefined,
      expectedOutput: expectedOutput ?? undefined,
      hidden: t.hidden === true,
    });
  }
  return out;
}

function validateLesson(raw: unknown): DesiredLesson | string {
  if (!isObj(raw)) return "lesson must be an object";

  if (typeof raw.title !== "string" || !raw.title.trim() || raw.title.length > MAX_TITLE) {
    return "lesson title invalid";
  }
  if (raw.type !== "content" && raw.type !== "challenge") {
    return "lesson type must be content or challenge";
  }
  const lesson: DesiredLesson = { title: raw.title.trim(), type: raw.type };

  if (raw._id !== undefined) {
    if (typeof raw._id !== "string" || !raw._id || raw._id.length > MAX_ID) {
      return "lesson _id invalid";
    }
    lesson._id = raw._id;
  }

  for (const [key, max] of [
    ["content", MAX_TEXT],
    ["videoUrl", 2000],
    ["code", MAX_TEXT],
    ["solution", MAX_TEXT],
  ] as const) {
    if (raw[key] !== undefined) {
      const v = optStr(raw[key], max);
      if (v === undefined && raw[key] !== null) return `lesson ${key} invalid`;
      (lesson as unknown as Record<string, unknown>)[key] = v;
    }
  }
  if (raw.language !== undefined && raw.language !== null) {
    if (typeof raw.language !== "string" || !LANGUAGES.includes(raw.language)) {
      return "lesson language invalid";
    }
    lesson.language = raw.language;
  }
  if (raw.buildType !== undefined && raw.buildType !== null) {
    if (typeof raw.buildType !== "string" || !BUILD_TYPES.includes(raw.buildType)) {
      return "lesson buildType invalid";
    }
    lesson.buildType = raw.buildType;
  }
  if (raw.hints !== undefined) {
    if (!Array.isArray(raw.hints) || raw.hints.length > MAX_HINTS) {
      return "hints invalid";
    }
    const hints: string[] = [];
    for (const h of raw.hints) {
      if (typeof h !== "string" || h.length > MAX_TEXT) return "hint invalid";
      hints.push(h);
    }
    lesson.hints = hints;
  }
  if (raw.tests !== undefined) {
    const tests = validateTests(raw.tests);
    if (typeof tests === "string") return tests;
    lesson.tests = tests;
  }
  return lesson;
}

export function validateStructure(raw: unknown): StructureValidation {
  if (!isObj(raw) || !Array.isArray(raw.modules)) {
    return fail("body must be an object with a modules array");
  }
  if (raw.modules.length > MAX_MODULES) {
    return fail(`at most ${MAX_MODULES} modules`);
  }

  const modules: DesiredModule[] = [];
  for (const m of raw.modules) {
    if (!isObj(m)) return fail("module must be an object");
    if (typeof m.title !== "string" || !m.title.trim() || m.title.length > MAX_TITLE) {
      return fail("module title invalid");
    }
    if (!Array.isArray(m.lessons) || m.lessons.length > MAX_LESSONS_PER_MODULE) {
      return fail("module lessons invalid");
    }
    const mod: DesiredModule = { title: m.title.trim(), lessons: [] };
    if (m._id !== undefined) {
      if (typeof m._id !== "string" || !m._id || m._id.length > MAX_ID) {
        return fail("module _id invalid");
      }
      mod._id = m._id;
    }
    if (m.description !== undefined) {
      const d = optStr(m.description, MAX_TEXT);
      if (d === undefined && m.description !== null) return fail("module description invalid");
      mod.description = d;
    }
    for (const l of m.lessons) {
      const lesson = validateLesson(l);
      if (typeof lesson === "string") return fail(lesson);
      mod.lessons.push(lesson);
    }
    modules.push(mod);
  }

  return { ok: true, value: modules };
}
