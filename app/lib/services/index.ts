// Service barrel — import from here, swap implementations later.

export type {
  XpSummary,
  StreakData,
  Credential,
  Course,
  Lesson,
  Enrollment,
  LeaderboardEntry,
  UserProfile,
  ActivityEntry,
  LearningProgressService,
  CourseService,
  LeaderboardService,
  UserService,
  CredentialService,
  EnrollmentAction,
  LessonAction,
} from "./types";

export {
  learningProgressService,
  courseService,
  leaderboardService,
  userService,
  credentialService,
  enrollmentAction,
  lessonAction,
} from "./stubs";

// Sanity-powered course service (falls back to stubs if not configured)
export { sanityCourseService } from "./sanity-course";

// On-chain services (use real Solana data when available)
export { onChainUserService, onChainLeaderboardService } from "./onchain";
