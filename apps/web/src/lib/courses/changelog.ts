import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import type {
  CourseChangelogEntry,
  ChangelogLessonRef,
} from "./changelog-types";

/**
 * Course changelog (#654) — READ seam.
 *
 * Reads the learner-visible evolution log for one course through the ordinary
 * RLS-respecting server client (the table has a public SELECT policy, so anon +
 * authenticated both read it). Titles are already snapshotted in `detail`, so
 * this never touches the content bundle. The raw `detail` JSON is defensively
 * narrowed into the discriminated `CourseChangelogEntry` union; a row whose
 * `detail` doesn't match its `kind` is dropped rather than rendered as garbage.
 */

const MAX_ENTRIES = 50;

function isRecord(v: Json): v is { [k: string]: Json } {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toLessonRefs(v: Json): ChangelogLessonRef[] | null {
  if (!isRecord(v) || !Array.isArray(v.lessons)) return null;
  const refs: ChangelogLessonRef[] = [];
  for (const raw of v.lessons) {
    if (!isRecord(raw) || typeof raw.slot !== "number") return null;
    refs.push({
      slot: raw.slot,
      id: typeof raw.id === "string" ? raw.id : null,
      title: typeof raw.title === "string" ? raw.title : null,
    });
  }
  return refs;
}

function decodeEntry(row: {
  id: number;
  kind: string;
  version: number;
  detail: Json;
  tx_signature: string;
  created_at: string;
}): CourseChangelogEntry | null {
  const base = {
    id: row.id,
    version: row.version,
    txSignature: row.tx_signature,
    createdAt: row.created_at,
  };
  const d = row.detail;
  switch (row.kind) {
    case "deployed": {
      const lessonCount =
        isRecord(d) && typeof d.lessonCount === "number" ? d.lessonCount : 0;
      return { ...base, kind: "deployed", detail: { lessonCount } };
    }
    case "lessons_added":
    case "lessons_removed": {
      const lessons = toLessonRefs(d);
      if (!lessons) return null;
      return { ...base, kind: row.kind, detail: { lessons } };
    }
    case "xp_changed": {
      if (
        !isRecord(d) ||
        typeof d.from !== "number" ||
        typeof d.to !== "number"
      ) {
        return null;
      }
      return {
        ...base,
        kind: "xp_changed",
        detail: { from: d.from, to: d.to },
      };
    }
    case "content_updated": {
      const sha = isRecord(d) && typeof d.sha === "string" ? d.sha : "";
      return { ...base, kind: "content_updated", detail: { sha } };
    }
    default:
      return null;
  }
}

/**
 * Newest-first changelog entries for a course. Returns `[]` on any error (an
 * unavailable log must never break the course page) or when the course has no
 * recorded changes yet (the common case → the UI renders its empty state).
 */
export async function getCourseChangelog(
  courseId: string
): Promise<CourseChangelogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_changelog")
    .select("id, kind, version, detail, tx_signature, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(MAX_ENTRIES);

  if (error || !data) return [];

  const entries: CourseChangelogEntry[] = [];
  for (const row of data) {
    const decoded = decodeEntry(row);
    if (decoded) entries.push(decoded);
  }
  return entries;
}
