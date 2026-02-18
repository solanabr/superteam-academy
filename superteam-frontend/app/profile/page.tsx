import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Award,
  CheckCircle2,
  ExternalLink,
  Flame,
  Trophy,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import { ShareButton } from "@/components/profile/ShareButton";
import { SkillsRadar } from "@/components/profile/SkillsRadar";
import { VisibilityToggle } from "@/components/profile/VisibilityToggle";
import {
  HeaderSkeleton,
  ActivitySkeleton,
  CoursesSkeleton,
  SkillsSkeleton,
  BadgesSkeleton,
  CredentialsSkeleton,
} from "@/components/profile/profile-skeletons";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import type { AuthenticatedUser } from "@/lib/server/auth-adapter";
import {
  getProfileIdentity,
  getProfileCourses,
  getProfileActivity,
} from "@/lib/server/profile-data";
import type { Course } from "@/lib/course-catalog";
import type { IdentitySnapshot } from "@/lib/identity/types";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "View your SuperTeam Academy profile, credentials, and learning activity.",
};

// ---------------------------------------------------------------------------
// Page shell — renders immediately, sections stream in via Suspense
// ---------------------------------------------------------------------------

export default async function Page() {
  const user = await requireAuthenticatedUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-10">
      <Suspense fallback={<HeaderSkeleton />}>
        <ProfileHeaderSection user={user} />
      </Suspense>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Suspense fallback={<ActivitySkeleton />}>
            <ActivitySection wallet={user.walletAddress} />
          </Suspense>
          <Suspense fallback={<CoursesSkeleton />}>
            <CompletedCoursesSection wallet={user.walletAddress} />
          </Suspense>
        </div>
        <div className="space-y-6">
          <Suspense fallback={<SkillsSkeleton />}>
            <SkillsSection wallet={user.walletAddress} />
          </Suspense>
          <Suspense fallback={<BadgesSkeleton />}>
            <AchievementsSection user={user} />
          </Suspense>
          <Suspense fallback={<CredentialsSkeleton />}>
            <CredentialsSection user={user} />
          </Suspense>
          <VisibilitySection />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Async server components — each fetches its own data independently
// ---------------------------------------------------------------------------

async function ProfileHeaderSection({ user }: { user: AuthenticatedUser }) {
  const identity = await getProfileIdentity(user);
  const t = await getTranslations("profile");
  const p = identity.profile;
  const avatarInitials = p.walletAddress.slice(0, 2).toUpperCase();
  const xpProgress = Math.min(100, Math.round((p.xp / p.xpToNext) * 100));

  return (
    <Card className="overflow-hidden border-primary/20 bg-card">
      <div className="h-24 bg-gradient-to-r from-primary/25 via-primary/10 to-transparent" />
      <CardContent className="-mt-10 pb-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar className="h-20 w-20 border-4 border-background bg-primary/20">
              <AvatarFallback className="text-xl font-semibold text-primary">
                {avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{p.name}</h1>
                <Badge
                  variant="outline"
                  className="border-border text-muted-foreground"
                >
                  @{p.username}
                </Badge>
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                  {t("rankLabel", { rank: p.rank })}
                </Badge>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {p.bio}
              </p>
              <SocialLinks links={p.socialLinks} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ShareButton walletAddress={p.walletAddress} />
            <Link href="/settings">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                {t("editProfile")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatPill
            icon={Trophy}
            label={t("globalRank")}
            value={`#${p.rank}`}
          />
          <StatPill
            icon={Zap}
            label={t("totalXp")}
            value={p.xp.toLocaleString()}
          />
          <StatPill
            icon={Flame}
            label={t("currentStreak")}
            value={`${p.streak} ${t("days")}`}
          />
          <StatPill
            icon={CheckCircle2}
            label={t("coursesCompleted")}
            value={`${p.totalCompleted}`}
          />
        </div>

        <div className="mt-4 rounded-lg border border-border bg-background/40 p-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {t("levelProgress", { level: p.level })}
            </span>
            <span className="font-medium text-foreground">
              {p.xp.toLocaleString()} / {p.xpToNext.toLocaleString()} XP
            </span>
          </div>
          <Progress
            value={xpProgress}
            className="h-2 bg-secondary [&>div]:bg-primary"
          />
        </div>
      </CardContent>
    </Card>
  );
}

async function ActivitySection({ wallet }: { wallet: string }) {
  const { days } = await getProfileActivity(wallet);
  const t = await getTranslations("profile");

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">
        {t("activity")}
      </h2>
      <ActivityHeatmap activityDays={days} />
    </section>
  );
}

async function CompletedCoursesSection({ wallet }: { wallet: string }) {
  const snapshots = await getProfileCourses(wallet);
  const t = await getTranslations("profile");
  const tCatalog = await getTranslations("catalog");
  const completedCourses = snapshots
    .map((s) => s.course)
    .filter((c) => c.progress >= 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t("completedCourses")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {completedCourses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("noCompletedCourses")}
          </p>
        ) : (
          completedCourses.map((course) => (
            <CourseRow
              key={course.slug}
              course={course}
              progressLabel={tCatalog("progress")}
            />
          ))
        )}
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          {t("browseAllCourses")} <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

const TAG_TO_SKILL: Record<string, string> = {
  Rust: "rust",
  Anchor: "anchor",
  DeFi: "defi",
  Security: "security",
  Auditing: "security",
  NFT: "frontend",
  Metaplex: "frontend",
  Frontend: "frontend",
  Testing: "testing",
};

function computeSkillRows(allCourses: Course[]) {
  const totals: Record<string, number[]> = {
    rust: [],
    anchor: [],
    frontend: [],
    security: [],
    defi: [],
    testing: [],
  };
  for (const course of allCourses) {
    const matched = new Set<string>();
    for (const tag of course.tags) {
      const skill = TAG_TO_SKILL[tag];
      if (skill) matched.add(skill);
    }
    for (const skill of matched) {
      totals[skill]?.push(course.progress);
    }
  }
  const labels: Record<string, string> = {
    rust: "Rust",
    anchor: "Anchor",
    frontend: "Frontend",
    security: "Security",
    defi: "DeFi",
    testing: "Testing",
  };
  return Object.entries(totals).map(([key, values]) => {
    const avg =
      values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 0;
    return { label: labels[key] ?? key, value: avg };
  });
}

async function SkillsSection({ wallet }: { wallet: string }) {
  const snapshots = await getProfileCourses(wallet);
  const t = await getTranslations("profile");
  const allCourses = snapshots.map((s) => s.course);
  const skillRows = computeSkillRows(allCourses);
  const chartData = skillRows.map((r) => ({ skill: r.label, value: r.value }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t("skills")}</CardTitle>
      </CardHeader>
      <CardContent>
        <SkillsRadar data={chartData} />
        <div className="mt-3 space-y-2">
          {skillRows.map((skill) => (
            <div key={skill.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{skill.label}</span>
                <span className="font-medium text-foreground">
                  {skill.value}%
                </span>
              </div>
              <Progress
                value={skill.value}
                className="h-1.5 bg-secondary [&>div]:bg-primary"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function AchievementsSection({ user }: { user: AuthenticatedUser }) {
  const identity = await getProfileIdentity(user);
  const t = await getTranslations("profile");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t("achievementsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {identity.profile.badges.map((badge, i) => (
          <Badge
            key={`${i}-${badge.name}`}
            variant={badge.earned ? "default" : "outline"}
            className={
              badge.earned
                ? "bg-primary/15 text-primary hover:bg-primary/15"
                : ""
            }
          >
            <Award className="mr-1 h-3 w-3" />
            {badge.name}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}

async function CredentialsSection({ user }: { user: AuthenticatedUser }) {
  const identity = await getProfileIdentity(user);
  const t = await getTranslations("profile");
  const creds = identity.profile.certificates;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t("onChainCredentials")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {creds.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noCredentials")}</p>
        ) : (
          creds.map((cred) => (
            <div
              key={cred.id}
              className="rounded-lg border border-border bg-background/40 p-3"
            >
              <p className="font-medium text-foreground">{cred.course}</p>
              <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                <p>
                  {t("mint")} {shortAddress(cred.mintAddress)}
                </p>
                <p>
                  {t("issued")} {cred.date}
                </p>
              </div>
              <Link href={`/certificates/${cred.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 px-2 text-primary"
                >
                  {t("verify")}
                  <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

async function VisibilitySection() {
  const t = await getTranslations("profile");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t("profileVisibility")}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          {t("publicProfile")}
        </p>
        <VisibilityToggle isOwnProfile={true} />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared presentational helpers
// ---------------------------------------------------------------------------

function SocialLinks({
  links,
}: {
  links?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
}) {
  if (!links) return null;
  const items = [
    {
      href: links.twitter ? `https://x.com/${links.twitter}` : null,
      label: "Twitter",
    },
    {
      href: links.github ? `https://github.com/${links.github}` : null,
      label: "GitHub",
    },
    {
      href: links.linkedin ? `https://linkedin.com/in/${links.linkedin}` : null,
      label: "LinkedIn",
    },
    {
      href: links.website
        ? `https://${links.website.replace(/^https?:\/\//, "")}`
        : null,
      label: "Website",
    },
  ].filter((item) => item.href);
  if (items.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href!}
          target="_blank"
          rel="noreferrer"
          className="inline-flex"
        >
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-border text-foreground"
          >
            {item.label}
          </Button>
        </a>
      ))}
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function CourseRow({
  course,
  progressLabel,
}: {
  course: Course;
  progressLabel: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3 transition-colors hover:border-primary/30">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{course.title}</p>
          <p className="text-xs text-muted-foreground">{course.instructor}</p>
        </div>
        <Badge
          variant="outline"
          className="border-border text-muted-foreground"
        >
          {course.difficulty}
        </Badge>
      </div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{progressLabel}</span>
        <span className="font-medium text-primary">{course.progress}%</span>
      </div>
      <Progress
        value={course.progress}
        className="h-1.5 bg-secondary [&>div]:bg-primary"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{course.duration}</span>
        <span>{course.xp} XP</span>
      </div>
    </div>
  );
}

function shortAddress(mint: string): string {
  if (mint.length <= 12) return mint;
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
}
