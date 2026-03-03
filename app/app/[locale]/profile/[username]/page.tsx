import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Award01Icon,
  Blockchain01Icon,
  Fire02Icon,
  CheckmarkCircle02Icon,
  UserCircle02Icon,
} from "@hugeicons/core-free-icons";
import { userService } from "@/lib/services";
import { getTranslations } from "next-intl/server";

function truncateWallet(wallet: string) {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await userService.getPublicProfile(username);

  if (!profile) notFound();

  const t = await getTranslations();
  const completedCount = profile.enrollments.filter((e) => e.isCompleted).length;

  return (
    <div className="py-4">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("profile.publicProfile")}
        </h1>
      </div>

      {/* Profile header */}
      <div className="mb-8 flex items-center gap-4">
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

      {/* Credentials */}
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
        {t("common.credentials", { count: profile.credentials.length })}
      </h2>

      {profile.credentials.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("dashboard.completeFirst")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.credentials.map((cred, i) => (
            <Card
              key={cred.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <HugeiconsIcon
                    icon={Award01Icon}
                    size={16}
                    strokeWidth={2}
                    className="text-primary"
                    color="currentColor"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {cred.track}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cred.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="mt-2 text-xs">
                  {t("dashboard.lvl", { level: cred.level })}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
