export type { CourseService } from "./course-service";
export type { EnrollmentService } from "./enrollment-service";
export type { ProgressService } from "./progress-service";
export type { XPService } from "./xp-service";
export type { CredentialService } from "./credential-service";
export type { LeaderboardService } from "./leaderboard-service";
export type { StreakService } from "./streak-service";
export type { AchievementService } from "./achievement-service";
export type { ProfileService } from "./profile-service";
export type { ActivityService } from "./activity-service";

// Smart course service — use Sanity when configured, mock fallback
import { sanityCourseService } from "./implementations/sanity-course-service";
import { mockCourseService } from "./implementations/mock-course-service";

const hasSanity = !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const courseService = hasSanity ? sanityCourseService : mockCourseService;

export { sanityCourseService } from "./implementations/sanity-course-service";
export { mockCourseService } from "./implementations/mock-course-service";
export { supabaseEnrollmentService } from "./implementations/supabase-enrollment-service";
export { supabaseProgressService } from "./implementations/supabase-progress-service";
export { mockXPService } from "./implementations/mock-xp-service";
export { mockCredentialService } from "./implementations/mock-credential-service";
export { mockLeaderboardService } from "./implementations/mock-leaderboard-service";
export { supabaseStreakService } from "./implementations/supabase-streak-service";
export { mockAchievementService } from "./implementations/mock-achievement-service";
export { supabaseProfileService } from "./implementations/supabase-profile-service";
export { supabaseActivityService } from "./implementations/supabase-activity-service";
