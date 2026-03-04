"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Achievement } from "@/types/achievement"
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

type Props = {
  connected: boolean;
  xp: number;
  isLoading: boolean;
  error: Error | null;
  streak: number | null;
  achievements: Achievement[];
};

export default function DashboardContent({
  connected,
  xp,
  isLoading,
  error,
  streak,
  achievements,
}: Props) {
  const { t } = useLanguage();
  const router = useRouter();

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-lg font-semibold">
          {t("dashboard.connectWallet")}
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="container mx-auto px-6 py-6 flex-1">

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>

          <p className="text-muted-foreground text-sm max-w-lg min-h-[48px]">
            {t?.("dashboard.welcome") ??
              "Track your learning progress and achievements"}
          </p>
        </header>

        {/* Reputation */}
        <section className="grid gap-5 md:grid-cols-3 mb-8 min-h-[180px]">

          {/* XP */}
          <Card className="border-primary/30 bg-primary/5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("dashboard.xpTitle")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("dashboard.xpDescription")}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0 pb-5">
              {isLoading && (
                <p className="text-muted-foreground text-sm">
                  {t("common.loading")}
                </p>
              )}

              {error && (
                <p className="text-red-500 text-sm">
                  {t("dashboard.xpError")}
                </p>
              )}

              {!isLoading && !error && (
                <>
                  <p className="text-4xl font-bold tracking-tight text-primary">
                    {xp}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {t("common.xp")} • On-Chain Reputation
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Streak */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("dashboard.streakTitle")}
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0 pb-5">
              <p className="text-3xl font-semibold tracking-tight">
                {streak ?? "-"}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                {streak === 1 ? t("dashboard.day") : t("dashboard.days")}
              </p>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("dashboard.achievementsTitle")}
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0 pb-5 space-y-2">
              {achievements.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.noAchievements")}
                </p>
              )}

              {achievements.map((a) => (
                <span
                  key={a.type}
                  className="inline-block rounded-full border px-3 py-1 text-[10px]"
                >
                  {a.type.replaceAll("_", " ")}
                </span>
              ))}
            </CardContent>
          </Card>

        </section>

        {/* Continue Learning */}
        <section>
          <h2 className="text-base font-semibold tracking-tight mb-3">
            {t("dashboard.continueLearning.title")}
          </h2>

          <Card className="border shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("dashboard.continueLearning.inProgress")}
                </p>

                <p className="text-base font-semibold mt-1">
                  {t("dashboard.continueLearning.courseName")}
                </p>
              </div>

              <Button size="sm" onClick={() => router.push("/courses")}>
                {t("dashboard.continueLearning.resume")}
              </Button>
            </CardContent>
          </Card>
        </section>

      </main>

      <footer className="border-t">
        <div className="container mx-auto px-6 py-5 text-center text-muted-foreground text-sm">
          <p>{t("dashboard.footerLine1")}</p>
          <p className="mt-1">{t("dashboard.footerLine2")}</p>
        </div>
      </footer>
    </div>
  );
}