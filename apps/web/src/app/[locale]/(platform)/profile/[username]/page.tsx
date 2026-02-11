"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock, ArrowLeft } from "@phosphor-icons/react";
import type { Achievement, Certificate } from "@superteam-lms/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/gamification/level-badge";
import { SkillRadar } from "@/components/gamification/skill-radar";
import { AchievementGrid } from "@/components/gamification/achievement-grid";
import { CertificateGrid } from "@/components/certificates/certificate-grid";
import { createClient } from "@/lib/supabase/client";
import { getAllCourseTags, getCoursesByIds } from "@/lib/sanity/queries";
import { getAchievementById } from "@/lib/gamification/achievements";

interface UserData {
  id: string;
  username: string;
  bio: string;
  avatarUrl: string;
  joinedAt: Date;
  socialLinks: {
    twitter?: string;
    github?: string;
    discord?: string;
  };
}

interface CompletedCourse {
  title: string;
  slug: string;
  completedAt: string;
  xpEarned: number;
}

interface SkillItem {
  label: string;
  value: number;
}

interface ProfileData {
  user: UserData | null;
  stats: {
    totalXp: number;
    level: number;
    coursesCompleted: number;
    certificatesCount: number;
  };
  skills: SkillItem[];
  achievements: Achievement[];
  certificates: Certificate[];
  completedCourses: CompletedCourse[];
  isLoading: boolean;
  notFound: boolean;
  isPrivate: boolean;
  isOwnProfile: boolean;
}

const INITIAL_STATE: ProfileData = {
  user: null,
  stats: { totalXp: 0, level: 0, coursesCompleted: 0, certificatesCount: 0 },
  skills: [],
  achievements: [],
  certificates: [],
  completedCourses: [],
  isLoading: true,
  notFound: false,
  isPrivate: false,
  isOwnProfile: false,
};

