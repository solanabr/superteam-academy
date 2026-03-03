import { getTranslations } from "next-intl/server";
import {
  getProfileByUsername,
  getProfileByWallet,
  getCompletedCourseSlugs,
  getProfileStats,
} from "@/lib/supabase";
import { getCourseSkillData } from "@/lib/sanity";
import { getCredentials, getAchievements } from "@/services/credentials";
import { CredentialCard } from "@/components/solana/CredentialCard";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { SkillRadar } from "@/components/profile/SkillRadar";
import { VisibilityToggle } from "@/components/profile/VisibilityToggle";
import { xpToLevel } from "@/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ locale: string; username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} · Academy Profile` };
}

// Max courses per skill used to normalise scores — prevents a single track
// dominating; adjust as the course catalogue grows.
const MAX_COURSES_PER_SKILL = 5;

// Returns the skill axes a course belongs to based on its tags and trackId.
function courseToSkills(tags: string[], trackId: number): string[] {
  const skills = new Set<string>();

  const tagSet = tags.map((t) => t.toLowerCase());

  if (tagSet.some((t) => t.includes("rust")) || trackId === 1 || trackId === 2)
    skills.add("Rust");
  if (tagSet.some((t) => t.includes("anchor")) || trackId === 2)
    skills.add("Anchor");
  if (tagSet.some((t) => t.includes("defi")) || trackId === 3)
    skills.add("DeFi");
  if (tagSet.some((t) => t.includes("nft")) || trackId === 4)
    skills.add("NFTs");
  if (tagSet.some((t) => t.includes("frontend")) || trackId === 5)
    skills.add("Frontend");
  if (tagSet.some((t) => t.includes("security"))) skills.add("Security");

  return [...skills];
}

function computeSkillScores(
  courseData: Array<{ slug: string; tags: string[]; trackId: number }>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const course of courseData) {
    const axes = courseToSkills(course.tags ?? [], course.trackId ?? 0);
    for (const axis of axes) {
      counts[axis] = (counts[axis] ?? 0) + 1;
    }
  }
  const scores: Record<string, number> = {};
  for (const [skill, count] of Object.entries(counts)) {
    scores[skill] = Math.min(
      100,
      Math.round((count / MAX_COURSES_PER_SKILL) * 100),
    );
  }
  return scores;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const t = await getTranslations("profile");

  // Try username lookup first, then wallet address lookup
  const isWalletAddress = username.length >= 32 && username.length <= 44;
  const profile =
    (await getProfileByUsername(username).catch(() => null)) ??
    (isWalletAddress
      ? await getProfileByWallet(username).catch(() => null)
      : null);

  const walletAddress =
    profile?.walletAddress ?? (isWalletAddress ? username : null);

  const [credentials, achievements, completedSlugs, profileStats] =
    await Promise.all([
      walletAddress ? getCredentials(walletAddress) : Promise.resolve([]),
      walletAddress ? getAchievements(walletAddress) : Promise.resolve([]),
      walletAddress
        ? getCompletedCourseSlugs(walletAddress)
        : Promise.resolve([]),
      walletAddress
        ? getProfileStats(walletAddress)
        : Promise.resolve({ totalXp: 0, completedCourses: [] }),
    ]);

  const totalXp = profileStats.totalXp;
  const level = xpToLevel(totalXp);

  // Derive skill scores from completed courses (tags + trackId)
  const courseSkillData =
    completedSlugs.length > 0
      ? await getCourseSkillData(completedSlugs).catch(() => [])
      : [];
  const derivedSkills = computeSkillScores(courseSkillData);

  if (!profile && !walletAddress) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="font-mono text-muted-foreground">{t("notFound")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Profile header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-elevated border border-border flex items-center justify-center font-mono text-2xl flex-shrink-0">
          {(profile?.displayName ??
            profile?.username ??
            username)?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-mono text-2xl font-bold text-foreground">
              {profile?.displayName ??
                profile?.username ??
                (walletAddress
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                  : username)}
            </h1>
            <LevelBadge level={level} />
            {walletAddress && (
              <VisibilityToggle walletAddress={walletAddress} />
            )}
          </div>
          {profile?.username && (
            <p className="text-sm text-muted-foreground font-mono">
              @{profile.username}
            </p>
          )}
          {profile?.bio && (
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              {profile.bio}
            </p>
          )}
          <div className="flex flex-wrap gap-4 mt-3 text-xs font-mono text-muted-foreground">
            {walletAddress && (
              <span>
                ◎ {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            )}
            {profile?.createdAt && (
              <span>
                {t("joined")} {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            )}
            {profile?.twitterHandle && (
              <a
                href={`https://twitter.com/${profile.twitterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                @{profile.twitterHandle}
              </a>
            )}
            {profile?.githubHandle && (
              <a
                href={`https://github.com/${profile.githubHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                github/{profile.githubHandle}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: t("totalXp"), value: totalXp.toLocaleString() },
          {
            label: t("courses"),
            value: profileStats.completedCourses.length.toString(),
          },
          { label: t("achievements"), value: achievements.length.toString() },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-card border border-border rounded p-4 text-center"
          >
            <div className="font-mono text-2xl font-bold text-foreground">
              {value}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase tracking-wider">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <section className="mb-8">
        <h2 className="font-mono text-lg font-semibold text-foreground mb-4">
          {t("skills")}
        </h2>
        <SkillRadar
          skills={
            Object.keys(derivedSkills).length > 0 ? derivedSkills : undefined
          }
        />
      </section>

      {/* Credentials */}
      <section className="mb-8">
        <h2 className="font-mono text-lg font-semibold text-foreground mb-4">
          {t("credentials")}
        </h2>
        {credentials.length === 0 ? (
          <p className="text-sm text-muted-foreground font-mono">
            {t("noCredentials")}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {credentials.map((cred) => (
              <CredentialCard key={cred.id} credential={cred} />
            ))}
          </div>
        )}
      </section>

      {/* Completed Courses */}
      <section className="mb-8">
        <h2 className="font-mono text-sm font-semibold text-foreground mb-3">
          {t("completedCourses")}
        </h2>
        {profileStats.completedCourses.length === 0 ? (
          <p className="text-xs text-muted-foreground font-mono">
            {t("noCompletedCourses")}
          </p>
        ) : (
          <div className="space-y-2">
            {profileStats.completedCourses.map((course) => (
              <div
                key={course.courseSlug}
                className="flex items-center justify-between bg-card border border-border rounded px-4 py-2.5"
              >
                <div>
                  <p className="text-sm font-mono text-foreground">
                    {course.courseTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {course.lessonsCompleted}{" "}
                    {course.lessonsCompleted === 1
                      ? t("lessonSingular")
                      : t("lessonPlural")}{" "}
                    · {course.totalXp.toLocaleString()} XP
                  </p>
                </div>
                <span className="text-[10px] font-mono text-accent bg-accent/10 border border-accent/20 rounded px-2 py-0.5">
                  &#x2713; {t("inProgress")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Achievements */}
      {achievements.length > 0 && (
        <section>
          <h2 className="font-mono text-lg font-semibold text-foreground mb-4">
            {t("achievements")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className="bg-card border border-border rounded px-3 py-2 flex items-center gap-2"
              >
                <span className="text-sm">🏆</span>
                <span className="text-xs font-mono text-foreground">
                  {ach.name}
                </span>
                <span className="text-[10px] font-mono text-accent">
                  +{ach.xpReward} XP
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
