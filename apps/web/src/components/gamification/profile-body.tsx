"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { GraduationCap } from "@phosphor-icons/react";
import { ProfileHeroPanel } from "@/components/gamification/profile-hero-panel";
import { SkillRadar } from "@/components/gamification/skill-radar";
import { AchievementGrid } from "@/components/gamification/achievement-grid";
import { CERTIFICATE_STYLES as CS } from "@/lib/styles/styleClasses";
import { truncateAddress } from "@/lib/utils";
import type {
  ProfileContent,
  ProfileStats,
  ProfileUser,
} from "@/lib/profile/profile-data";

interface ProfileBodyProps {
  user: ProfileUser;
  stats: ProfileStats;
  content: ProfileContent;
  /** Own profile: show the public/private visibility badge on the hero. */
  showVisibilityBadge?: boolean;
  /** Own profile: day-streak stat (own-row under RLS). */
  streak?: { currentStreak: number; longestStreak: number };
}

/**
 * Shared profile presentation (LX / #533). Data is fetched server-side and
 * passed in as serializable props; this component is a thin client island only
 * because its whole subtree — the hero panel, skill radar, and achievement grid
 * — is already interactive. The public and own-profile pages differ only in the
 * hero's streak/visibility props and the surrounding page chrome.
 */
export function ProfileBody({
  user,
  stats,
  content,
  showVisibilityBadge = false,
  streak,
}: ProfileBodyProps) {
  const t = useTranslations("profile");
  const tCerts = useTranslations("certificates");
  const locale = useLocale();

  return (
    <div className="space-y-10">
      {/* ─── Profile Hero Panel (dash-panel) ─── */}
      <ProfileHeroPanel
        user={user}
        stats={stats}
        achievements={content.achievements}
        deployedAchievements={content.deployedAchievements}
        showVisibilityBadge={showVisibilityBadge}
        streak={streak}
      />

      {/* ─── Skills Radar ─── */}
      {content.skills.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-[22px] font-extrabold">
            {t("skills")}
          </h2>
          <SkillRadar
            skills={content.skills}
            totalLessons={content.totalLessons}
          />
        </section>
      )}

      {/* ─── Achievements ─── */}
      <AchievementGrid
        unlockedAchievements={content.achievements}
        catalog={content.deployedAchievements}
      />

      {/* ─── Certificates — compact on-chain proof cards ─── */}
      {content.certificates.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-[22px] font-extrabold">
            {tCerts("title")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.certificates.map((cert) => (
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
                        {user.username}
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

      {content.certificates.length === 0 && (
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
