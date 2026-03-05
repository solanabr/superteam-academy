import { getTranslations, getLocale } from "next-intl/server";
import { getAllCourses } from "@/services/cms";
import { LeaderboardClient } from "./leaderboard-client";

export default async function LeaderboardPage() {
  const t = await getTranslations("leaderboard");
  const locale = await getLocale();
  const courses = await getAllCourses(locale);
  return (
    <div className="container py-8">
      <h1 className="mb-6 text-center text-3xl font-bold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
        {t("title")}
      </h1>
      <LeaderboardClient courses={courses} />
    </div>
  );
}
