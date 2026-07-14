"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  User,
  TwitterLogo,
  GithubLogo,
  DiscordLogo,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { truncateAddress } from "@/lib/utils";
import type { PublicProfile } from "@/lib/profiles/public-profile";

interface InstructorCardProps {
  /** The course's on-chain `Course.creator` wallet (issue #478). */
  creatorWallet: string;
  /**
   * The wallet's resolved public academy profile (B4), or `null` when there
   * isn't one (no profile yet, private, or deleted) — renders a truncated
   * wallet instead of a blank instructor section.
   */
  profile: PublicProfile | null;
}

/**
 * Course-detail instructor identity (issue #478, B4). Shows the resolved
 * academy profile — avatar, username (linked to the public profile page),
 * bio, socials — when one exists; otherwise falls back to the raw creator
 * wallet, truncated, never blank.
 */
export function InstructorCard({
  creatorWallet,
  profile,
}: InstructorCardProps) {
  const t = useTranslations("courses");
  const locale = useLocale();
  const socials = profile?.socialLinks;
  const hasSocials = Boolean(
    socials && (socials.twitter || socials.github || socials.discord)
  );

  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-9 w-9 shrink-0 border border-border">
        {profile?.avatarUrl && (
          <AvatarImage src={profile.avatarUrl} alt={profile.username} />
        )}
        <AvatarFallback className="text-xs font-bold">
          {profile ? (
            profile.username.slice(0, 2).toUpperCase()
          ) : (
            <User
              size={18}
              weight="duotone"
              className="text-text-3"
              aria-hidden="true"
            />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="font-display text-[13px] font-bold">
          {t("courseBy")}{" "}
          {profile ? (
            <Link
              href={`/${locale}/profile/${encodeURIComponent(profile.username)}`}
              className="text-text underline-offset-2 hover:underline"
            >
              {profile.username}
            </Link>
          ) : (
            <span className="font-mono text-text-3">
              {truncateAddress(creatorWallet)}
            </span>
          )}
        </p>

        {profile?.bio && (
          <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-text-3">
            {profile.bio}
          </p>
        )}

        {hasSocials && (
          <div className="mt-1 flex items-center gap-2.5">
            {socials?.twitter && (
              <a
                href={`https://x.com/${socials.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-medium text-text-3 transition-colors hover:text-text"
              >
                <TwitterLogo size={12} weight="bold" aria-hidden="true" />X
              </a>
            )}
            {socials?.github && (
              <a
                href={`https://github.com/${socials.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-medium text-text-3 transition-colors hover:text-text"
              >
                <GithubLogo size={12} weight="bold" aria-hidden="true" />
                GitHub
              </a>
            )}
            {socials?.discord && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-text-3">
                <DiscordLogo size={12} weight="bold" aria-hidden="true" />
                {socials.discord}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
