import "server-only";
import { createClient } from "next-sanity";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

/**
 * Server-only Sanity write client for teacher-authored courses. Uses the
 * write-enabled SANITY_ADMIN_TOKEN, which NEVER reaches the browser — all
 * teacher writes are mediated through the /api/teacher/* routes, which enforce
 * role + ownership before calling into here.
 */
const sanityWrite = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  token: serverEnv.SANITY_ADMIN_TOKEN,
  useCdn: false,
  apiVersion: "2024-01-01",
});

export type AuthoringStatus = "draft" | "pending_review" | "approved";

/** Whitelisted, teacher-writable course metadata. */
export interface TeacherCourseMeta {
  title?: string;
  description?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  duration?: number;
  tags?: string[];
  xpReward?: number;
  xpPerLesson?: number;
}

export interface TeacherCourseSummary {
  _id: string;
  title: string | null;
  slug: string | null;
  authoringStatus: AuthoringStatus | null;
  onChainStatus: string | null;
}

function slugify(input: string): string {
  const base =
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "course";
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Validate + whitelist an untrusted request body into TeacherCourseMeta.
 * Throws on any bad field. Only these fields are ever writable by a teacher —
 * `author`, `authoringStatus`, `onChainStatus` are set by the server, never the
 * client.
 */
export function parseCourseMeta(body: unknown): TeacherCourseMeta {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid body");
  }
  const b = body as Record<string, unknown>;
  const meta: TeacherCourseMeta = {};

  if (b.title !== undefined) {
    if (typeof b.title !== "string" || !b.title.trim() || b.title.length > 200)
      throw new Error("Invalid title");
    meta.title = b.title.trim();
  }
  if (b.description !== undefined) {
    if (typeof b.description !== "string" || b.description.length > 5000)
      throw new Error("Invalid description");
    meta.description = b.description;
  }
  if (b.difficulty !== undefined) {
    if (
      b.difficulty !== "beginner" &&
      b.difficulty !== "intermediate" &&
      b.difficulty !== "advanced"
    )
      throw new Error("Invalid difficulty");
    meta.difficulty = b.difficulty;
  }
  if (b.duration !== undefined) {
    if (typeof b.duration !== "number" || b.duration < 0 || b.duration > 1000)
      throw new Error("Invalid duration");
    meta.duration = b.duration;
  }
  if (b.tags !== undefined) {
    if (
      !Array.isArray(b.tags) ||
      b.tags.length > 20 ||
      b.tags.some((t) => typeof t !== "string" || t.length > 40)
    )
      throw new Error("Invalid tags");
    meta.tags = b.tags as string[];
  }
  if (b.xpReward !== undefined) {
    if (typeof b.xpReward !== "number" || b.xpReward < 0 || b.xpReward > 100000)
      throw new Error("Invalid xpReward");
    meta.xpReward = b.xpReward;
  }
  if (b.xpPerLesson !== undefined) {
    if (
      typeof b.xpPerLesson !== "number" ||
      b.xpPerLesson < 1 ||
      b.xpPerLesson > 100
    )
      throw new Error("Invalid xpPerLesson");
    meta.xpPerLesson = b.xpPerLesson;
  }
  return meta;
}

/** Courses owned by a given teacher (their Supabase user id in `author`). */
export async function listCoursesByAuthor(
  author: string
): Promise<TeacherCourseSummary[]> {
  return sanityWrite.fetch<TeacherCourseSummary[]>(
    `*[_type == "course" && author == $author] | order(_updatedAt desc) {
      _id, title, "slug": slug.current, authoringStatus,
      "onChainStatus": onChainStatus.status
    }`,
    { author }
  );
}

/** Ownership + status for a single course, or null when it doesn't exist. */
export async function getCourseOwnership(
  id: string
): Promise<{ author: string | null; authoringStatus: AuthoringStatus | null } | null> {
  return sanityWrite.fetch(
    `*[_type == "course" && _id == $id][0]{ author, authoringStatus }`,
    { id }
  );
}

/** Create a draft course owned by `author`. Returns the new document id. */
export async function createDraftCourse(
  author: string,
  meta: TeacherCourseMeta
): Promise<string> {
  const title = meta.title ?? "Untitled course";
  const doc = await sanityWrite.create({
    _type: "course",
    ...meta,
    title,
    slug: { _type: "slug", current: slugify(title) },
    author,
    authoringStatus: "draft",
  });
  return doc._id;
}

/** Patch whitelisted metadata fields on an existing course. */
export async function patchCourseMeta(
  id: string,
  meta: TeacherCourseMeta
): Promise<void> {
  if (Object.keys(meta).length === 0) return;
  await sanityWrite.patch(id).set(meta).commit();
}

/**
 * Set the authoring status. Teachers may only reach `draft` or `pending_review`
 * (submit for review); `approved` is admin-only and lives in the review flow.
 */
export async function setAuthoringStatus(
  id: string,
  status: "draft" | "pending_review"
): Promise<void> {
  await sanityWrite.patch(id).set({ authoringStatus: status }).commit();
}