export default function PublicProfilePage() {
  const params = useParams();
  const username = decodeURIComponent(params.username as string);
  const t = useTranslations("profile");
  const tGamification = useTranslations("gamification");
  const tCerts = useTranslations("certificates");
  const tCourses = useTranslations("courses");
  const [data, setData] = useState<ProfileData>(INITIAL_STATE);

  useEffect(() => {
    async function fetchPublicProfile() {
      try {
        const supabase = createClient();

        // Check if this is the current user's own profile
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id ?? null;

        // Look up profile by username
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, username, bio, avatar_url, social_links, is_public, created_at"
          )
          .eq("username", username)
          .single();

        if (profileError || !profile) {
          setData((prev) => ({
            ...prev,
            isLoading: false,
            notFound: true,
          }));
          return;
        }

        const isOwn = currentUserId === profile.id;

        // If profile is private and it's not the owner, show private message
        if (!profile.is_public && !isOwn) {
          setData((prev) => ({
            ...prev,
            isLoading: false,
            isPrivate: true,
            user: {
              id: profile.id,
              username: profile.username,
              bio: "",
              avatarUrl: profile.avatar_url ?? "",
              joinedAt: new Date(profile.created_at),
              socialLinks: {},
            },
          }));
          return;
        }

        const userId = profile.id;

        // Fetch all public data in parallel
        const [
          xpResult,
          achievementResult,
          certResult,
          progressResult,
          enrollmentResult,
        ] = await Promise.all([
          supabase
            .from("user_xp")
            .select("total_xp, level")
            .eq("user_id", userId)
            .single(),
          supabase
            .from("user_achievements")
            .select("achievement_id, unlocked_at")
            .eq("user_id", userId),
          supabase.from("certificates").select("*").eq("user_id", userId),
          supabase
            .from("user_progress")
            .select("course_id, completed")
            .eq("user_id", userId)
            .eq("completed", true),
          supabase
            .from("enrollments")
            .select("course_id, enrolled_at")
            .eq("user_id", userId),
        ]);

        const socialLinks = (profile.social_links ?? {}) as {
          twitter?: string;
          github?: string;
          discord?: string;
        };

        const userData: UserData = {
          id: profile.id,
          username: profile.username,
          bio: profile.bio ?? "",
          avatarUrl: profile.avatar_url ?? "",
          joinedAt: new Date(profile.created_at),
          socialLinks,
        };

        const achievements: Achievement[] =
          achievementResult.data?.map((row) => {
            const def = getAchievementById(row.achievement_id);
            return {
              id: row.achievement_id,
              name: def?.name ?? row.achievement_id,
              description: def?.description ?? "",
              icon: def?.icon ?? "Award",
              category: def?.category ?? "special",
              unlockedAt: new Date(row.unlocked_at),
            };
          }) ?? [];

        const certificates: Certificate[] =
          certResult.data?.map((row) => ({
            id: row.id,
            userId: row.user_id,
            courseId: row.course_id,
            courseTitle: row.course_title,
            mintAddress: row.mint_address ?? "",
            metadataUri: row.metadata_uri ?? "",
            mintedAt: new Date(row.minted_at),
          })) ?? [];

        // Build completed courses from progress data
        const courseProgressMap = new Map<string, number>();
        for (const row of progressResult.data ?? []) {
          courseProgressMap.set(
            row.course_id,
            (courseProgressMap.get(row.course_id) ?? 0) + 1
          );
        }

        const enrolledIds = (enrollmentResult.data ?? []).map(
          (e) => e.course_id
        );
        const [courseSummaries, allCourseTags] = await Promise.all([
          enrolledIds.length > 0
            ? getCoursesByIds(enrolledIds)
            : Promise.resolve([]),
          getAllCourseTags(),
        ]);

        const courseMap = new Map(courseSummaries.map((c) => [c._id, c]));

        const completedCourses: CompletedCourse[] = [];
        const completedCourseIds = new Set<string>();
        for (const enrollment of enrollmentResult.data ?? []) {
          const completedCount =
            courseProgressMap.get(enrollment.course_id) ?? 0;
          if (completedCount > 0) {
            const sanity = courseMap.get(enrollment.course_id);
            completedCourseIds.add(enrollment.course_id);
            completedCourses.push({
              title: sanity?.title ?? enrollment.course_id,
              slug: sanity?.slug ?? enrollment.course_id,
              completedAt: new Date(
                enrollment.enrolled_at
              ).toLocaleDateString(),
              xpEarned: 0,
            });
          }
        }

        // Compute skill radar
        const tagTotalCount = new Map<string, number>();
        const tagCompletedCount = new Map<string, number>();
        for (const course of allCourseTags) {
          for (const tag of course.tags ?? []) {
            tagTotalCount.set(tag, (tagTotalCount.get(tag) ?? 0) + 1);
            if (completedCourseIds.has(course._id)) {
              tagCompletedCount.set(tag, (tagCompletedCount.get(tag) ?? 0) + 1);
            }
          }
        }

        const skills: SkillItem[] = Array.from(tagTotalCount.entries())
          .map(([tag, total]) => ({
            label: tag.charAt(0).toUpperCase() + tag.slice(1),
            value: Math.round(
              ((tagCompletedCount.get(tag) ?? 0) / total) * 100
            ),
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);

        setData({
          user: userData,
          stats: {
            totalXp: xpResult.data?.total_xp ?? 0,
            level: xpResult.data?.level ?? 0,
            coursesCompleted: completedCourses.length,
            certificatesCount: certificates.length,
          },
          skills: skills.length > 0 ? skills : [],
          achievements,
          certificates,
          completedCourses,
          isLoading: false,
          notFound: false,
          isPrivate: false,
          isOwnProfile: isOwn,
        });
      } catch {
        setData((prev) => ({ ...prev, isLoading: false, notFound: true }));
      }
    }

    fetchPublicProfile();
  }, [username]);

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="sr-only">{t("loading")}</span>
      </div>
    );
  }

  if (data.notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p
          className="mb-3 font-display text-4xl font-black text-text-3"
          aria-hidden="true"
        >
          ?
        </p>
        <h2 className="mb-2 text-xl font-semibold">{t("userNotFound")}</h2>
        <p className="text-text-3">{t("userNotFoundDescription")}</p>
      </div>
    );
  }

  if (data.isPrivate && data.user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Avatar className="mb-4 h-16 w-16">
          {data.user.avatarUrl && (
            <AvatarImage src={data.user.avatarUrl} alt={data.user.username} />
          )}
          <AvatarFallback className="text-xl">
            {data.user.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h2 className="mb-2 text-xl font-semibold">{data.user.username}</h2>
        <div className="flex items-center gap-2 text-text-3">
          <Lock size={16} weight="bold" />
          <p>{t("profileIsPrivate")}</p>
        </div>
      </div>
    );
  }

  if (!data.user) return null;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <a
        href="javascript:history.back()"
        className="inline-flex items-center gap-1.5 text-sm text-text-3 transition-colors hover:text-text"
      >
        <ArrowLeft size={14} weight="bold" />
        {t("backToLeaderboard")}
      </a>

      {/* Profile Header */}
      <div className="flex flex-col items-start gap-6 sm:flex-row">
        <Avatar className="h-20 w-20">
          {data.user.avatarUrl && (
            <AvatarImage src={data.user.avatarUrl} alt={data.user.username} />
          )}
          <AvatarFallback className="text-2xl">
            {data.user.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold">
              {data.user.username}
            </h1>
            <LevelBadge level={data.stats.level} size="sm" />
          </div>

          <p className="max-w-2xl text-text-3">{data.user.bio || t("noBio")}</p>

          <div className="flex items-center gap-1 text-sm text-text-3">
            <span>
              {t("joinedOn", {
                date: data.user.joinedAt.toLocaleDateString(),
              })}
            </span>
          </div>

          {/* Social Links */}
          {(data.user.socialLinks.twitter ||
            data.user.socialLinks.github ||
            data.user.socialLinks.discord) && (
            <div className="mt-2 flex items-center gap-4">
              {data.user.socialLinks.twitter && (
                <a
                  href={`https://twitter.com/${data.user.socialLinks.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-text-3 transition-colors hover:text-text"
                >
                  Twitter &rarr;
                </a>
              )}
              {data.user.socialLinks.github && (
                <a
                  href={`https://github.com/${data.user.socialLinks.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-text-3 transition-colors hover:text-text"
                >
                  GitHub &rarr;
                </a>
              )}
              {data.user.socialLinks.discord && (
                <span className="flex items-center gap-1 text-sm text-text-3">
                  Discord: {data.user.socialLinks.discord}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="font-display text-2xl font-black text-primary">
              {data.stats.totalXp.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-text-3">{t("totalXp")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="font-display text-2xl font-black">
              {data.stats.level}
            </p>
            <p className="mt-1 text-xs text-text-3">{tGamification("level")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="font-display text-2xl font-black">
              {data.stats.coursesCompleted}
            </p>
            <p className="mt-1 text-xs text-text-3">{t("coursesCompleted")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="font-display text-2xl font-black">
              {data.stats.certificatesCount}
            </p>
            <p className="mt-1 text-xs text-text-3">
              {t("certificatesEarned")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Skills Radar */}
      {data.skills.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold">{t("skills")}</h2>
          <Card>
            <CardContent className="flex items-center justify-center p-6">
              <SkillRadar skills={data.skills} size={280} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Achievements */}
      {data.achievements.length > 0 && (
        <AchievementGrid unlockedAchievements={data.achievements} />
      )}

      {/* Certificates */}
      {data.certificates.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold">{tCerts("title")}</h2>
          <CertificateGrid
            certificates={data.certificates}
            recipientName={data.user.username}
          />
        </div>
      )}

      {/* Completed Courses */}
      {data.completedCourses.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold">
            {t("completedCourses")}
          </h2>
          <div className="space-y-3">
            {data.completedCourses.map((course) => (
              <Card key={course.slug}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-bg">
                      <span
                        className="h-2.5 w-2.5 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{course.title}</p>
                      <p className="text-xs text-text-3">
                        {tCourses("completed")} {course.completedAt}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
