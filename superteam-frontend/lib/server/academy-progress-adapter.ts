import "server-only";

import { PublicKey } from "@solana/web3.js";
import type { Course } from "@/lib/course-catalog";
import { getAllCourses, getCourse } from "@/lib/server/admin-store";
import {
  deriveCoursePda,
  deriveEnrollmentPda,
  ensureCourseOnChain,
  fetchEnrollment,
  fetchEnrollmentsBatch,
  invalidateEnrollmentCache,
} from "@/lib/server/academy-program";
import { getCatalogCourseMeta } from "@/lib/server/academy-course-catalog";

export type CourseProgressSnapshot = {
  course: Course;
  enrolledOnChain: boolean;
  enrollmentPda: string;
  completedLessons: number;
};

async function cloneCourse(slug: string): Promise<Course | null> {
  const raw = await getCourse(slug);
  if (!raw) return null;
  return JSON.parse(JSON.stringify(raw)) as Course;
}

function applyProgress(course: Course, completedLessons: number): Course {
  const total = course.modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0,
  );
  let remaining = Math.max(0, completedLessons);

  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      lesson.completed = remaining > 0;
      if (remaining > 0) remaining -= 1;
    }
  }

  const done = Math.min(completedLessons, total);
  course.progress = total > 0 ? Math.round((done / total) * 100) : 0;
  return course;
}

export async function getCourseProgressSnapshot(
  walletAddress: string,
  slug: string,
  options?: { forceRefresh?: boolean },
): Promise<CourseProgressSnapshot | null> {
  const meta = await getCatalogCourseMeta(slug);
  if (!meta) return null;

  try {
    await ensureCourseOnChain(meta.slug, meta.lessonsCount, meta.trackId);
  } catch {
    // On-chain sync is best-effort — don't block course display
  }

  const user = new PublicKey(walletAddress);

  // If forceRefresh requested, clear stale cache first
  if (options?.forceRefresh) {
    invalidateEnrollmentCache(user, meta.slug);
  }

  let enrollment: any = null;
  try {
    enrollment = await fetchEnrollment(user, meta.slug);
  } catch {
    // Network error — assume not enrolled (safe fallback)
  }

  const completedLessons = enrollment ? Number(enrollment.lessonsCompleted) : 0;
  const course = await cloneCourse(slug);
  if (!course) return null;

  const coursePda = deriveCoursePda(meta.slug);
  const enrollmentPda = deriveEnrollmentPda(coursePda, user);

  return {
    course: applyProgress(course, completedLessons),
    enrolledOnChain: Boolean(enrollment),
    completedLessons,
    enrollmentPda: enrollmentPda.toBase58(),
  };
}

export async function getAllCourseProgressSnapshots(
  walletAddress: string,
  slugs?: string[],
): Promise<CourseProgressSnapshot[]> {
  const courseList = slugs
    ? (await Promise.all(slugs.map((s) => getCourse(s)))).filter(Boolean)
    : await getAllCourses();

  const validCourses = courseList.filter(
    (c): c is NonNullable<typeof c> => c != null,
  );
  const user = new PublicKey(walletAddress);

  const enrollments = await fetchEnrollmentsBatch(
    user,
    validCourses.map((c) => c.slug),
  );

  const snapshots: CourseProgressSnapshot[] = [];
  for (const course of validCourses) {
    const clone = await cloneCourse(course.slug);
    if (!clone) continue;

    const enrollment = enrollments.get(course.slug);
    const completedLessons = enrollment ? enrollment.lessonsCompleted : 0;
    const coursePda = deriveCoursePda(course.slug);

    snapshots.push({
      course: applyProgress(clone, completedLessons),
      enrolledOnChain: Boolean(enrollment),
      completedLessons,
      enrollmentPda: deriveEnrollmentPda(coursePda, user).toBase58(),
    });
  }
  return snapshots;
}
