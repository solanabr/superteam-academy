import { getTranslations } from "next-intl/server";
import { getAllCourses } from "@/lib/data-service";
import { OnboardingQuiz } from "@/components/onboarding";

export const revalidate = 3600;

export default async function OnboardingPage() {
  const [courses, t] = await Promise.all([
    getAllCourses(),
    getTranslations("onboarding"),
  ]);

  return (
    <div className="min-h-[80vh]">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center sm:px-6">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Quiz */}
      <OnboardingQuiz courses={courses} />
    </div>
  );
}
