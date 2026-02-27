"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  Lock,
  ArrowLeft,
  GraduationCap,
  CircleNotch,
} from "@phosphor-icons/react";
import type { Achievement, Certificate } from "@superteam-lms/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileHeroPanel } from "@/components/gamification/profile-hero-panel";
import { SkillRadar } from "@/components/gamification/skill-radar";
import { AchievementGrid } from "@/components/gamification/achievement-grid";
import { createClient } from "@/lib/supabase/client";
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
  notFound: boolean;
  isPrivate: boolean;
  isOwnProfile: boolean;
}

const INITIAL_STATE: ProfileData = {
  user: null,
  stats: { totalXp: 0, level: 0, coursesCompleted: 0, certificatesCount: 0 },
  skills: [],
  totalLessons: 0,
  achievements: [],
  deployedAchievements: [],
  certificates: [],
  completedCourses: [],
  isLoading: true,
  notFound: false,
  isPrivate: false,
  isOwnProfile: false,
};

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = decodeURIComponent(params.username as string);
  const t = useTranslations("profile");
  const tCerts = useTranslations("certificates");
  const locale = useLocale();
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
            .select("achievement_id, unlocked_at, asset_address, tx_signature")
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

        // Total unique completed lessons
        const totalCompletedLessons = (progressResult.data ?? []).length;

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
          achievementResult.data?.map((row) => {
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
              assetAddress: row.asset_address ?? undefined,
            };
          }) ?? [];

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

        // Compute skill radar — raw completed lessons per tag, normalized
        // so the strongest tag = 100 and others scale proportionally.
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
          user: userData,
          stats: {
            totalXp: xpResult.data?.total_xp ?? 0,
            level: xpResult.data?.level ?? 0,
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
        <CircleNotch
          size={32}
          weight="bold"
          className="animate-spin text-primary"
          aria-hidden="true"
        />
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
        <Avatar className="mb-4 h-16 w-16 border-[3px] border-border">
          {data.user.avatarUrl && (
            <AvatarImage src={data.user.avatarUrl} alt={data.user.username} />
          )}
          <AvatarFallback className="font-display text-xl font-black">
            {data.user.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h2 className="mb-2 font-display text-xl font-black">
          {data.user.username}
        </h2>
        <div className="flex items-center gap-2 text-text-3">
          <Lock size={16} weight="bold" />
          <p className="font-body text-sm">{t("profileIsPrivate")}</p>
        </div>
      </div>
    );
  }

  if (!data.user) return null;

  return (
    <div className="space-y-10">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-text-3 transition-colors hover:text-text"
      >
        <ArrowLeft size={14} weight="bold" />
        {t("backToLeaderboard")}
      </button>

      {/* ─── Profile Hero Panel (dash-panel) ─── */}
      <ProfileHeroPanel
        user={data.user}
        stats={data.stats}
        achievements={data.achievements}
        deployedAchievements={data.deployedAchievements}
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
