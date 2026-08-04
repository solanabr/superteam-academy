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
  streak?: { currentStreak: number; longestStreak: number; available: boolean };
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
  const tGam = useTranslations("gamification");
  const tCerts = useTranslations("certificates");
  const locale = useLocale();

  return (
    <div className="space-y-8">
      {/* ─── Profile Hero Panel (dash-panel) — the page anchor ─── */}
      <ProfileHeroPanel
        user={user}
        stats={stats}
        achievements={content.achievements}
        deployedAchievements={content.deployedAchievements}
        showVisibilityBadge={showVisibilityBadge}
        streak={streak}
      />

      {/* Main column + rail — the dashboard composition (04-08): long-form
          proof (skills, certificates) left, glanceable achievements right.
          Sections are cards with mono kickers, not floating page headings. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-8">
          {/* ─── Skills — the radar (owner keeper) under the standard
              page-section heading; card gives it a frame, 560px cap kills the
              old whitespace ocean. ─── */}
          {content.skills.length > 0 && (
            <section aria-label={t("skills")}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-display text-lg font-black tracking-[-0.25px]">
                  {t("skills")}
                </h2>
                <span className="cc-section-count">
                  {content.skills.length}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <SkillRadar
                  skills={content.skills}
                  totalLessons={content.totalLessons}
                  className="mx-auto max-w-[560px] !border-0 !bg-transparent !p-0 !shadow-none"
                />
              </div>
            </section>
          )}

          {/* ─── Certificates — the on-chain proof; keeps the Solana-gradient
              frame (the one deliberate brand-gradient surface). ─── */}
          {content.certificates.length > 0 && (
            <section aria-label={tCerts("title")}>
              {/* Page-level section → dashboard heading idiom (display 18px +
                  count chip); kickers stay inside cards. */}
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-display text-lg font-black tracking-[-0.25px]">
                  {tCerts("title")}
                </h2>
                <span className="cc-section-count">
                  {content.certificates.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {content.certificates.map((cert) => (
                  <Link
                    key={cert.id}
                    href={`/${locale}/certificates/${cert.id}`}
                    className="accent-hairline hover:border-primary/40 relative block overflow-hidden rounded-xl border border-border bg-card p-4 shadow-card transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <div className="flex items-center gap-3">
                      {/* Credential seal — same tile idiom as the rail cards. */}
                      <span
                        className="bg-primary-dim flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary"
                        aria-hidden="true"
                      >
                        <GraduationCap size={20} weight="duotone" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm font-extrabold text-text">
                          {cert.courseTitle}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[1px] text-text-3">
                          {cert.mintedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <span className={CS.proofPill}>
                        <span className={CS.proofDot} aria-hidden="true" />
                        {cert.mintAddress
                          ? truncateAddress(cert.mintAddress)
                          : tCerts("onChain")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {content.certificates.length === 0 && (
            <section aria-label={tCerts("title")}>
              <h2 className="mb-4 font-display text-lg font-black tracking-[-0.25px]">
                {tCerts("title")}
              </h2>
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <GraduationCap
                  size={44}
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

        {/* ─── Rail: achievements, full catalog, no filter chrome ─── */}
        <aside className="space-y-6">
          <section
            aria-label={tGam("achievements")}
            className="rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-3">
                {tGam("achievements")}
              </p>
              <span className="font-mono text-[10px] uppercase tracking-[1px] text-text-3">
                {content.achievements.length}/
                {content.deployedAchievements.length}
              </span>
            </div>
            <AchievementGrid
              unlockedAchievements={content.achievements}
              catalog={content.deployedAchievements}
              compact
            />
          </section>
        </aside>
      </div>
    </div>
  );
}
