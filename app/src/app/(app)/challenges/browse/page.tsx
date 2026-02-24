import { getTranslations } from "next-intl/server";
import { CHALLENGE_BANK } from "@/lib/daily-challenges";
import { ChallengeBrowseClient } from "@/components/challenges/challenge-browse-client";

export default async function ChallengeBrowsePage() {
  const t = await getTranslations("challenges");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ChallengeBrowseClient
        challenges={CHALLENGE_BANK}
        labels={{
          browseTitle: t("browseTitle"),
          browseSubtitle: t("browseSubtitle"),
          searchChallenges: t("searchChallenges"),
          filters: t("filters"),
          nChallenges: t("nChallenges", { count: CHALLENGE_BANK.length }),
          category: t("category"),
          difficulty: t("difficulty"),
          language: t("language"),
          sortBy: t("sortBy"),
          sortDefault: t("sortDefault"),
          sortXpHigh: t("sortXpHigh"),
          sortDifficulty: t("sortDifficulty"),
          xpReward: t("xpReward"),
          estTime: t("estTime", { min: "0" }),
          backToChallenges: t("backToChallenges"),
        }}
      />
    </div>
  );
}
