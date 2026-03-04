// Service interfaces
export type {
  LearningProgressService,
  GamificationService,
  CredentialService,
  CourseService,
  UserService,
  AnalyticsService,
} from "./interfaces";

// Stub implementations (swap for on-chain when ready)
export { learningProgressService } from "./stub/learning-progress";
export { gamificationService } from "./stub/gamification";
export { credentialService } from "./stub/credentials";
export { courseService } from "./stub/courses";
