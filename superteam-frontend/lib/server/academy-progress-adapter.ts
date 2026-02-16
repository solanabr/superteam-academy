import "server-only"

import { PublicKey } from "@solana/web3.js"
import { courses, type Course } from "@/lib/mock-data"
import {
  deriveCoursePda,
  deriveEnrollmentPda,
  ensureCourseOnChain,
  fetchEnrollment,
} from "@/lib/server/academy-program"
import { getCatalogCourseMeta } from "@/lib/server/academy-course-catalog"

export type CourseProgressSnapshot = {
  course: Course
  enrolledOnChain: boolean
  enrollmentPda: string
  completedLessons: number
}

function cloneCourse(slug: string): Course | null {
  const raw = courses.find((item) => item.slug === slug)
  if (!raw) return null
  return JSON.parse(JSON.stringify(raw)) as Course
}

function applyProgress(course: Course, completedLessons: number): Course {
  const total = course.modules.reduce((acc, module) => acc + module.lessons.length, 0)
  let remaining = Math.max(0, completedLessons)

  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      lesson.completed = remaining > 0
      if (remaining > 0) remaining -= 1
    }
  }

  const done = Math.min(completedLessons, total)
  course.progress = total > 0 ? Math.round((done / total) * 100) : 0
  return course
}

export async function getCourseProgressSnapshot(
  walletAddress: string,
  slug: string,
): Promise<CourseProgressSnapshot | null> {
  const meta = getCatalogCourseMeta(slug)
  if (!meta) return null

  await ensureCourseOnChain(meta.slug, meta.lessonsCount, meta.trackId)

  const user = new PublicKey(walletAddress)
  const enrollment = await fetchEnrollment(user, meta.slug)
  const completedLessons = enrollment ? Number(enrollment.lessonsCompleted) : 0
  const course = cloneCourse(slug)
  if (!course) return null

  const coursePda = deriveCoursePda(meta.slug)
  const enrollmentPda = deriveEnrollmentPda(coursePda, user)

  return {
    course: applyProgress(course, completedLessons),
    enrolledOnChain: Boolean(enrollment),
    completedLessons,
    enrollmentPda: enrollmentPda.toBase58(),
  }
}

export async function getAllCourseProgressSnapshots(
  walletAddress: string,
): Promise<CourseProgressSnapshot[]> {
  const results: CourseProgressSnapshot[] = []
  for (const course of courses) {
    const snapshot = await getCourseProgressSnapshot(walletAddress, course.slug)
    if (snapshot) results.push(snapshot)
  }
  return results
}
