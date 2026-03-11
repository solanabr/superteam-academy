"use client";

import { useTranslations } from "next-intl";
import { GithubLogo, TwitterLogo, DiscordLogo } from "@phosphor-icons/react";
import type { Achievement } from "@superteam-lms/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/gamification/level-badge";
import { xpToNextLevel } from "@/lib/gamification/xp";
import type { DeployedAchievement } from "@/lib/sanity/queries";

interface ProfileHeroPanelProps {
  user: {
    username: string;
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
  };
  achievements: Achievement[];
  deployedAchievements: DeployedAchievement[];
  /** Show public/private badge (only on own profile) */
  showVisibilityBadge?: boolean;
}

export function ProfileHeroPanel({
  user,
  stats,
  achievements,
  deployedAchievements,
  showVisibilityBadge = false,
}: ProfileHeroPanelProps) {
  const t = useTranslations("profile");
  const { xpInCurrentLevel, xpRequiredForNext, progressPercent } =
    xpToNextLevel(stats.totalXp);

  return (
    <div className="dash-panel">
      <div className="dash-panel-amb" aria-hidden="true" />

      {/* Top: Identity (left) + XP (right) */}
      <div className="prof-top">
        {/* LEFT — avatar, name, bio, socials */}
        <div className="prof-identity">
          <Avatar className="h-[80px] w-[80px] shrink-0 border-[3px] border-border">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.username} />
            )}
            <AvatarFallback className="font-display text-2xl font-black">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[24px] font-black leading-tight tracking-[-0.5px]">
                {user.username}
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
          <LevelBadge level={stats.level} size="xl" />
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
          <div className="prof-stat-val">{stats.certificatesCount}</div>
          <div className="prof-stat-key">{t("certificatesEarned")}</div>
        </div>
        <div className="prof-stat">
          <div className="prof-stat-val">
            {achievements.length}
            <span className="text-[16px] font-bold text-text-3">
              /{deployedAchievements.length}
            </span>
          </div>
          <div className="prof-stat-key">{t("achievementsUnlocked")}</div>
        </div>
      </div>
    </div>
  );
}
