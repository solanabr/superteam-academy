// `Course` re-exported here carries the optional `author?: string` and
// `authoringStatus?: "draft" | "pending_review" | "approved"` fields added for
// teacher-authored courses (issue #263); `AuthoringStatus` is the status union.
export type {
  Course,
  AuthoringStatus,
  Module,
  Lesson,
  Instructor,
  LearningPath,
  TestCase,
} from "@superteam-lms/types";
