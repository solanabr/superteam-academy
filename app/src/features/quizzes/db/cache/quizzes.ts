import { getGlobalTag, getIdTag, getCourseTag, getUserTag } from "@/lib/dataCache"

export function getAssignmentGlobalTag() {
  return getGlobalTag("assignments")
}

export function getAssignmentIdTag(id: string) {
  return getIdTag("assignments", id)
}

export function getAssignmentCourseTag(courseId: string) {
  return getCourseTag("assignments", courseId)
}

export function getSubmissionGlobalTag() {
  return getGlobalTag("assignmentSubmissions")
}

export function getSubmissionIdTag(id: string) {
  return getIdTag("assignmentSubmissions", id)
}

export function getSubmissionUserTag(userId: string) {
  return getUserTag("assignmentSubmissions", userId)
}

export function getSubmissionAssignmentTag(assignmentId: string) {
  return getIdTag("assignmentSubmissions", `assignment-${assignmentId}`)
}
