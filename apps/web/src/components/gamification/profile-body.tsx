"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { GraduationCap } from "@phosphor-icons/react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { ProfileHeroPanel } from "@/components/gamification/profile-hero-panel";
import { SkillRadar } from "@/components/gamification/skill-radar";
import { AchievementToken } from "@/components/gamification/dashboard-identity-panel";
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
 * Shared profile presentation (LX / #533, recomposed 04-08). Data is fetched
 * server-side and passed in as serializable props; this stays a client island
 * because the hero panel, radar, and tooltip tokens are interactive.
 *
 * Composition: hero band → [Skills | Achievements rail] → full-width
 * certificate shelf. When a learner has no skills yet, the two-column grid
 * collapses and achievements render full-width so the rail never floats alone.
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

  const unlockedSet = useMemo(
    () => new Set(content.achievements.map((a) => a.id)),
    [content.achievements]
  );
  const sortedAchievements = useMemo(
    () =>
      [...content.deployedAchievements].sort((a, b) => {
        const ae = unlockedSet.has(a.id) ? 0 : 1;
        const be = unlockedSet.has(b.id) ? 0 : 1;
        return ae - be;
      }),
    [content.deployedAchievements, unlockedSet]
  );

  // Tap-to-show tooltip state (mobile touch), same as the dashboard strip.
  const [openTip, setOpenTip] = useState<string | null>(null);
  useEffect(() => {
    if (!openTip) return;
    const timer = setTimeout(() => setOpenTip(null), 3000);
    return () => clearTimeout(timer);
  }, [openTip]);

  const hasSkills = content.skills.length > 0;

  /* Achievements — dashboard tokens with the dashboard tooltip (description
     on hover/tap). The hero strip no longer carries an achievements stat, so
     the heading's count chip is the single source of that number. */
  const achievementsSection = (
    <section aria-label={tGam("achievements")}>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-display text-lg font-black tracking-[-0.25px]">
          {tGam("achievements")}
        </h2>
        <span className="cc-section-count">
          {content.achievements.length}/{content.deployedAchievements.length}
        </span>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <Tooltip.Provider delayDuration={0} skipDelayDuration={150}>
          <div className="ach-rail-grid">
            {sortedAchievements.map((ach) => {
              const earned = unlockedSet.has(ach.id);
              const isSol = earned && ach.solTier;
              const tipId = `prof-${ach.id}`;
              return (
                <AchievementToken
                  key={ach.id}
                  glyph={ach.glyph}
                  name={ach.name}
                  hint={ach.description}
                  state={earned ? (isSol ? "sol" : "earned") : "locked"}
                  isOpen={openTip === tipId}
                  onTap={() =>
                    setOpenTip((prev) => (prev === tipId ? null : tipId))
                  }
                  onOpenChange={(open) => setOpenTip(open ? tipId : null)}
                />
              );
            })}
          </div>
        </Tooltip.Provider>
      </div>
    </section>
  );

  return (
    <div className="space-y-8">
      {/* ─── Profile Hero Panel (dash-panel) — the page anchor ─── */}
      <ProfileHeroPanel
        user={user}
        stats={stats}
        showVisibilityBadge={showVisibilityBadge}
        streak={streak}
      />

      {/* ─── Skills — full-width, open like every other section. ─── */}
      {hasSkills && (
        <section aria-label={t("skills")}>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-lg font-black tracking-[-0.25px]">
              {t("skills")}
            </h2>
            <span className="cc-section-count">{content.skills.length}</span>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <SkillRadar
              skills={content.skills}
              totalLessons={content.totalLessons}
              className="mx-auto w-full max-w-[520px] !border-0 !bg-transparent !p-0 !shadow-none"
            />
          </div>
        </section>
      )}

      {/* ─── Achievements — full-width token row. ─── */}
      {achievementsSection}

      {/* ─── Certificates — full-width shelf. Slim diploma cards (shared
          CertificateCard, per-card eyebrow hidden); stretched-link keeps the
          explorer pill's own anchor legal (no <a> nesting). ─── */}
      {content.certificates.length > 0 ? (
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
      ) : (
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
