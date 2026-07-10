import type { ZodType } from "zod";
import {
  Course,
  Lesson,
  QuizBlock,
  Achievement,
  Quest,
  LearningPath,
  Instructor,
  SlotsLock,
} from "@superteam-lms/content-schema";
import { discover, walkFiles, type DocKind, type RawDoc } from "../loader";
import { emptyModel, type RepoModel } from "../model";
import { registerSchemaCheck } from "../lint";
import { diag, type Diagnostic } from "../diagnostics";
import { dirname } from "node:path";

const SCHEMA: Record<DocKind, ZodType> = {
  course: Course,
  lesson: Lesson,
  quiz: QuizBlock,
  achievement: Achievement,
  quest: Quest,
  path: LearningPath,
  instructor: Instructor,
  slots: SlotsLock,
};

/** A standalone `*.quiz.yaml` may omit `type:` (spec §4.5 shorthand); inject it. */
function coerce(kind: DocKind, data: unknown): unknown {
  if (
    kind === "quiz" &&
    data &&
    typeof data === "object" &&
    !("type" in data)
  ) {
    return { type: "quiz", ...(data as Record<string, unknown>) };
  }
  return data;
}

function formatZodIssues(err: unknown): string {
  const issues = (
    err as { issues?: { path: (string | number)[]; message: string }[] }
  ).issues;
  if (!issues) return String(err);
  return issues
    .map((i) => `${i.path.length ? i.path.join(".") + ": " : ""}${i.message}`)
    .join("; ");
}

/**
 * Gate 1 (spec §6.2). Validates every discovered file against its Zod schema and
 * builds the typed RepoModel from the files that pass. A parse failure was
 * already reported by the loader, so those docs are skipped here.
 */
export function buildModel(root: string, diagnostics: Diagnostic[]): RepoModel {
  const model = emptyModel(root);
  const docs = discover(root).filter(
    (d): d is RawDoc & { data: unknown } => !d.parseError
  );

  // Map each course dir to the files under it, for lesson `files` (gate 5).
  const allFiles = walkFiles(root);

  // First pass: validate everything, collect typed entries.
  const validLessons: { doc: RawDoc; lesson: unknown }[] = [];
  const validCourses: { doc: RawDoc; course: unknown }[] = [];
  const slotsByDir = new Map<string, unknown>();

  for (const doc of docs) {
    const schema = SCHEMA[doc.kind];
    const parsed = schema.safeParse(coerce(doc.kind, doc.data));
    if (!parsed.success) {
      diagnostics.push(
        diag("gate-1", "error", doc.path, formatZodIssues(parsed.error))
      );
      continue;
    }
    const value = parsed.data;
    switch (doc.kind) {
      case "course":
        validCourses.push({ doc, course: value });
        break;
      case "lesson":
        validLessons.push({ doc, lesson: value });
        break;
      case "slots":
        slotsByDir.set(dirname(doc.path), value);
        break;
      case "quiz":
        model.standaloneQuizzes.push({ file: doc.path, quiz: value as never });
        break;
      case "achievement":
        model.achievements.push({
          file: doc.path,
          achievement: value as never,
        });
        break;
      case "quest":
        model.quests.push({ file: doc.path, quest: value as never });
        break;
      case "path":
        model.paths.push({ file: doc.path, path: value as never });
        break;
      case "instructor":
        model.instructors.push({
          file: doc.path,
          instructor: value as never,
        });
        break;
    }
  }

  for (const { doc, lesson } of validLessons) {
    const dir = dirname(doc.path);
    const l = lesson as { id: string };
    const entry = {
      id: l.id,
      dir,
      file: doc.path,
      lesson: lesson as never,
      files: allFiles.filter((f) => f.startsWith(dir + "/")),
    };
    model.lessons.push(entry);
    model.lessonsById.set(l.id, entry);
  }

  for (const { doc, course } of validCourses) {
    const dir = dirname(doc.path);
    const c = course as { id: string };
    const slotsPathCandidate = `${dir}/slots.lock.json`;
    model.courses.push({
      id: c.id,
      dir,
      file: doc.path,
      course: course as never,
      slotsPath: allFiles.includes(slotsPathCandidate)
        ? slotsPathCandidate
        : null,
      slotsLock: (slotsByDir.get(dir) as never) ?? null,
    });
  }

  return model;
}

registerSchemaCheck(buildModel);
