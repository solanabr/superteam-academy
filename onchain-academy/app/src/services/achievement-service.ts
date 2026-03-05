export type PublicAchievement = {
  id: "first-blood" | "rustacean" | "anchor-master";
  unlocked: boolean;
};

type PublicAchievementInput = {
  level: number;
  xp: number;
  credentialCount: number;
};

// Stubbed service contract for public achievements until on-chain receipts
// are exposed via dedicated read endpoints.
export function getPublicAchievements(
  input: PublicAchievementInput,
): PublicAchievement[] {
  return [
    {
      id: "first-blood",
      unlocked: input.xp >= 100 || input.level >= 1,
    },
    {
      id: "rustacean",
      unlocked: input.level >= 3 || input.credentialCount >= 1,
    },
    {
      id: "anchor-master",
      unlocked: input.level >= 5 || input.credentialCount >= 2,
    },
  ];
}
