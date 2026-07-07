import "server-only";
import { createClient } from "next-sanity";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

/**
 * SECURITY — teacher-scoped, server-only Sanity writes (issue #265).
 *
 * This module is the ONLY place (besides the admin-only `admin-mutations.ts`)
 * where the privileged `SANITY_ADMIN_TOKEN` is used. It is `server-only`, so it
 * can never be imported into a client component / the browser bundle. The
 * calling route (`/api/teacher/courses`) is responsible for authenticating the
 * caller and authorizing ownership BEFORE invoking anything here; this module
 * assumes those checks have already passed and focuses on constructing safe,
 * field-limited mutations.
 *
 * Two hard invariants enforced structurally (not just by convention):
 *   1. Callers never hand us a free-form patch object — they pass a typed
 *      `TeacherCourseInput`, and we copy an explicit allowlist field by field.
 *      A crafted request body therefore cannot smuggle in `author`,
 *      `onChainStatus`, `_id`, `_type`, `_rev`, or any other privileged field.
 *   2. `author` is set exactly once, at create time, from the server-derived
 *      Supabase user id — never from client input — and is never included in
 *      the PATCH allowlist, so it is immutable post-create through this API.
 */
const sanityAdmin = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  token: serverEnv.SANITY_ADMIN_TOKEN,
  useCdn: false,
  apiVersion: "2024-01-01",
});

/**
 * Upload a lesson-content image to Sanity's asset store and return its public
 * CDN URL (`cdn.sanity.io`, which is allowlisted in the app's `img-src` CSP so
 * it renders in the preview + on the lesson page). Server-only — the calling
 * route (`/api/teacher/upload-image`) MUST have passed `authorizeTeacher` and
 * validated the file (type/size) first.
 */
export async function uploadTeacherImage(
  data: Buffer,
  filename: string,
  contentType: string
): Promise<{ url: string; assetId: string }> {
  const asset = await sanityAdmin.assets.upload("image", data, {
    filename,
    contentType,
  });
  return { url: asset.url, assetId: asset._id };
}

/** Difficulty enum mirrored from the course schema. */
export const COURSE_DIFFICULTIES = [
  "beginner",
  "intermediate",
  "advanced",
] as const;
export type CourseDifficulty = (typeof COURSE_DIFFICULTIES)[number];

/**
 * Authoring-status values a TEACHER may set through this API.
 *
 * `approved` is deliberately absent — publishing a course is an admin-only
 * action (issue #268) and must never be reachable from a teacher-supplied body.
 */
export const TEACHER_SETTABLE_AUTHORING_STATUSES = [
  "draft",
  "pending_review",
] as const;
export type TeacherSettableAuthoringStatus =
  (typeof TEACHER_SETTABLE_AUTHORING_STATUSES)[number];

/**
 * The complete set of course fields a teacher is permitted to write, and their
 * validated shapes. This is the whitelist — anything NOT in this interface can
 * never be written through the teacher API. All fields are optional on PATCH;
 * only those present are copied through.
 *
 * Reference/image fields (`thumbnail`, `prerequisiteCourse`) are modeled as the
 * exact Sanity shapes we accept, so a malformed reference is rejected before it
 * reaches Sanity rather than corrupting the document.
 */
export interface TeacherCourseInput {
  title?: string;
  description?: string;
  difficulty?: CourseDifficulty;
  duration?: number;
  /** Sanity image reference to an already-uploaded asset. */
  thumbnail?: { assetRef: string };
  tags?: string[];
  xpReward?: number;
  xpPerLesson?: number;
  /** Sanity document _id of another course to require as a prerequisite. */
  prerequisiteCourse?: { ref: string };
  authoringStatus?: TeacherSettableAuthoringStatus;
}

/** Minimal shape returned to the caller for ownership + status checks. */
export interface TeacherCourseSummary {
  _id: string;
  title: string | null;
  slug: string | null;
  difficulty: string | null;
  author: string | null;
  authoringStatus: string | null;
  onChainStatus: string | null;
}

/**
 * Translate a validated `TeacherCourseInput` into a plain Sanity patch object,
 * copying ONLY the allowlisted fields that are actually present. Reference and
 * image fields are expanded into their canonical Sanity shapes here.
 *
 * This function is intentionally exhaustive and explicit: adding a new writable
 * field requires editing both `TeacherCourseInput` and this mapper, which keeps
 * the security-relevant surface visible in one place.
 */
function toSanityPatch(input: TeacherCourseInput): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.difficulty !== undefined) patch.difficulty = input.difficulty;
  if (input.duration !== undefined) patch.duration = input.duration;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.xpReward !== undefined) patch.xpReward = input.xpReward;
  if (input.xpPerLesson !== undefined) patch.xpPerLesson = input.xpPerLesson;
  if (input.authoringStatus !== undefined) {
    patch.authoringStatus = input.authoringStatus;
  }
  if (input.thumbnail !== undefined) {
    patch.thumbnail = {
      _type: "image",
      asset: { _type: "reference", _ref: input.thumbnail.assetRef },
    };
  }
  if (input.prerequisiteCourse !== undefined) {
    patch.prerequisiteCourse = {
      _type: "reference",
      _ref: input.prerequisiteCourse.ref,
    };
  }

  return patch;
}

