"use client";

import { useTranslations } from "next-intl";
import { GithubLogo, TwitterLogo, DiscordLogo } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/gamification/level-badge";
import { VerifiedBadge } from "@/components/profile/verified-badge";
import { xpToNextLevel } from "@/lib/gamification/xp";

interface ProfileHeroPanelProps {
  user: {
    username: string;
    /** Admin-set editorial name shown instead of `username` (#997). */
    displayName?: string | null;
    /** Admin-granted verified-teacher badge (#997). */
    verified?: boolean;
    bio: string;
    avatarUrl: string;
    joinedAt: Date;
    socialLinks: {
      twitter?: string;
      github?: string;
      discord?: string;
    };
    isPublic?: boolean;
  };
  stats: {
    totalXp: number;
    level: number;
    coursesCompleted: number;
    certificatesCount: number;
    lessonsCompleted: number;
  };
  /** Show public/private badge (only on own profile) */
  showVisibilityBadge?: boolean;
  /**
   * Day-streak stat (own profile only — streak data is own-row under RLS).
   * LX-B13 (#583): this stats strip is the streak's home at launch; it is
   * deliberately absent from the dashboard hero and header surfaces.
   */
  streak?: { currentStreak: number; longestStreak: number; available: boolean };
}

export function ProfileHeroPanel({
  user,
  stats,
  showVisibilityBadge = false,
  streak,
}: ProfileHeroPanelProps) {
  const t = useTranslations("profile");
  const { xpInCurrentLevel, xpRequiredForNext, progressPercent } =
    xpToNextLevel(stats.totalXp);
  // Editorial name when an admin has set one (#997), generated one otherwise.
  const displayName = user.displayName?.trim() || user.username;

  return (
    <div className="dash-panel">
      <div className="dash-panel-amb" aria-hidden="true" />

      {/* Top: Identity (left) + XP (right) */}
      <div className="prof-top">
        {/* LEFT — avatar, name, bio, socials */}
        <div className="prof-identity">
          <Avatar className="h-[80px] w-[80px] shrink-0 border-[3px] border-border">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={displayName} />
            )}
            <AvatarFallback className="font-display text-2xl font-black">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="flex items-center gap-1.5 font-display text-[24px] font-black leading-tight tracking-[-0.5px]">
                {displayName}
                {user.verified && <VerifiedBadge className="h-5 w-5" />}
              </h1>
              {showVisibilityBadge && (
                <span className="inline-flex items-center gap-1 rounded-full border border-success px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success [background:var(--success-bg)]">
                  {user.isPublic ? t("publicProfile") : t("privateProfile")}
                </span>
              )}
            </div>

            <p className="break-all font-body text-[14px] leading-relaxed text-text-2">
              {user.bio || t("noBio")}
            </p>

            <p className="font-mono text-[11px] text-text-3">
              {t("joinedOn", {
                date: user.joinedAt.toLocaleDateString(),
              })}
            </p>

            {/* Social Links */}
            {(user.socialLinks.twitter ||
              user.socialLinks.github ||
              user.socialLinks.discord) && (
              <div className="flex items-center gap-2 pt-1">
                {user.socialLinks.twitter && (
                  <a
                    href={`https://x.com/${user.socialLinks.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-full border border-border bg-[var(--input)] px-2.5 py-1 font-mono text-[11px] font-medium text-text-2 transition-colors hover:text-text"
                  >
                    <TwitterLogo size={12} weight="bold" aria-hidden="true" />X
                  </a>
                )}
                {user.socialLinks.github && (
                  <a
                    href={`https://github.com/${user.socialLinks.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-full border border-border bg-[var(--input)] px-2.5 py-1 font-mono text-[11px] font-medium text-text-2 transition-colors hover:text-text"
                  >
                    <GithubLogo size={12} weight="bold" aria-hidden="true" />
                    GitHub
                  </a>
                )}
                {user.socialLinks.discord && (
                  <span className="flex items-center gap-1 rounded-full border border-border bg-[var(--input)] px-2.5 py-1 font-mono text-[11px] font-medium text-text-2">
                    <DiscordLogo size={12} weight="bold" aria-hidden="true" />
                    {user.socialLinks.discord}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — XP + Level + Progress */}
        <div className="prof-xp">
          <LevelBadge
            level={stats.level}
            size="xl"
            progress={progressPercent}
          />
          <div>
            <div className="dash-xp-num" aria-label={`${stats.totalXp} XP`}>
              {stats.totalXp.toLocaleString()}
            </div>
            <div className="dash-xp-unit">{t("totalXp")}</div>
            <div className="dash-xp-to">
              <em>
                {xpInCurrentLevel.toLocaleString()} /{" "}
                {xpRequiredForNext.toLocaleString()}
              </em>{" "}
              {t("xpToLevel", { level: stats.level + 1 })}
            </div>
            <div className="dash-xp-track">
              <div
                className="dash-xp-fill"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Stats strip */}
      <div className="prof-stats">
        <div className="prof-stat">
          <div className="prof-stat-val">{stats.coursesCompleted}</div>
          <div className="prof-stat-key">{t("coursesCompleted")}</div>
        </div>
        <div className="prof-stat">
          <div className="prof-stat-val">{stats.lessonsCompleted}</div>
          <div className="prof-stat-key">{t("lessonsCompleted")}</div>
        </div>
        {streak && (
          <div className="prof-stat">
            {/* #731: a failed streak read renders as an em-dash, never a "0"
                that a learner would read as a lost streak. */}
            <div className="prof-stat-val">
              {streak.available ? (
                streak.currentStreak
              ) : (
                <span title={t("streakUnavailable")}>—</span>
              )}
            </div>
            <div className="prof-stat-key">{t("dayStreak")}</div>
          </div>
        )}
      </div>
    </div>
  );
}
