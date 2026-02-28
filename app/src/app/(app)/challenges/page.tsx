import { getTranslations } from "next-intl/server";
import { Zap } from "lucide-react";
import { getTodayChallenge, getTodayKey } from "@/lib/daily-challenges";
import { DailyChallengeView } from "@/components/challenges/daily-challenge-view";
import { PastChallenges } from "@/components/challenges/past-challenges";

export const revalidate = 60; // Revalidate every minute so the day resets correctly

export default async function ChallengesPage() {
  const t = await getTranslations("challenges");
  const challenge = getTodayChallenge();
  const dateKey = getTodayKey();

  const labels = {
    dailyChallenge: t("dailyChallenge"),
    xpReward: t("xpReward"),
    runTests: t("runTests"),
    allPassed: t("allPassed"),
    markComplete: t("markComplete"),
    alreadyCompleted: t("alreadyCompleted"),
    showSolution: t("showSolution"),
    hideSolution: t("hideSolution"),
    hintLabel: t("hintLabel"),
    nextHint: t("nextHint"),
    nextReset: t("nextReset"),
    tags: t("tags"),
    testResults: t("testResults"),
    passed: t("passed"),
    failed: t("failed"),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Today's challenge */}
      <div className="mb-10">
        <DailyChallengeView
          challenge={challenge}
          dateKey={dateKey}
          labels={labels}
        />
      </div>

      {/* Past challenges */}
      <PastChallenges
        headingLabel={t("pastChallenges")}
        completedLabel={t("completed")}
        xpLabel={t("xpReward")}
        lockedLabel={t("locked")}
      />
    </div>
  );
}
