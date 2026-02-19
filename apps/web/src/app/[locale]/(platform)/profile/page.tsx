"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Achievement, Certificate } from "@superteam-lms/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/gamification/level-badge";
import { SkillRadar } from "@/components/gamification/skill-radar";
import { AchievementGrid } from "@/components/gamification/achievement-grid";
import { CertificateGrid } from "@/components/certificates/certificate-grid";
import { createClient } from "@/lib/supabase/client";
import { getProgressService } from "@/lib/services";
import { calculateLevel } from "@/lib/gamification/xp";
import {
  getAllCourseTags,
  getCoursesByIds,
  getDeployedAchievements,
  type DeployedAchievement,
} from "@/lib/sanity/queries";

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
  isPublic: boolean;
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
  deployedAchievements: DeployedAchievement[];
  certificates: Certificate[];
  completedCourses: CompletedCourse[];
  isLoading: boolean;
}

function useProfileData(): ProfileData {
  const [data, setData] = useState<ProfileData>({
    user: null,
    stats: { totalXp: 0, level: 0, coursesCompleted: 0, certificatesCount: 0 },
    skills: [],
    achievements: [],
    deployedAchievements: [],
    certificates: [],
    completedCourses: [],
    isLoading: true,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user ?? null;

        if (!user) {
          setData((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        // Fetch XP via service layer (on-chain first, Supabase fallback)
        const service = getProgressService(supabase);
        const totalXp = await service.getXP(user.id);

        // Fetch achievements
        const { data: achievementRows } = await supabase
          .from("user_achievements")
          .select("achievement_id, unlocked_at, asset_address, tx_signature")
          .eq("user_id", user.id);

        // Fetch certificates
        const { data: certRows } = await supabase
          .from("certificates")
          .select("*")
          .eq("user_id", user.id);

        // Fetch completed courses count
        const { data: progressRows } = await supabase
          .from("user_progress")
          .select("course_id, completed")
          .eq("user_id", user.id)
          .eq("completed", true);

        const socialLinks = (profile?.social_links ?? {}) as {
          twitter?: string;
          github?: string;
          discord?: string;
        };

        const profileData: UserData | null = profile
          ? {
              id: profile.id,
              username: profile.username,
              bio: profile.bio ?? "",
              avatarUrl: profile.avatar_url ?? "",
              joinedAt: new Date(profile.created_at),
              socialLinks,
              isPublic: profile.is_public,
            }
          : null;

        // achievements resolved after achievementMap is built below

        const certificates: Certificate[] =
          certRows?.map((row) => ({
            id: row.id,
            userId: row.user_id,
            courseId: row.course_id,
            courseTitle: row.course_title,
            mintAddress: row.mint_address ?? "",
            metadataUri: row.metadata_uri ?? "",
            mintedAt: new Date(row.minted_at),
          })) ?? [];

        // Build completed courses from progress data
        // Group progress rows by course_id
        const courseProgressMap = new Map<string, number>();
        for (const row of progressRows ?? []) {
          courseProgressMap.set(
            row.course_id,
            (courseProgressMap.get(row.course_id) ?? 0) + 1
          );
        }

        // Fetch enrollments to get enrollment dates for completed courses
        const { data: enrollmentRows } = await supabase
          .from("enrollments")
          .select("course_id, enrolled_at")
          .eq("user_id", user.id);

        // Resolve enrolled course details from Sanity CMS
        const enrolledIds = (enrollmentRows ?? []).map((e) => e.course_id);
        const [courseSummaries, allCourseTags, deployedAchievements] =
          await Promise.all([
            enrolledIds.length > 0
              ? getCoursesByIds(enrolledIds)
              : Promise.resolve([]),
            getAllCourseTags(),
            getDeployedAchievements(),
          ]);
        const achievementMap = new Map(
          deployedAchievements.map((a) => [a.id, a])
        );

        const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
        const cluster = network === "mainnet" ? "mainnet-beta" : network;

        const achievements: Achievement[] =
          achievementRows?.map((row) => {
            const def = achievementMap.get(row.achievement_id);
            const explorerUrl = row.asset_address
              ? `https://explorer.solana.com/address/${row.asset_address}?cluster=${cluster}`
              : row.tx_signature
                ? `https://explorer.solana.com/tx/${row.tx_signature}?cluster=${cluster}`
                : undefined;
            return {
              id: row.achievement_id,
              name: def?.name ?? row.achievement_id,
              description: def?.description ?? "",
              icon: def?.icon ?? "Award",
              category: (def?.category as Achievement["category"]) ?? "special",
              unlockedAt: new Date(row.unlocked_at),
              explorerUrl,
            };
          }) ?? [];

        const courseMap = new Map(courseSummaries.map((c) => [c._id, c]));

        // Build completed courses list with real titles from Sanity
        const completedCourses: CompletedCourse[] = [];
        const completedCourseIds = new Set<string>();
        for (const enrollment of enrollmentRows ?? []) {
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

        // Compute skill radar from course tags
        // Count how many times each tag appears across all courses,
        // then scale completed course tags relative to total.
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

        // Convert to skill items: value = (completed / total) * 100
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
          user: profileData,
          stats: {
            totalXp,
            level: calculateLevel(totalXp),
            coursesCompleted: completedCourses.length,
            certificatesCount: certificates.length,
          },
          skills: skills.length > 0 ? skills : [],
          achievements,
          deployedAchievements,
          certificates,
          completedCourses,
          isLoading: false,
        });
      } catch {
        setData((prev) => ({ ...prev, isLoading: false }));
      }
    }

    fetchData();
  }, []);

  return data;
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tGamification = useTranslations("gamification");
  const tCerts = useTranslations("certificates");
  const data = useProfileData();

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!data.user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-4 font-display text-4xl font-black text-primary">?</p>
        <h2 className="mb-2 text-xl font-semibold">{t("signInToView")}</h2>
        <p className="text-text-3">{t("signInDescription")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
            <span className="bg-success/10 rounded-full px-2.5 py-0.5 text-xs font-medium text-success">
              {data.user.isPublic ? t("publicProfile") : t("privateProfile")}
            </span>
          </div>

          <p className="max-w-2xl text-text-3">{data.user.bio || t("noBio")}</p>

          <div className="flex items-center gap-1 text-sm text-text-3">
            <span>
              {t("joinedOn", { date: data.user.joinedAt.toLocaleDateString() })}
            </span>
          </div>

          {/* Social Links */}
          {data.user.socialLinks && (
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
      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold">{t("skills")}</h2>
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <SkillRadar skills={data.skills} size={280} />
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <AchievementGrid
        unlockedAchievements={data.achievements}
        catalog={data.deployedAchievements}
      />

      {/* Certificates */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold">{tCerts("title")}</h2>
        <CertificateGrid
          certificates={data.certificates}
          recipientName={data.user.username}
        />
      </div>
    </div>
  );
}
