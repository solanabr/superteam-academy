export { ProfileHeader } from "./profile-header";
export { SkillChart } from "./skill-chart";
export { StreakSection } from "./streak-section";
export type { SkillDataPoint } from "./skill-chart";
export { AchievementGrid } from "./achievement-grid";
export { CredentialDisplay } from "./credential-display";
export type { CredentialItem } from "./credential-display";
export { CourseHistory } from "./course-history";
export type { CompletedCourseItem } from "./course-history";

// Public profile
export { default as PublicProfileClient } from "./public-profile-client";
export type { PublicProfileClientProps } from "./public-profile-client";

// Skeletons
export {
  SkillChartSkeleton,
  AchievementGridSkeleton,
  CredentialDisplaySkeleton,
  CourseHistorySkeleton,
} from "./skeletons";
