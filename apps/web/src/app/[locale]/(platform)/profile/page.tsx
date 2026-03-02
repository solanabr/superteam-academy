"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { GraduationCap, CircleNotch } from "@phosphor-icons/react";
import type { Achievement, Certificate } from "@superteam-lms/types";
import { ProfileHeroPanel } from "@/components/gamification/profile-hero-panel";
import { SkillRadar } from "@/components/gamification/skill-radar";
import { AchievementGrid } from "@/components/gamification/achievement-grid";
import { createClient } from "@/lib/supabase/client";
import { getProgressService } from "@/lib/services";
import { calculateLevel } from "@/lib/gamification/xp";
import { CERTIFICATE_STYLES as CS } from "@/lib/styles/styleClasses";
import {
  getAllAchievements,
  getAllCourseTags,
  getCoursesByIds,
  type DeployedAchievement,
} from "@/lib/sanity/queries";
import { truncateAddress } from "@/lib/utils";

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
  lessonCount: number;
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
  totalLessons: number;
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
    totalLessons: 0,
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
              joinedAt: new Date(profile.created_at ?? Date.now()),
              socialLinks,
              isPublic: profile.is_public ?? true,
            }
          : null;

        const certificates: Certificate[] =
          certRows?.map((row) => ({
            id: row.id,
            userId: row.user_id ?? "",
            courseId: row.course_id,
            courseTitle: row.course_title,
            mintAddress: row.mint_address ?? "",
            metadataUri: row.metadata_uri ?? "",
            mintedAt: new Date(row.minted_at ?? Date.now()),
          })) ?? [];

        // Total unique completed lessons (one row per lesson)
        const totalCompletedLessons = (progressRows ?? []).length;

        // Build completed courses from progress data
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
        const [courseSummaries, allCourseTags, allAchievements] =
          await Promise.all([
            enrolledIds.length > 0
              ? getCoursesByIds(enrolledIds)
              : Promise.resolve([]),
            getAllCourseTags(),
            getAllAchievements(),
          ]);
        const achievementMap = new Map(allAchievements.map((a) => [a.id, a]));

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
              unlockedAt: new Date(row.unlocked_at ?? Date.now()),
              explorerUrl,
              assetAddress: row.asset_address ?? undefined,
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
                enrollment.enrolled_at ?? Date.now()
              ).toLocaleDateString(),
              xpEarned: 0,
            });
          }
        }

        // Compute skill radar — raw completed lessons per tag, normalized
        // so the strongest tag = 100 and others scale proportionally.
        // This shows skill *distribution* instead of flat 100% everywhere.
        const tagCompletedLessons = new Map<string, number>();
        for (const course of allCourseTags) {
          const done = courseProgressMap.get(course._id) ?? 0;
          for (const tag of course.tags ?? []) {
            tagCompletedLessons.set(
              tag,
              (tagCompletedLessons.get(tag) ?? 0) + done
            );
          }
        }

        const rawSkills = Array.from(tagCompletedLessons.entries())
          .filter(([, count]) => count > 0)
          .map(([tag, count]) => ({
            label: tag.charAt(0).toUpperCase() + tag.slice(1),
            lessonCount: count,
          }))
          .sort((a, b) => b.lessonCount - a.lessonCount)
          .slice(0, 8);

        const maxLessons = rawSkills[0]?.lessonCount ?? 1;
        const skills: SkillItem[] = rawSkills.map((s) => ({
          ...s,
          value: Math.round((s.lessonCount / maxLessons) * 100),
        }));

        setData({
          user: profileData,
          stats: {
            totalXp,
            level: calculateLevel(totalXp),
            coursesCompleted: completedCourses.length,
            certificatesCount: certificates.length,
          },
          skills: skills.length > 0 ? skills : [],
          totalLessons: totalCompletedLessons,
          achievements,
          deployedAchievements: allAchievements,
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
  const tCommon = useTranslations("common");
  const tCerts = useTranslations("certificates");
  const locale = useLocale();
  const data = useProfileData();

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CircleNotch
          size={32}
          weight="bold"
          className="animate-spin text-primary"
          aria-hidden="true"
        />
        <span className="sr-only">{tCommon("loading")}</span>
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
    <div className="space-y-10">
      {/* ─── Profile Hero Panel (dash-panel) ─── */}
      <ProfileHeroPanel
        user={data.user}
        stats={data.stats}
        achievements={data.achievements}
        deployedAchievements={data.deployedAchievements}
        showVisibilityBadge
      />

      {/* ─── Skills Radar ─── */}
      {data.skills.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-[22px] font-extrabold">
            {t("skills")}
          </h2>
          <SkillRadar skills={data.skills} totalLessons={data.totalLessons} />
        </section>
      )}

      {/* ─── Achievements ─── */}
      <AchievementGrid
        unlockedAchievements={data.achievements}
        catalog={data.deployedAchievements}
      />

      {/* ─── Certificates — compact on-chain proof cards ─── */}
      {data.certificates.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-[22px] font-extrabold">
            {tCerts("title")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.certificates.map((cert) => (
              <Link
                key={cert.id}
                href={`/${locale}/certificates/${cert.id}`}
                className="group"
              >
                <div className={CS.gradCard || "grad-card"}>
                  <div className={CS.gradCardInner || "grad-card-inner"}>
                    <div className={CS.gradCardBody || "grad-card-body"}>
                      <p className="font-display text-[15px] font-extrabold leading-snug text-text">
                        {cert.courseTitle}
                      </p>
                      <p className="mt-1 font-body text-[13px] text-text-2">
                        {data.user?.username}
                        <span className="mx-1.5 text-text-3">&middot;</span>
                        {cert.mintedAt.toLocaleDateString()}
                      </p>
                      <div className="mt-3">
                        <span className={CS.proofPill}>
                          <span className={CS.proofDot} aria-hidden="true" />
                          {cert.mintAddress
                            ? truncateAddress(cert.mintAddress)
                            : tCerts("onChain")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data.certificates.length === 0 && (
        <section>
          <h2 className="mb-4 font-display text-[22px] font-extrabold">
            {tCerts("title")}
          </h2>
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <GraduationCap
              size={48}
              weight="duotone"
              className="text-accent"
              aria-hidden="true"
            />
            <p className="text-center font-body text-text-3">
              {tCerts("noCertificates")}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
