import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { xpToLevel, levelProgress, ACHIEVEMENTS } from "@/lib/types/learning";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} — Caminho`,
    description: `View ${username}'s Solana developer profile on Caminho`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch profile by username
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  // Private profile
  if (!profile.is_public) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-2xl">
          🔒
        </div>
        <h1 className="text-xl font-semibold">This profile is private</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          @{username} has chosen to keep their profile private.
        </p>
        <Link
          href="/courses"
          className="mt-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all"
        >
          Explore Courses
        </Link>
      </div>
    );
  }

  // Fetch XP / streak data
  const { data: xpData } = await supabase
    .from("user_xp")
    .select("total_xp, current_streak, longest_streak, achievements, updated_at")
    .eq("user_id", profile.id)
    .single();

  // Fetch completed enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_title, course_slug, completed_at, lesson_progress, total_lessons")
    .eq("user_id", profile.id)
    .order("started_at", { ascending: false });

  const totalXp = xpData?.total_xp ?? 0;
  const level = xpToLevel(totalXp);
  const progress = levelProgress(totalXp);
  const currentStreak = xpData?.current_streak ?? 0;
  const longestStreak = xpData?.longest_streak ?? 0;
  const achievementBitmap = BigInt(xpData?.achievements ?? 0);

  const completedCourses = (enrollments ?? []).filter((e) => e.completed_at);
  const inProgressCourses = (enrollments ?? []).filter((e) => !e.completed_at);

  // Derive unlocked achievements from bitmap
  const unlockedAchievements = ACHIEVEMENTS.filter(
    (a) => (achievementBitmap & (1n << BigInt(a.id))) !== 0n
  );

  const initials = (profile.display_name || username).charAt(0).toUpperCase();
  const joinYear = new Date(profile.created_at).getFullYear();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Profile Header */}
      <div className="p-6 md:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 text-2xl font-bold flex-shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {profile.display_name || username}
            </h1>
            <p className="text-sm text-neutral-400 mt-0.5">@{username} · Joined {joinYear}</p>
            {profile.bio && (
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Social Links */}
            {(profile.social_twitter || profile.social_github || profile.social_discord || profile.social_website) && (
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {profile.social_twitter && (
                  <a
                    href={`https://twitter.com/${profile.social_twitter.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1"
                  >
                    <TwitterIcon /> {profile.social_twitter}
                  </a>
                )}
                {profile.social_github && (
                  <a
                    href={`https://github.com/${profile.social_github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1"
                  >
                    <GitHubIcon /> {profile.social_github}
                  </a>
                )}
                {profile.social_discord && (
                  <span className="text-xs text-neutral-500 flex items-center gap-1">
                    <DiscordIcon /> {profile.social_discord}
                  </span>
                )}
                {profile.social_website && (
                  <a
                    href={profile.social_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1"
                  >
                    <GlobeIcon /> {profile.social_website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* XP / Level / Streak Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
          <StatCard label="Level" value={level} />
          <StatCard label="Total XP" value={totalXp.toLocaleString()} />
          <StatCard label="Current Streak" value={`${currentStreak}d`} />
          <StatCard label="Best Streak" value={`${longestStreak}d`} />
        </div>

        {/* Level Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
            <span>Level {level}</span>
            <span>Level {level + 1}</span>
          </div>
          <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h2 className="text-lg font-semibold mb-4">
            Achievements
            <span className="ml-2 text-sm font-normal text-neutral-400">
              {unlockedAchievements.length} earned
            </span>
          </h2>
          <div className="flex flex-wrap gap-3">
            {unlockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                title={achievement.description}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
              >
                <AchievementIcon category={achievement.category} />
                <span className="font-medium text-xs">{achievement.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Courses */}
      {completedCourses.length > 0 && (
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h2 className="text-lg font-semibold mb-4">
            Completed Courses
            <span className="ml-2 text-sm font-normal text-neutral-400">
              {completedCourses.length} course{completedCourses.length !== 1 ? "s" : ""}
            </span>
          </h2>
          <div className="space-y-3">
            {completedCourses.map((enrollment) => (
              <Link
                key={enrollment.course_slug}
                href={`/courses/${enrollment.course_slug}`}
                className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                    <CheckIcon />
                  </div>
                  <span className="text-sm font-medium group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                    {enrollment.course_title}
                  </span>
                </div>
                <span className="text-xs text-neutral-400">
                  {enrollment.completed_at
                    ? new Date(enrollment.completed_at).toLocaleDateString()
                    : ""}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* In Progress */}
      {inProgressCourses.length > 0 && (
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h2 className="text-lg font-semibold mb-4">
            In Progress
            <span className="ml-2 text-sm font-normal text-neutral-400">
              {inProgressCourses.length} course{inProgressCourses.length !== 1 ? "s" : ""}
            </span>
          </h2>
          <div className="space-y-3">
            {inProgressCourses.map((enrollment) => {
              const bitmap = BigInt(enrollment.lesson_progress ?? 0);
              let completed = 0;
              let n = bitmap;
              while (n > 0n) { completed += Number(n & 1n); n >>= 1n; }
              const total = enrollment.total_lessons || 1;
              const pct = Math.min(Math.round((completed / total) * 100), 100);

              return (
                <Link
                  key={enrollment.course_slug}
                  href={`/courses/${enrollment.course_slug}`}
                  className="block p-3 rounded-xl border border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{enrollment.course_title}</span>
                    <span className="text-xs text-neutral-400">{pct}%</span>
                  </div>
                  <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 dark:bg-white rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {completedCourses.length === 0 && inProgressCourses.length === 0 && (
        <div className="p-8 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center">
          <p className="text-neutral-400 text-sm">No courses started yet.</p>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ───────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </div>
  );
}

function AchievementIcon({ category }: { category: string }) {
  const map: Record<string, string> = {
    progress: "📈",
    streaks: "🔥",
    skills: "⚡",
    community: "🤝",
    special: "⭐",
  };
  return <span className="text-base">{map[category] ?? "🏆"}</span>;
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
    </svg>
  );
}
