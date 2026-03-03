import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Crown02Icon,
  Medal01Icon,
  Award01Icon,
} from "@hugeicons/core-free-icons";
import { onChainLeaderboardService, leaderboardService } from "@/lib/services";
import { getTranslations } from "next-intl/server";

function truncateWallet(wallet: string) {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function rankIcon(rank: number) {
  switch (rank) {
    case 1:
      return Crown02Icon;
    case 2:
      return Medal01Icon;
    case 3:
      return Award01Icon;
    default:
      return null;
  }
}

function rankColor(rank: number) {
  switch (rank) {
    case 1:
      return "text-rank-gold";
    case 2:
      return "text-rank-silver";
    case 3:
      return "text-rank-bronze";
    default:
      return "text-muted-foreground";
  }
}

export default async function LeaderboardPage() {
  const entries = await onChainLeaderboardService.getLeaderboard(20);
  const t = await getTranslations();

  return (
    <div className="py-4">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("leaderboard.heading")}
        </h1>
        <p className="mt-2 max-w-lg text-muted-foreground">
          {t("leaderboard.description")}
        </p>
      </div>

      {/* Top 3 podium */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {entries.slice(0, 3).map((entry, i) => {
          const icon = rankIcon(entry.rank);
          return (
            <Card
              key={entry.wallet}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  {icon && (
                    <HugeiconsIcon
                      icon={icon}
                      size={18}
                      strokeWidth={2}
                      className={rankColor(entry.rank)}
                      color="currentColor"
                    />
                  )}
                  <CardTitle className="text-base">
                    #{entry.rank}
                  </CardTitle>
                </div>
                <CardDescription>
                  {entry.username ?? truncateWallet(entry.wallet)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    {entry.xp.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">XP</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary">{t("common.level", { level: entry.level })}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {t("common.credentials", { count: entry.credentialCount })}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full table */}
      <div className="overflow-hidden rounded-xl border border-border">
        {/* Table header */}
        <div className="grid grid-cols-[3rem_1fr_6rem_5rem_5rem] gap-4 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground sm:grid-cols-[3rem_1fr_8rem_5rem_6rem]">
          <span>{t("leaderboard.rank")}</span>
          <span>{t("leaderboard.learner")}</span>
          <span className="text-right">{t("leaderboard.xp")}</span>
          <span className="text-right">{t("courses.levelLabel")}</span>
          <span className="hidden text-right sm:block">{t("common.credentials", { count: 2 })}</span>
        </div>

        {/* Table rows */}
        {entries.map((entry, i) => (
          <div
            key={entry.wallet}
            className="animate-fade-in grid grid-cols-[3rem_1fr_6rem_5rem_5rem] items-center gap-4 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-muted/30 sm:grid-cols-[3rem_1fr_8rem_5rem_6rem]"
            style={{ animationDelay: `${(i + 3) * 40}ms` }}
          >
            {/* Rank */}
            <span className={`font-medium ${rankColor(entry.rank)}`}>
              {entry.rank <= 3 ? (
                <span className="flex items-center gap-1">
                  {rankIcon(entry.rank) && (
                    <HugeiconsIcon
                      icon={rankIcon(entry.rank)!}
                      size={14}
                      strokeWidth={2}
                      color="currentColor"
                    />
                  )}
                </span>
              ) : (
                entry.rank
              )}
            </span>

            {/* Learner */}
            <div className="min-w-0">
              <span className="block truncate font-medium text-foreground">
                {entry.username ?? truncateWallet(entry.wallet)}
              </span>
              {entry.username && (
                <span className="block truncate text-xs text-muted-foreground">
                  {truncateWallet(entry.wallet)}
                </span>
              )}
            </div>

            {/* XP */}
            <span className="text-right font-medium text-foreground">
              {entry.xp.toLocaleString()}
            </span>

            {/* Level */}
            <span className="text-right text-muted-foreground">
              {entry.level}
            </span>

            {/* Credentials */}
            <span className="hidden text-right text-muted-foreground sm:block">
              {entry.credentialCount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
