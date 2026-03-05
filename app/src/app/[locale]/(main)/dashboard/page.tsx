import { Suspense } from "react";
import { RemoteImage } from "@/components/remote-image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllCourses, getAllChallenges, localize } from "@/services/cms";
import { DashboardClient } from "./dashboard-client";
import { DashboardCertificates } from "./dashboard-certificates";
import { DashboardCourses } from "./dashboard-courses";
import { DashboardProfile } from "./dashboard-profile";
import { DashboardInstructorPanel } from "./dashboard-instructor-panel";
import { DashboardStats } from "./dashboard-stats";
import { SuggestedCourses } from "./suggested-courses";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();
  const courses = await getAllCourses(locale);
  const challenges = await getAllChallenges(locale);

  return (
    <div className="container py-8">
      <DashboardProfile />
      <DashboardInstructorPanel courses={courses} />

      <DashboardStats />

      <DashboardCourses courses={courses} />

      <SuggestedCourses courses={courses} />

      <section className="mb-8">
        <h2 className="mb-4 text-center text-xl font-semibold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
          {t("myChallenges")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.slice(0, 6).map((challenge) => (
            <Link
              key={challenge.id}
              href={`/challenges`}
              className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Card className="h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
                <div className="relative h-36 w-full shrink-0 overflow-hidden bg-muted">
                  <RemoteImage src={challenge.image} alt={challenge.title} />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{challenge.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {challenge.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {challenge.track}
                    </span>
                    <span className="text-sm font-medium text-sky-600">
                      {challenge.reward}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Suspense fallback={null}>
        <DashboardCertificates />
      </Suspense>
      <Suspense fallback={null}>
        <DashboardClient />
      </Suspense>
    </div>
  );
}
