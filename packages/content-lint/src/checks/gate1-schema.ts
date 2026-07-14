import type { ZodType } from "zod";
import {
  Course,
  Lesson,
  QuizBlock,
  Achievement,
  Quest,
  LearningPath,
  SlotsLock,
  type CourseT,
  type LessonT,
  type SlotsLockT,
} from "@superteam-lms/content-schema";
import { discover, walkFiles, type DocKind, type RawDoc } from "../loader";
import { emptyModel, type RepoModel } from "../model";
import { registerSchemaCheck } from "../lint";
import { diag, type Diagnostic } from "../diagnostics";
import { dirname } from "node:path";

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

  // Parse with the CONCRETE schema per kind, so each result carries its real
  // output type into the RepoModel — no `as never`/`as any` bridging.
  const parse = <T>(doc: RawDoc & { data: unknown }, schema: ZodType<T>) => {
    const parsed = schema.safeParse(coerce(doc.kind, doc.data));
    if (!parsed.success) {
      diagnostics.push(
        diag("gate-1", "error", doc.path, formatZodIssues(parsed.error))
      );
      return null;
    }
    return parsed.data;
  };

  // First pass: validate everything, collect typed entries.
  const validLessons: { doc: RawDoc; lesson: LessonT }[] = [];
  const validCourses: { doc: RawDoc; course: CourseT }[] = [];
  const slotsByDir = new Map<string, SlotsLockT>();

  for (const doc of docs) {
    switch (doc.kind) {
      case "course": {
        const course = parse(doc, Course);
        if (course) validCourses.push({ doc, course });
        break;
      }
      case "lesson": {
        const lesson = parse(doc, Lesson);
        if (lesson) validLessons.push({ doc, lesson });
        break;
      }
      case "slots": {
        const slots = parse(doc, SlotsLock);
        if (slots) slotsByDir.set(dirname(doc.path), slots);
        break;
      }
      case "quiz": {
        const quiz = parse(doc, QuizBlock);
        if (quiz) model.standaloneQuizzes.push({ file: doc.path, quiz });
        break;
      }
      case "achievement": {
        const achievement = parse(doc, Achievement);
        if (achievement)
          model.achievements.push({ file: doc.path, achievement });
        break;
      }
      case "quest": {
        const quest = parse(doc, Quest);
        if (quest) model.quests.push({ file: doc.path, quest });
        break;
      }
      case "path": {
        const path = parse(doc, LearningPath);
        if (path) model.paths.push({ file: doc.path, path });
        break;
      }
    }
  }

  for (const { doc, lesson } of validLessons) {
    const dir = dirname(doc.path);
    const entry = {
      id: lesson.id,
      dir,
      file: doc.path,
      lesson,
      files: allFiles.filter((f) => f.startsWith(dir + "/")),
    };
    model.lessons.push(entry);
    model.lessonsById.set(lesson.id, entry);
  }

  for (const { doc, course } of validCourses) {
    const dir = dirname(doc.path);
    const slotsPathCandidate = `${dir}/slots.lock.json`;
    model.courses.push({
      id: course.id,
      dir,
      file: doc.path,
      course,
      slotsPath: allFiles.includes(slotsPathCandidate)
        ? slotsPathCandidate
        : null,
      slotsLock: slotsByDir.get(dir) ?? null,
    });
  }

  return model;
}

registerSchemaCheck(buildModel);
