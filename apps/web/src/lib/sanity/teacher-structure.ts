import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "next-sanity";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import {
  planStructureMutations,
  type CurrentTree,
  type DesiredModule,
  type IdGen,
} from "@/lib/teacher/structure";

/**
 * Server-only Sanity client for reading/writing the course body (modules +
 * lessons). Uses the write-enabled SANITY_ADMIN_TOKEN, never exposed to the
 * browser. All access is mediated by the /api/teacher/* routes, which enforce
 * course ownership before calling in here.
 */
const sanityAdmin = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  token: serverEnv.SANITY_ADMIN_TOKEN,
  useCdn: false,
  apiVersion: "2024-01-01",
});

export interface StructureLessonRead {
  _id: string;
  title: string | null;
  type: string | null;
  content: string | null;
  videoUrl: string | null;
  language: string | null;
  buildType: string | null;
  code: string | null;
  solution: string | null;
  hints: string[] | null;
  tests:
    | {
        id: string | null;
        description: string | null;
        input: string | null;
        expectedOutput: string | null;
        hidden: boolean | null;
      }[]
    | null;
}

export interface StructureModuleRead {
  _id: string;
  title: string | null;
  description: string | null;
  lessons: StructureLessonRead[] | null;
}

/** The full course body for the builder to load and edit. */
export async function getCourseStructure(
  courseId: string
): Promise<StructureModuleRead[]> {
  const result = await sanityAdmin.fetch<{
    modules: StructureModuleRead[] | null;
  } | null>(
    `*[_type == "course" && _id == $courseId][0]{
      "modules": modules[]->{
        _id, title, description,
        "lessons": lessons[]->{
          _id, title, type, content, videoUrl, language, buildType, code,
          solution, hints,
          "tests": tests[]{ id, description, input, expectedOutput, hidden }
        }
      }
    }`,
    { courseId }
  );
  return result?.modules ?? [];
}

/** Flat id sets of the course's current modules + lessons (for the diff). */
async function getCurrentTreeIds(courseId: string): Promise<CurrentTree> {
  const result = await sanityAdmin.fetch<{
    modules: { _id: string; lessonIds: string[] | null }[] | null;
  } | null>(
    `*[_type == "course" && _id == $courseId][0]{
      "modules": modules[]->{ _id, "lessonIds": lessons[]->_id }
    }`,
    { courseId }
  );
  const modules = result?.modules ?? [];
  return {
    moduleIds: modules.map((m) => m._id),
    lessonIds: modules.flatMap((m) => m.lessonIds ?? []),
  };
}

function slugify(input: string): string {
  const base =
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "lesson";
  return `${base}-${randomUUID().slice(0, 6)}`;
}

/**
 * Reconcile the desired module/lesson tree onto `courseId` in a single Sanity
 * transaction. Ownership MUST already have been verified by the caller.
 */
export async function applyCourseStructure(
  courseId: string,
  desired: DesiredModule[]
): Promise<void> {
  const current = await getCurrentTreeIds(courseId);
  const gen: IdGen = {
    docId: () => randomUUID(),
    key: () => randomUUID().replace(/-/g, "").slice(0, 12),
    slug: slugify,
  };

  const mutations = planStructureMutations(courseId, current, desired, gen);

  const tx = sanityAdmin.transaction();
  for (const m of mutations) {
    if (m.op === "create") {
      tx.createOrReplace(m.doc as { _id: string; _type: string });
    } else if (m.op === "patch") {
      tx.patch(m.id, { set: m.set });
    } else {
      tx.delete(m.id);
    }
  }
  await tx.commit();
}
