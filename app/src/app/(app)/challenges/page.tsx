import { getTranslations } from "next-intl/server";
import { Zap } from "lucide-react";
import { getTodayChallenge } from "@/lib/daily-challenges";
import { ChallengeInfoBanner } from "@/components/challenges/challenge-info-banner";
import { ChallengeOverviewCard } from "@/components/challenges/challenge-overview-card";
import { PastChallenges } from "@/components/challenges/past-challenges";
import { SpeedLeaderboard } from "@/components/challenges/speed-leaderboard";

export const revalidate = 60;

export default async function ChallengesPage() {
  const t = await getTranslations("challenges");
  const challenge = getTodayChallenge();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="mb-6">
        <ChallengeInfoBanner
          title={t("howItWorks")}
          message={t("infoBanner")}
          dismissLabel={t("dismissInfo")}
        />
      </div>

      {/* Today's challenge overview */}
      <div className="mb-10">
        <ChallengeOverviewCard
          challenge={challenge}
          labels={{
            dailyChallenge: t("dailyChallenge"),
            xpReward: t("xpReward"),
            nextReset: t("nextReset"),
            tags: t("tags"),
            startChallenge: t("startChallenge"),
            continueChallenge: t("continueChallenge"),
            completedToday: t("completedToday"),
          }}
        />
      </div>

      {/* Past challenges */}
      <div className="mb-6">
        <PastChallenges
          headingLabel={t("pastChallenges")}
          completedLabel={t("completed")}
          xpLabel={t("xpReward")}
          lockedLabel={t("locked")}
          showMoreLabel={t("showMore")}
          remainingLabel={t("remaining")}
          browseAllLabel={t("browseAll")}
        />
      </div>

      {/* Speed leaderboard */}
      <SpeedLeaderboard
        labels={{
          speedLeaderboard: t("speedLeaderboard"),
          noCompletionsYet: t("noCompletionsYet"),
          rank: t("rank"),
          user: t("user"),
          timeToComplete: t("timeToComplete"),
          tests: t("tests"),
        }}
      />
    </div>
  );
}
