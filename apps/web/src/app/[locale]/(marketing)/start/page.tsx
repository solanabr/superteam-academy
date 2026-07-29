import type { Metadata } from "next";
import { getAllQuests } from "@/lib/content/queries";
import { dailyGoalOptionsFromQuests } from "@/lib/onboarding/intake";
import { StartIntakeClient } from "./start-client";
import { resolveSegmentRoutes } from "./routes";

export const metadata: Metadata = {
  title: "Get started — Superteam Academy",
  description:
    "Answer a few taps and we'll point you at the right first lesson on Superteam Academy.",
};

// Content bundle + entry-course resolution are build-time constants; ISR keeps
// the resolved routes fresh if the bundle changes without a per-request cost.
export const revalidate = 300;

export default async function StartPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;

  const { locale } = params;

  const [routes, questData] = await Promise.all([
    resolveSegmentRoutes(locale),
    getAllQuests(),
  ]);
  const dailyGoalOptions = dailyGoalOptionsFromQuests(questData.quests);

  return (
    <StartIntakeClient
      routes={routes}
      dailyGoalOptions={dailyGoalOptions}
      browseAllHref={`/${locale}/courses`}
    />
  );
}
