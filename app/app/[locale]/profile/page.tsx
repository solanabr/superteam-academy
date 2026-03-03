import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02Icon,
  Award01Icon,
  Blockchain01Icon,
  Fire02Icon,
  CheckmarkCircle02Icon,
  BookOpen01Icon,
  UserCircle02Icon,
} from "@hugeicons/core-free-icons";
import { userService, courseService } from "@/lib/services";
import { getTranslations, getLocale } from "next-intl/server";

function truncateWallet(wallet: string) {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export default async function ProfilePage() {
  const [profile, activity, courses] = await Promise.all([
    userService.getProfile(),
    userService.getActivity(),
    courseService.getCourses(),
  ]);

  const t = await getTranslations();
  const locale = await getLocale();
  const courseMap = new Map(courses.map((c) => [c.slug, c]));

  const completedCount = profile.enrollments.filter((e) => e.isCompleted).length;
  const activeCount = profile.enrollments.filter((e) => !e.isCompleted).length;

  return (
    <div className="py-4">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("profile.heading")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("profile.description")}
        </p>
      </div>

      {/* Profile header */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HugeiconsIcon icon={UserCircle02Icon} size={28} strokeWidth={1.5} color="currentColor" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {profile.username ?? truncateWallet(profile.wallet)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {truncateWallet(profile.wallet)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("profile.memberSince", { date: new Date(profile.joinedAt).toLocaleDateString() })}
            </p>
          </div>
        </div>
        {profile.username && (
          <Link href={`/${locale}/profile/${profile.username}`}>
            <Button variant="outline" size="sm">
              {t("profile.viewPublicProfile")}
              <HugeiconsIcon icon={ArrowRight02Icon} size={14} data-icon="inline-end" />
            </Button>
          </Link>
        )}
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="animate-fade-in">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Blockchain01Icon} size={18} strokeWidth={2} color="currentColor" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {profile.xp.total.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{t("profile.xpEarned")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: "60ms" }}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Fire02Icon} size={18} strokeWidth={2} color="currentColor" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {profile.streak.current}
                </p>
                <p className="text-xs text-muted-foreground">{t("dashboard.dayStreak")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: "120ms" }}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2} color="currentColor" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {completedCount}
                </p>
                <p className="text-xs text-muted-foreground">{t("profile.coursesCompleted")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: "180ms" }}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Award01Icon} size={18} strokeWidth={2} color="currentColor" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {profile.credentials.length}
                </p>
                <p className="text-xs text-muted-foreground">{t("common.credentials", { count: profile.credentials.length })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Credentials */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
            {t("common.credentials", { count: profile.credentials.length })}
          </h2>

          {profile.credentials.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.completeFirst")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {profile.credentials.map((cred, i) => (
                <Link key={cred.id} href={`/${locale}/certificates/${cred.id}`} className="group">
                  <Card
                    className="animate-fade-in transition-colors hover:bg-muted/30"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <HugeiconsIcon
                            icon={Award01Icon}
                            size={16}
                            strokeWidth={2}
                            className="text-primary"
                            color="currentColor"
                          />
                          <div>
                            <span className="text-sm font-medium text-foreground group-hover:text-primary">
                              {cred.track}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {new Date(cred.issuedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {t("dashboard.lvl", { level: cred.level })}
                          </Badge>
                          <HugeiconsIcon
                            icon={ArrowRight02Icon}
                            size={14}
                            color="currentColor"
                            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity sidebar */}
        <div>
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
            {t("profile.recentActivity")}
          </h2>

          {activity.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("profile.noActivity")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
              <CardContent className="pt-4">
                <div className="flex flex-col gap-3">
                  {activity.map((entry) => {
                    const icon =
                      entry.type === "credential_earned"
                        ? Award01Icon
                        : entry.type === "enrolled"
                          ? BookOpen01Icon
                          : CheckmarkCircle02Icon;

                    return (
                      <div key={entry.id} className="flex items-start gap-3">
                        <div className="mt-0.5 text-muted-foreground">
                          <HugeiconsIcon icon={icon} size={14} strokeWidth={2} color="currentColor" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground">
                            {entry.label}{" "}
                            <span className="font-medium">{entry.detail}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
