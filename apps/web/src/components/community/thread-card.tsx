"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CaretUp, ChatCircle, PushPin } from "@phosphor-icons/react";
import { LevelBadge } from "@/components/gamification/level-badge";
import { cn } from "@/lib/utils";
import { ThreadStatusBadge } from "./thread-status-badge";
import { LessonContextChip, type ThreadContext } from "./lesson-context-chip";

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
  /** Resolved course/lesson provenance, when the thread was started from one. */
  context?: ThreadContext | null;
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

/**
 * A single dense row in a thread list — HN/LeetCode density rather than the
 * tall card this used to be (a full-height card with a stacked ▲/score/▼ rail
 * turned a ten-thread feed into a page of air).
 *
 * Voting collapses to one ▲ + count toggle; the full up/down rail belongs to
 * the thread detail page, where there is room to read before you judge.
 */
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
  context,
  onVote,
}: ThreadCardProps) {
  const t = useTranslations("community");
  const href = categorySlug
    ? `/community/${categorySlug}/${slug}`
    : `/community/general/${slug}`;

  return (
    <div className="flex items-start gap-3 border-b border-[var(--border-default)] px-2 py-2.5 transition-colors last:border-b-0 hover:bg-[var(--card-hover)]">
      <button
        type="button"
        onClick={() => onVote(userVote === 1 ? 0 : 1)}
        aria-label={t("upvote")}
        aria-pressed={userVote === 1}
        className={cn(
          "mt-0.5 flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-1 text-xs font-bold tabular-nums transition-colors hover:bg-[var(--primary-dim)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
          userVote === 1
            ? "text-[var(--primary)]"
            : "text-[var(--text-2)] hover:text-[var(--primary)]"
        )}
      >
        <CaretUp size={12} weight={userVote === 1 ? "fill" : "bold"} />
        {voteScore}
      </button>

      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isPinned && (
            <PushPin
              size={12}
              weight="fill"
              className="shrink-0 text-[var(--primary)]"
              aria-hidden="true"
            />
          )}
          <Link
            href={href}
            className="truncate font-display text-sm font-bold text-[var(--text)] transition-colors hover:text-[var(--primary)]"
          >
            {title}
          </Link>
          <ThreadStatusBadge type={type} isSolved={isSolved} />
          {context && <LessonContextChip context={context} />}
        </div>

        <div className="flex shrink-0 items-center gap-2.5 font-mono text-[11px] text-[var(--text-2)]">
          <span className="flex items-center gap-1">
            {author.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt=""
                width={14}
                height={14}
                className="h-3.5 w-3.5 rounded-full"
              />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full bg-[var(--primary-dim)]" />
            )}
            <span className="max-w-[10rem] truncate">
              {author.username || t("anonymous")}
            </span>
            {author.level > 0 && <LevelBadge level={author.level} size="xs" />}
          </span>
          <span>{timeAgo(createdAt, t)}</span>
          <span className="flex items-center gap-1">
            <ChatCircle size={11} aria-hidden="true" />
            {answerCount}
          </span>
        </div>
      </div>
    </div>
  );
}
