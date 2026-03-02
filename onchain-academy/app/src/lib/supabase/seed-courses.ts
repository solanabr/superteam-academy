/**
 * Seed Supabase with course data from the static courses array.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   npx tsx src/lib/supabase/seed-courses.ts
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

// ---------------------------------------------------------------------------
// Supabase client (service_role bypasses RLS)
// ---------------------------------------------------------------------------

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// Deterministic UUID from a string seed — makes the script idempotent
// ---------------------------------------------------------------------------

function deterministicUUID(seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex");
  // Format as UUID v4 shape: 8-4-4-4-12
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16), // version 4
    ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20), // variant
    hash.slice(20, 32),
  ].join("-");
}

// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Parse duration string to estimated minutes
// ---------------------------------------------------------------------------

function parseDurationMinutes(dur: string): number {
  const match = dur.match(/(\d+)\s*min/i);
  if (match) return parseInt(match[1], 10);
  const hrMatch = dur.match(/(\d+)\s*h/i);
  if (hrMatch) return parseInt(hrMatch[1], 10) * 60;
  return 10;
}

// ---------------------------------------------------------------------------
// Import courses from the static data
// ---------------------------------------------------------------------------

// We import the courses array at runtime so the script can be run standalone.
// The courses file uses TS path aliases, so we reference it relatively.
import { courses } from "../services/courses";

// ---------------------------------------------------------------------------
// DB row types (matching course-schema.sql)
// ---------------------------------------------------------------------------

interface CourseRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  long_description: string;
  track: string;
  difficulty: string;
  lesson_count: number;
  duration: string;
  xp_reward: number;
  estimated_hours: number;
  creator: string;
  prerequisite_id: string | null;
  is_active: boolean;
  published: boolean;
  learning_outcomes: string[];
  total_completions: number;
  enrolled_count: number;
  image_url: string | null;
}

interface ModuleRow {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order: number;
}

interface LessonRow {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  type: string;
  duration: string;
  xp_reward: number;
  estimated_minutes: number;
  order: number;
  content: string;
  challenge_instructions: string | null;
  challenge_starter_code: string | null;
  challenge_solution: string | null;
  challenge_language: string | null;
  challenge_test_cases: object | null;
}

// ---------------------------------------------------------------------------
// Parse estimated hours from duration string like "4 hours" or "5 hours"
// ---------------------------------------------------------------------------

function parseEstimatedHours(duration: string): number {
  const match = duration.match(/(\d+(?:\.\d+)?)\s*hour/i);
  if (match) return parseFloat(match[1]);
  const minMatch = duration.match(/(\d+)\s*min/i);
  if (minMatch) return parseFloat(minMatch[1]) / 60;
  return 0;
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed() {
  console.log(`Seeding ${courses.length} courses into Supabase...`);
  console.log(`URL: ${SUPABASE_URL}`);

  const courseRows: CourseRow[] = [];
  const moduleRows: ModuleRow[] = [];
  const lessonRows: LessonRow[] = [];

  for (const course of courses) {
    // Count total lessons across all modules
    let totalLessons = 0;
    for (const mod of course.modules) {
      totalLessons += mod.lessons.length;
    }

    courseRows.push({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      long_description: course.description, // use description as long_description
      track: course.track,
      difficulty: course.difficulty,
      lesson_count: totalLessons,
      duration: course.duration,
      xp_reward: course.xpReward,
      estimated_hours: parseEstimatedHours(course.duration),
      creator: course.creator,
      prerequisite_id: course.prerequisiteId ?? null,
      is_active: course.isActive,
      published: true, // all existing courses are published
      learning_outcomes: [],
      total_completions: course.totalCompletions,
      enrolled_count: course.enrolledCount,
      image_url: (course as unknown as { imageUrl?: string }).imageUrl ?? null,
    });

    for (let mi = 0; mi < course.modules.length; mi++) {
      const mod = course.modules[mi];
      const moduleId = deterministicUUID(`module:${course.id}:${mod.id}`);

      moduleRows.push({
        id: moduleId,
        course_id: course.id,
        title: mod.title,
        description: "",
        order: mi,
      });

      for (let li = 0; li < mod.lessons.length; li++) {
        const lesson = mod.lessons[li];
        const lessonId = deterministicUUID(
          `lesson:${course.id}:${mod.id}:${lesson.id}`,
        );

        lessonRows.push({
          id: lessonId,
          module_id: moduleId,
          title: lesson.title,
          slug: slugify(lesson.title),
          type: lesson.type,
          duration: lesson.duration,
          xp_reward: lesson.xpReward,
          estimated_minutes: parseDurationMinutes(lesson.duration),
          order: li,
          content: lesson.content ?? "",
          challenge_instructions: lesson.challenge?.instructions ?? null,
          challenge_starter_code: lesson.challenge?.starterCode ?? null,
          challenge_solution: lesson.challenge?.solution ?? null,
          challenge_language: lesson.challenge?.language ?? null,
          challenge_test_cases: lesson.challenge?.testCases ?? null,
        });
      }
    }
  }

  // ── Upsert courses ───────────────────────────────────────────────────────
  // Insert courses without prerequisite_id first (avoid FK constraint issues
  // when courses reference each other). Then update prerequisite_id.

  const coursesWithoutPrereq = courseRows.map((c) => ({
    ...c,
    prerequisite_id: null,
  }));

  console.log(`  Upserting ${coursesWithoutPrereq.length} courses...`);
  const { error: courseErr } = await supabase
    .from("courses")
    .upsert(coursesWithoutPrereq, { onConflict: "id" });

  if (courseErr) {
    console.error("Failed to upsert courses:", courseErr);
    process.exit(1);
  }

  // Now set prerequisite_id for courses that have one
  for (const course of courseRows) {
    if (course.prerequisite_id) {
      const { error: prereqErr } = await supabase
        .from("courses")
        .update({ prerequisite_id: course.prerequisite_id })
        .eq("id", course.id);

      if (prereqErr) {
        console.error(
          `Failed to set prerequisite for ${course.id}:`,
          prereqErr,
        );
      }
    }
  }

  // ── Upsert modules ──────────────────────────────────────────────────────

  console.log(`  Upserting ${moduleRows.length} modules...`);
  const { error: moduleErr } = await supabase
    .from("modules")
    .upsert(moduleRows, { onConflict: "id" });

  if (moduleErr) {
    console.error("Failed to upsert modules:", moduleErr);
    process.exit(1);
  }

  // ── Upsert lessons ──────────────────────────────────────────────────────

  console.log(`  Upserting ${lessonRows.length} lessons...`);

  // Supabase has a max payload size, so batch lessons in chunks of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < lessonRows.length; i += BATCH_SIZE) {
    const batch = lessonRows.slice(i, i + BATCH_SIZE);
    const { error: lessonErr } = await supabase
      .from("lessons")
      .upsert(batch, { onConflict: "id" });

    if (lessonErr) {
      console.error(
        `Failed to upsert lessons batch ${i / BATCH_SIZE + 1}:`,
        lessonErr,
      );
      process.exit(1);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────

  console.log("\nSeed complete:");
  console.log(`  Courses: ${courseRows.length}`);
  console.log(`  Modules: ${moduleRows.length}`);
  console.log(`  Lessons: ${lessonRows.length}`);

  for (const c of courseRows) {
    const mods = moduleRows.filter((m) => m.course_id === c.id);
    const lessons = lessonRows.filter((l) =>
      mods.some((m) => m.id === l.module_id),
    );
    console.log(
      `    ${c.id}: ${mods.length} modules, ${lessons.length} lessons`,
    );
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
