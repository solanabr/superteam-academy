/**
 * Pure reconciliation for the course-body builder (issue #267).
 *
 * The course body is a two-level tree of SEPARATE Sanity documents:
 *   course.modules[] -> module docs -> module.lessons[] -> lesson docs
 * with `tests` inline on each lesson. The builder edits the whole tree client-
 * side and PUTs the desired state; this module diffs it against the current
 * state and produces a flat list of Sanity mutations (create / patch / delete +
 * the ordered reference arrays). It is PURE and id-injectable so the diff logic
 * is unit-testable without touching Sanity.
 *
 * Ownership is checked by the caller (against the parent course's `author`)
 * BEFORE planning; this module assumes that has passed.
 */

export interface StructureTest {
  id: string;
  description: string;
  input?: string;
  expectedOutput?: string;
  hidden?: boolean;
}

export interface DesiredLesson {
  /** Present when editing an existing lesson doc; absent for a new one. */
  _id?: string;
  title: string;
  type: "content" | "challenge";
  content?: string | null;
  videoUrl?: string | null;
  language?: string | null;
  buildType?: string | null;
  code?: string | null;
  solution?: string | null;
  hints?: string[];
  tests?: StructureTest[];
}

export interface DesiredModule {
  _id?: string;
  title: string;
  description?: string | null;
  lessons: DesiredLesson[];
}

export interface CurrentTree {
  moduleIds: string[];
  lessonIds: string[];
}

export type StructureMutation =
  | { op: "create"; doc: Record<string, unknown> }
  | { op: "patch"; id: string; set: Record<string, unknown> }
  | { op: "delete"; id: string };

export interface IdGen {
  /** New document id for a module/lesson. */
  docId: (kind: "module" | "lesson") => string;
  /** New `_key` for a reference array item. */
  key: () => string;
  /** Slug string for a newly-created lesson. */
  slug: (title: string) => string;
}

/** Lesson doc fields written on both create and patch (order added by caller). */
function lessonFields(l: DesiredLesson): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    title: l.title,
    type: l.type,
  };
  // Content-lesson fields.
  if (l.content !== undefined) fields.content = l.content ?? undefined;
  if (l.videoUrl !== undefined) fields.videoUrl = l.videoUrl ?? undefined;
  // Challenge-lesson fields (only meaningful for type === "challenge", but we
  // persist whatever the editor sends; the schema hides them for content).
  if (l.language !== undefined) fields.language = l.language ?? undefined;
  if (l.buildType !== undefined) fields.buildType = l.buildType ?? undefined;
  if (l.code !== undefined) fields.code = l.code ?? undefined;
  if (l.solution !== undefined) fields.solution = l.solution ?? undefined;
  if (l.hints !== undefined) fields.hints = l.hints;
  if (l.tests !== undefined) {
    fields.tests = l.tests.map((t) => ({
      _type: "object",
      id: t.id,
      description: t.description,
      input: t.input ?? "",
      expectedOutput: t.expectedOutput ?? "",
      hidden: t.hidden === true,
    }));
  }
  return fields;
}

function ref(id: string, key: string): Record<string, unknown> {
  return { _type: "reference", _ref: id, _key: key };
}

/**
 * Plan the mutations that transform `current` into `desired` for `courseId`.
 * Order in the arrays becomes the `order` field and the reference-array order.
 */
export function planStructureMutations(
  courseId: string,
  current: CurrentTree,
  desired: DesiredModule[],
  gen: IdGen
): StructureMutation[] {
  const mutations: StructureMutation[] = [];
  const keptModuleIds = new Set<string>();
  const keptLessonIds = new Set<string>();
  const currentLessonIds = new Set(current.lessonIds);
  const currentModuleIds = new Set(current.moduleIds);

  const courseModuleRefs: Record<string, unknown>[] = [];

  desired.forEach((mod, moduleOrder) => {
    const moduleId = mod._id ?? gen.docId("module");
    keptModuleIds.add(moduleId);

    const lessonRefs: Record<string, unknown>[] = [];
    mod.lessons.forEach((les, lessonOrder) => {
      const lessonId = les._id ?? gen.docId("lesson");
      keptLessonIds.add(lessonId);

      const fields = { ...lessonFields(les), order: lessonOrder };
      if (les._id && currentLessonIds.has(les._id)) {
        mutations.push({ op: "patch", id: lessonId, set: fields });
      } else {
        mutations.push({
          op: "create",
          doc: {
            _id: lessonId,
            _type: "lesson",
            slug: { _type: "slug", current: gen.slug(les.title) },
            ...fields,
          },
        });
      }
      lessonRefs.push(ref(lessonId, gen.key()));
    });

    const moduleSet = {
      title: mod.title,
      description: mod.description ?? undefined,
      lessons: lessonRefs,
      order: moduleOrder,
    };
    if (mod._id && currentModuleIds.has(mod._id)) {
      mutations.push({ op: "patch", id: moduleId, set: moduleSet });
    } else {
      mutations.push({
        op: "create",
        doc: { _id: moduleId, _type: "module", ...moduleSet },
      });
    }
    courseModuleRefs.push(ref(moduleId, gen.key()));
  });

  // Point the course at the ordered module set.
  mutations.push({
    op: "patch",
    id: courseId,
    set: { modules: courseModuleRefs },
  });

  // Delete docs that were dropped from the tree (lessons before modules is
  // fine — Sanity resolves the whole transaction atomically).
  for (const id of current.lessonIds) {
    if (!keptLessonIds.has(id)) mutations.push({ op: "delete", id });
  }
  for (const id of current.moduleIds) {
    if (!keptModuleIds.has(id)) mutations.push({ op: "delete", id });
  }

  return mutations;
}
