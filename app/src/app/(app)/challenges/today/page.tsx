import { getTranslations } from "next-intl/server";
import { getTodayChallenge } from "@/lib/daily-challenges";
import { ChallengeSolveClient } from "@/components/challenges/challenge-solve-client";

export default async function ChallengeTodayPage() {
  const t = await getTranslations("challenges");
  const challenge = getTodayChallenge();

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
    tags: t("tags"),
    testResults: t("testResults"),
    passed: t("passed"),
    failed: t("failed"),
    elapsedTime: t("elapsedTime"),
    challengeComplete: t("challengeComplete"),
    yourTime: t("yourTime"),
    backToChallenges: t("backToChallenges"),
    prerequisites: t("prerequisites"),
    description: t("description"),
    expectedBehavior: t("expectedBehavior"),
    examples: t("examples"),
    input: t("input"),
    output: t("output"),
    expected: t("expected"),
    actual: t("actual"),
    runningTests: t("runningTests"),
    compileError: t("compileError"),
    submitSolution: t("submitSolution"),
  };

  return <ChallengeSolveClient challenge={challenge} labels={labels} />;
}
