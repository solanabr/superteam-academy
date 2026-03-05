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
    <div className="flex-1 space-y-6 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.14),transparent_45%)] p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="bg-gradient-to-r from-purple-200 via-fuchsia-300 to-cyan-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent">{t("title")}</h2>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 space-y-4">
          <h3 className="text-xl font-semibold">{t("myLearning")}</h3>

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : enrollments.length > 0 ? (
            enrollments.map((enrollment: any) => (
              <CourseProgress key={enrollment.courseId} courseId={enrollment.courseId} enrollmentData={enrollment} />
            ))
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/30 p-8 text-center backdrop-blur-md">
              <p className="mb-4 text-muted-foreground">{t("noCourses")}</p>
              <Link href="/courses">
                <Button className="border border-cyan-300/30 bg-gradient-to-r from-cyan-700 to-blue-700">
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

        <div className="col-span-3 space-y-4">
          <h3 className="text-xl font-semibold">{t("activity")}</h3>
          <DailyQuests />
          <StreakCard />
        </div>
      </div>
    </div>
  );
}
