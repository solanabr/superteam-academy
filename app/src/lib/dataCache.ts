type CACHE_TAG =
  | "products"
  | "users"
  | "courses"
  | "userCourseAccess"
  | "courseSections"
  | "lessons"
  | "purchases"
  | "userLessonComplete"
  | "assignments"
  | "assignmentSubmissions"

export function getGlobalTag(tag: CACHE_TAG) {
  return `global:${tag}` as const
}

export function getIdTag(tag: CACHE_TAG, id: string) {
  return `id:${id}-${tag}` as const
}

export function getUserTag(tag: CACHE_TAG, userId: string) {
  return `user:${userId}-${tag}` as const
}

export function getCourseTag(tag: CACHE_TAG, courseId: string) {
  return `course:${courseId}-${tag}` as const
}
