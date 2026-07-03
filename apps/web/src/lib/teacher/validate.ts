import "server-only";
import {
  COURSE_DIFFICULTIES,
  TEACHER_SETTABLE_AUTHORING_STATUSES,
  type CourseDifficulty,
  type TeacherCourseInput,
  type TeacherSettableAuthoringStatus,
} from "@/lib/sanity/teacher-mutations";

/**
 * SECURITY — request-body validation for the teacher course API (issue #265).
 *
 * The cardinal rule: NEVER spread an untrusted request body into a Sanity
 * mutation. Instead we read each allowlisted field explicitly, validate its
 * type/enum/bounds, and build a fresh `TeacherCourseInput`. Any field not read
 * here is silently dropped — so `author`, `onChainStatus`, `_id`, `_type`,
 * `_rev`, `creatorRewardXp`, `minCompletionsForReward`, `trackId`, `trackLevel`,
 * and `authoringStatus: "approved"` can never reach the write layer, no matter
 * what the client sends.
 */

// Conservative field bounds. These are UX/DoS guards, not the security boundary
// (that is the allowlist itself), but they keep obviously-bad payloads out.
const MAX_TITLE_LEN = 200;
const MAX_DESCRIPTION_LEN = 5000;
const MAX_DURATION_HOURS = 10_000;
const MAX_XP_REWARD = 1_000_000;
const MAX_XP_PER_LESSON = 100; // mirrors the course schema (.min(1).max(100))
const MAX_TAGS = 32;
const MAX_TAG_LEN = 64;
// Sanity document ids are opaque but bounded; guard against absurd inputs.
const MAX_SANITY_ID_LEN = 256;

export interface ValidationError {
  field: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ValidationError };

