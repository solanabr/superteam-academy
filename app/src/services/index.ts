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
export type { CommentService } from "./comment-service";
export type { ReviewService } from "./review-service";

// Course service — Sanity CMS (all courses live there now)
import { sanityCourseService } from "./implementations/sanity-course-service";

export const courseService = sanityCourseService;

export { sanityCourseService } from "./implementations/sanity-course-service";
export { supabaseEnrollmentService } from "./implementations/supabase-enrollment-service";
export { supabaseProgressService } from "./implementations/supabase-progress-service";
export { supabaseXPService } from "./implementations/supabase-xp-service";
export { supabaseLeaderboardService } from "./implementations/supabase-leaderboard-service";
export { supabaseStreakService } from "./implementations/supabase-streak-service";
export { supabaseAchievementService } from "./implementations/supabase-achievement-service";
export { supabaseProfileService } from "./implementations/supabase-profile-service";
export { supabaseActivityService } from "./implementations/supabase-activity-service";
export { supabaseCommentService } from "./implementations/supabase-comment-service";
export { supabaseReviewService } from "./implementations/supabase-review-service";
export { heliusCredentialService } from "./implementations/helius-credential-service";
