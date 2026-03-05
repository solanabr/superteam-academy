"use client";

import { XpStatCard } from "@/components/xp-stat-card";
import { CourseProgress } from "@/components/course-progress";
import { StreakCard } from "@/components/streak-card";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { DailyQuests } from "@/components/daily-quests";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const { enrollments, loading } = useUser();
  const t = useTranslations("Dashboard");

  return (
    <div className="flex-1 space-y-8 bg-background p-8 pt-6">
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
        <h2 className="bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <XpStatCard />

      <div className="grid gap-6 lg:grid-cols-7">
        <section className="space-y-4 lg:col-span-4">
          <h3 className="text-xl font-semibold">{t("myLearning")}</h3>

          {loading ? (
            <div className="flex justify-center rounded-xl border border-border/60 bg-card/50 p-8">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : enrollments.length > 0 ? (
            enrollments.map((enrollment: any) => <CourseProgress key={enrollment.courseId} courseId={enrollment.courseId} enrollmentData={enrollment} />)
          ) : (
            <div className="rounded-xl border border-border/60 bg-card/50 p-8 text-center backdrop-blur-md">
              <p className="mb-4 text-muted-foreground">{t("noCourses")}</p>
              <Link href="/courses">
                <Button>
                  {t("explore")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </section>

        <section className="space-y-4 lg:col-span-3">
          <h3 className="text-xl font-semibold">{t("activity")}</h3>
          <DailyQuests />
          <StreakCard />
        </section>
      </div>
    </div>
  );
}
