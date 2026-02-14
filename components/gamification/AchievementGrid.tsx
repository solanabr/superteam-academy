import type { Achievement } from "@/lib/gamification/achievements";

type AchievementGridProps = {
  items: Achievement[];
  allAchievements: Achievement[];
};

const categoryColors: Record<string, string> = {
  progress: "text-blue-400",
  streak: "text-orange-400",
  skills: "text-solana-green",
  community: "text-pink-400",
  special: "text-solana-purple",
};

export function AchievementGrid({ items, allAchievements }: AchievementGridProps): JSX.Element {
  const unlockedIds = new Set(items.map((a) => a.id));

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {allAchievements.map((achievement) => {
        const unlocked = unlockedIds.has(achievement.id);
        return (
          <article
            key={achievement.id}
            className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
              unlocked
                ? "border-solana-green/30 bg-solana-green/5"
                : "border-border opacity-50"
            }`}
          >
            <span className={`text-xl ${unlocked ? "" : "grayscale"}`}>{achievement.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className={`truncate text-sm font-medium ${unlocked ? "" : "text-muted-foreground"}`}>
                  {achievement.title}
                </p>
                {unlocked && (
                  <span className="shrink-0 text-xs text-solana-green">{"\u2713"}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{achievement.description}</p>
              <span className={`mt-1 inline-block text-[10px] font-medium uppercase tracking-wider ${categoryColors[achievement.category] ?? "text-muted-foreground"}`}>
                {achievement.category}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