/**
 * List the courses owned by a single teacher (`author == authorId`), newest
 * first. Uses the server-only admin client so drafts (which the public gate
 * hides) are visible to their owner.
 */
export async function listTeacherCourses(
  authorId: string
): Promise<TeacherCourseSummary[]> {
  return sanityAdmin.fetch<TeacherCourseSummary[]>(
    `*[_type == "course" && !(_id in path("drafts.**")) && author == $authorId]
      | order(_createdAt desc) {
        _id,
        title,
        "slug": slug.current,
        difficulty,
        author,
        authoringStatus,
        "onChainStatus": onChainStatus.status
      }`,
    { authorId }
  );
}

/**
 * List ALL courses (admin-only view). Same projection as {@link listTeacherCourses}.
 */
export async function listAllCourses(): Promise<TeacherCourseSummary[]> {
  return sanityAdmin.fetch<TeacherCourseSummary[]>(
    `*[_type == "course" && !(_id in path("drafts.**"))]
      | order(_createdAt desc) {
        _id,
        title,
        "slug": slug.current,
        difficulty,
        author,
        authoringStatus,
        "onChainStatus": onChainStatus.status
      }`
  );
}

/**
 * Fetch a single course's ownership-relevant fields for the authorization check
 * performed before a PATCH. Returns null if the course does not exist.
 */
export async function getCourseAuthorship(
  courseId: string
): Promise<TeacherCourseSummary | null> {
  return sanityAdmin.fetch<TeacherCourseSummary | null>(
    `*[_type == "course" && _id == $courseId][0] {
      _id,
      title,
      "slug": slug.current,
      difficulty,
      author,
      authoringStatus,
      "onChainStatus": onChainStatus.status
    }`,
    { courseId }
  );
}

/**
 * Create a new draft course. The server sets `author` (from the authenticated
 * user id — NEVER from client input) and forces `authoringStatus = "draft"`.
 * Any whitelisted fields in `input` are applied on top; `authoringStatus` in
 * `input` is ignored here because creation is always a draft.
 *
 * @returns the created document `_id`.
 */
export async function createTeacherCourse(
  authorId: string,
  slug: string,
  input: TeacherCourseInput
): Promise<{ _id: string }> {
  const patch = toSanityPatch(input);
  // Creation is always a draft regardless of any client-supplied status.
  delete patch.authoringStatus;

  const created = await sanityAdmin.create({
    _type: "course",
    ...patch,
    slug: { _type: "slug", current: slug },
    author: authorId,
    authoringStatus: "draft",
  });

  return { _id: created._id };
}

/**
 * Apply a whitelisted patch to an existing course. Authorization (ownership /
 * admin) MUST already have been checked by the caller. `author`, `_id`,
 * `_type`, `_rev`, `onChainStatus`, and every other non-allowlisted field are
 * structurally excluded because `toSanityPatch` copies only known fields.
 */
export async function patchTeacherCourse(
  courseId: string,
  input: TeacherCourseInput
): Promise<void> {
  const patch = toSanityPatch(input);
  if (Object.keys(patch).length === 0) return;
  await sanityAdmin.patch(courseId).set(patch).commit();
}

/** Result of a successful thumbnail upload — the new asset ref + display URL. */
export interface UploadedThumbnail {
  assetRef: string;
  url: string;
}

/**
 * Upload an image to the Sanity asset store and set it as a course thumbnail
 * (issue #278). Authorization (ownership / admin) MUST already have been checked
 * by the caller — this mirrors {@link patchTeacherCourse}.
 *
 * The privileged token never leaves the server: the bytes are streamed through
 * the same server-only `sanityAdmin` client, and the resulting asset `_id` is
 * applied via {@link patchTeacherCourse}, so the thumbnail write stays on the
 * single-sourced field whitelist (a raw patch object is never constructed here).
 */
export async function uploadCourseThumbnail(
  courseId: string,
  bytes: Buffer,
  meta: { filename: string; contentType: string }
): Promise<UploadedThumbnail> {
  const asset = await sanityAdmin.assets.upload("image", bytes, {
    filename: meta.filename,
    contentType: meta.contentType,
  });

  await patchTeacherCourse(courseId, { thumbnail: { assetRef: asset._id } });

  return { assetRef: asset._id, url: asset.url };
}

/** Full editable field set for the course builder (issue #266). */
export interface TeacherCourseEditable {
  _id: string;
  author: string | null;
  authoringStatus: string | null;
  onChainStatus: string | null;
  title: string | null;
  description: string | null;
  difficulty: string | null;
  duration: number | null;
  tags: string[] | null;
  xpReward: number | null;
  xpPerLesson: number | null;
  /** Resolved CDN URL of the current thumbnail asset, if any (issue #278). */
  thumbnailUrl: string | null;
}

/**
 * Fetch a course's full editable fields for the builder, including the
 * ownership fields the caller needs to authorize. Returns null if absent.
 */
export async function getTeacherCourseEditable(
  courseId: string
): Promise<TeacherCourseEditable | null> {
  return sanityAdmin.fetch<TeacherCourseEditable | null>(
    `*[_type == "course" && _id == $courseId][0] {
      _id, author, authoringStatus, "onChainStatus": onChainStatus.status,
      title, description, difficulty, duration, tags, xpReward, xpPerLesson,
      "thumbnailUrl": thumbnail.asset->url
    }`,
    { courseId }
  );
}
