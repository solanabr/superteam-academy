import dynamic from "next/dynamic";

export { StreakCalendar } from "./streak-calendar";
export { AchievementCard } from "./achievement-card";
export { LevelRing } from "./level-ring";
export { XPNotification } from "./xp-notification";
export { GamificationStats } from "./gamification-stats";
export const SkillRadar = dynamic(
  () => import("./skill-radar").then((m) => m.SkillRadar),
  { ssr: false },
);
export { EarlyAdopterMint } from "./early-adopter-mint";
export { AchievementMintList } from "./achievement-mint-list";
