"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { GraduationCap } from "@phosphor-icons/react";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { ProfileHeroPanel } from "@/components/gamification/profile-hero-panel";
import { SkillRadar } from "@/components/gamification/skill-radar";
import { AchievementGrid } from "@/components/gamification/achievement-grid";
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
              {/* Radar (keeper) + per-skill legend fill the card together —
                  the radar alone left an ocean of whitespace either side. */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="grid items-center gap-8 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                  <SkillRadar
                    skills={content.skills}
                    totalLessons={content.totalLessons}
                    className="mx-auto w-full max-w-[420px] !border-0 !bg-transparent !p-0 !shadow-none"
                  />
                  <div className="space-y-3">
                    {[...content.skills]
                      .sort((a, b) => b.lessonCount - a.lessonCount)
                      .map((skill) => {
                        const max = Math.max(
                          1,
                          ...content.skills.map((sk) => sk.lessonCount)
                        );
                        return (
                          <div key={skill.label}>
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="min-w-0 truncate text-[13px] font-semibold text-text">
                                {skill.label}
                              </span>
                              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[1px] text-text-3">
                                {t("lessonsCount", {
                                  count: skill.lessonCount,
                                })}
                              </span>
                            </div>
                            <div
                              className="path-bar-track mt-1.5"
                              aria-hidden="true"
                            >
                              <div
                                className="path-bar-fill"
                                style={{
                                  width: `${Math.round((skill.lessonCount / max) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ─── Rail: achievements, full catalog, no filter chrome ─── */}
        <aside className="space-y-6">
          <section aria-label={tGam("achievements")}>
            {/* Same heading block as Skills so both columns top-align. */}
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-display text-lg font-black tracking-[-0.25px]">
                {tGam("achievements")}
              </h2>
              <span className="cc-section-count">
                {content.achievements.length}/
                {content.deployedAchievements.length}
              </span>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <AchievementGrid
                unlockedAchievements={content.achievements}
                catalog={content.deployedAchievements}
                compact
              />
            </div>
          </section>
        </aside>
      </div>

      {/* ─── Certificates — full-width shelf below the working area. Slim
          diploma cards (shared CertificateCard, per-card eyebrow hidden — the
          section heading already says it). Stretched-link keeps the explorer
          pill's own anchor legal (no <a> nesting). ─── */}
      {content.certificates.length > 0 && (
        <section aria-label={tCerts("title")}>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-lg font-black tracking-[-0.25px]">
              {tCerts("title")}
            </h2>
            <span className="cc-section-count">
              {content.certificates.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.certificates.map((cert) => (
              <div key={cert.id} className="cert-slim relative">
                <Link
                  href={`/${locale}/certificates/${cert.id}`}
                  aria-label={cert.courseTitle}
                  className="absolute inset-0 z-[1] rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
                <CertificateCard
                  certificate={cert}
                  recipientName={user.username}
                  variant="compact"
                />
              </div>
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
  );
}
