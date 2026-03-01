"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PushPin, ChatCircle } from "@phosphor-icons/react";
import { VoteButton } from "./vote-button";
import { ThreadStatusBadge } from "./thread-status-badge";

interface ThreadCardAuthor {
  username: string | null;
  avatar_url: string | null;
  level: number;
}

interface ThreadCardProps {
  id: string;
  title: string;
  slug: string;
  shortId: string;
  type: "question" | "discussion";
  isSolved: boolean;
  isPinned: boolean;
  voteScore: number;
  userVote: 1 | -1 | null;
  answerCount: number;
  author: ThreadCardAuthor;
  categorySlug?: string;
  createdAt: string;
  onVote: (value: 0 | 1 | -1) => void;
}

function timeAgo(
  dateStr: string,
  t: (key: string, values?: Record<string, number>) => string
): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return t("justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t("daysAgo", { count: days });
  const months = Math.floor(days / 30);
  return t("monthsAgo", { count: months });
}

export function ThreadCard({
  title,
  slug,
  type,
  isSolved,
  isPinned,
  voteScore,
  userVote,
  answerCount,
  author,
  categorySlug,
  createdAt,
  onVote,
}: ThreadCardProps) {
  const t = useTranslations("community");
  const href = categorySlug
    ? `/community/${categorySlug}/${slug}`
    : `/community/general/${slug}`;

  return (
    <div className="flex gap-4 rounded-lg border border-[var(--border-default)] bg-[var(--card)] p-4 transition-colors hover:bg-[var(--card-hover)]">
      <VoteButton
        score={voteScore}
        userVote={userVote}
        onVote={onVote}
        size="sm"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {isPinned && (
            <PushPin
              size={14}
              weight="fill"
              className="shrink-0 text-[var(--primary)]"
            />
          )}
          <Link
            href={href}
            className="line-clamp-1 font-display font-bold text-[var(--text)] transition-colors hover:text-[var(--primary)]"
          >
            {title}
          </Link>
          <ThreadStatusBadge type={type} isSolved={isSolved} />
        </div>

        <div className="mt-1.5 flex items-center gap-3 text-xs text-[var(--text-2)]">
          <span className="flex items-center gap-1.5">
            {author.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 rounded-full"
              />
            ) : (
              <div className="h-4 w-4 rounded-full bg-[var(--primary-dim)]" />
            )}
            <span>{author.username || t("anonymous")}</span>
            {author.level > 0 && (
              <span className="font-semibold text-[var(--level)]">
                {t("level", { level: author.level })}
              </span>
            )}
          </span>
          <span>{timeAgo(createdAt, t)}</span>
          <span className="flex items-center gap-1">
            <ChatCircle size={12} />
            {answerCount}
          </span>
        </div>
      </div>
    </div>
  );
}