function err(
  field: string,
  message: string
): { ok: false; error: ValidationError } {
  return { ok: false, error: { field, message } };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isDifficulty(v: unknown): v is CourseDifficulty {
  return (
    typeof v === "string" &&
    (COURSE_DIFFICULTIES as readonly string[]).includes(v)
  );
}

function isTeacherAuthoringStatus(
  v: unknown
): v is TeacherSettableAuthoringStatus {
  return (
    typeof v === "string" &&
    (TEACHER_SETTABLE_AUTHORING_STATUSES as readonly string[]).includes(v)
  );
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** A non-empty, length-bounded Sanity id/ref string. */
function isValidSanityId(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= MAX_SANITY_ID_LEN;
}

/**
 * Validate a single field's presence/shape and, if present, write it into the
 * accumulating input. Returns a ValidationError on the first bad field.
 *
 * `mode: "create"` requires `title`; `mode: "patch"` treats everything as
 * optional (but still validates any field that IS present).
 */
export function validateTeacherCourseInput(
  raw: unknown,
  mode: "create" | "patch"
): ValidationResult<TeacherCourseInput> {
  if (!isPlainObject(raw)) {
    return err("body", "Request body must be a JSON object");
  }

  const out: TeacherCourseInput = {};

  // title
  if (raw.title !== undefined) {
    if (typeof raw.title !== "string") return err("title", "must be a string");
    const trimmed = raw.title.trim();
    if (trimmed.length === 0) return err("title", "must not be empty");
    if (trimmed.length > MAX_TITLE_LEN) {
      return err("title", `must be at most ${MAX_TITLE_LEN} characters`);
    }
    out.title = trimmed;
  } else if (mode === "create") {
    return err("title", "is required");
  }

  // description
  if (raw.description !== undefined) {
    if (typeof raw.description !== "string") {
      return err("description", "must be a string");
    }
    if (raw.description.length > MAX_DESCRIPTION_LEN) {
      return err(
        "description",
        `must be at most ${MAX_DESCRIPTION_LEN} characters`
      );
    }
    out.description = raw.description;
  }

  // difficulty
  if (raw.difficulty !== undefined) {
    if (!isDifficulty(raw.difficulty)) {
      return err(
        "difficulty",
        `must be one of ${COURSE_DIFFICULTIES.join(", ")}`
      );
    }
    out.difficulty = raw.difficulty;
  }

  // duration (hours)
  if (raw.duration !== undefined) {
    if (!isFiniteNumber(raw.duration) || raw.duration < 0) {
      return err("duration", "must be a non-negative number");
    }
    if (raw.duration > MAX_DURATION_HOURS) {
      return err("duration", `must be at most ${MAX_DURATION_HOURS}`);
    }
    out.duration = raw.duration;
  }

  // tags
  if (raw.tags !== undefined) {
    if (!Array.isArray(raw.tags)) return err("tags", "must be an array");
    if (raw.tags.length > MAX_TAGS) {
      return err("tags", `must have at most ${MAX_TAGS} items`);
    }
    const tags: string[] = [];
    for (const tag of raw.tags) {
      if (typeof tag !== "string") return err("tags", "must be strings");
      const t = tag.trim();
      if (t.length === 0) return err("tags", "must not contain empty strings");
      if (t.length > MAX_TAG_LEN) {
        return err(
          "tags",
          `each tag must be at most ${MAX_TAG_LEN} characters`
        );
      }
      tags.push(t);
    }
    out.tags = tags;
  }

  // xpReward
  if (raw.xpReward !== undefined) {
    if (
      !isFiniteNumber(raw.xpReward) ||
      raw.xpReward < 0 ||
      !Number.isInteger(raw.xpReward)
    ) {
      return err("xpReward", "must be a non-negative integer");
    }
    if (raw.xpReward > MAX_XP_REWARD) {
      return err("xpReward", `must be at most ${MAX_XP_REWARD}`);
    }
    out.xpReward = raw.xpReward;
  }

  // xpPerLesson
  if (raw.xpPerLesson !== undefined) {
    if (
      !isFiniteNumber(raw.xpPerLesson) ||
      !Number.isInteger(raw.xpPerLesson) ||
      raw.xpPerLesson < 1 ||
      raw.xpPerLesson > MAX_XP_PER_LESSON
    ) {
      return err(
        "xpPerLesson",
        `must be an integer between 1 and ${MAX_XP_PER_LESSON}`
      );
    }
    out.xpPerLesson = raw.xpPerLesson;
  }

  // thumbnail — Sanity image; accept { assetRef: "image-..." }
  if (raw.thumbnail !== undefined) {
    if (
      !isPlainObject(raw.thumbnail) ||
      !isValidSanityId(raw.thumbnail.assetRef)
    ) {
      return err("thumbnail", "must be an object with a valid assetRef string");
    }
    out.thumbnail = { assetRef: raw.thumbnail.assetRef };
  }

  // prerequisiteCourse — reference to another course; accept { ref: "<_id>" }
  if (raw.prerequisiteCourse !== undefined) {
    if (raw.prerequisiteCourse === null) {
      // Allow explicit clear via null is out of scope; treat null as "omit".
    } else if (
      !isPlainObject(raw.prerequisiteCourse) ||
      !isValidSanityId(raw.prerequisiteCourse.ref)
    ) {
      return err(
        "prerequisiteCourse",
        "must be an object with a valid ref string"
      );
    } else {
      out.prerequisiteCourse = { ref: raw.prerequisiteCourse.ref };
    }
  }

  // authoringStatus — TEACHER-settable subset ONLY (draft | pending_review).
  // "approved" (or any other value) is rejected here, so a teacher can never
  // self-publish through this API.
  if (raw.authoringStatus !== undefined) {
    if (!isTeacherAuthoringStatus(raw.authoringStatus)) {
      return err(
        "authoringStatus",
        `must be one of ${TEACHER_SETTABLE_AUTHORING_STATUSES.join(", ")}`
      );
    }
    out.authoringStatus = raw.authoringStatus;
  }

  return { ok: true, value: out };
}
