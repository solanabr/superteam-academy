"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { LevelBadge } from "@/components/gamification/level-badge";
import { cn } from "@/lib/utils";
import { VoteButton } from "./vote-button";
import { AcceptAnswerButton } from "./accept-answer-button";
import { FlagButton } from "./flag-button";
import { DeleteButton } from "./delete-button";

interface Author {
  username: string | null;
  avatar_url: string | null;
  level: number;
}

interface AnswerData {
  id: string;
  body: string;
  is_accepted: boolean;
  vote_score: number;
  author_id: string;
  author: Author;
  userVote: 1 | -1 | null;
  created_at: string;
}

interface AnswerCardProps {
  answer: AnswerData;
  isThreadAuthor: boolean;
  currentUserId?: string;
  onVote: (value: 0 | 1 | -1) => void;
  onAccept: () => void;
  onDelete?: () => void;
  disabled?: boolean;
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

export function AnswerCard({
  answer,
  isThreadAuthor,
  currentUserId,
  onVote,
  onAccept,
  onDelete,
  disabled = false,
}: AnswerCardProps) {
  const isAuthor = currentUserId === answer.author_id;
  const t = useTranslations("community");

  return (
    // A comment, not a card: flat on the page background, no border, no
    // radius, no fill. Separation between answers comes from the list's
    // `divide-y` hairline alone.
    <article
      className={cn(
        "py-4",
        // The accepted answer has no LeetCode equivalent, so it gets the
        // quietest possible distinction: a 2px accent rule down the left edge.
        // `border-l-<color>` is a longhand, so it cannot fight the list's
        // divider colour the way a `border-<color>` shorthand would.
        answer.is_accepted && "border-l-2 border-l-[var(--success)] pl-4"
      )}
    >
      {answer.is_accepted && (
        <span className="mb-1 inline-flex items-center text-xs font-semibold text-[var(--success)]">
          {t("acceptedAnswer")}
        </span>
      )}

      {/* WHO → WHAT → ACTIONS. The avatar is its own column; everything else
          aligns to the NAME, not the avatar. */}
      <div className="flex gap-3">
        {answer.author.avatar_url ? (
          <Image
            src={answer.author.avatar_url}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 rounded-full"
          />
        ) : (
          <div className="h-7 w-7 shrink-0 rounded-full bg-[var(--primary-dim)]" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {answer.author.username ? (
              <Link
                href={`/profile/${encodeURIComponent(answer.author.username)}`}
                className="text-sm font-semibold text-[var(--text)] transition-colors hover:text-[var(--primary)]"
              >
                {answer.author.username}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-[var(--text)]">
                {t("anonymous")}
              </span>
            )}
            {answer.author.level > 0 && (
              <LevelBadge level={answer.author.level} size="xs" />
            )}
          </div>
          <div className="text-xs text-[var(--text-2)]">
            {timeAgo(answer.created_at, t)}
          </div>

          {/* Headings step DOWN explicitly: `prose-sm` scales body copy but
              still renders an authored `#`/`##` larger than the question
              title above. */}
          <div className="prose prose-sm mt-2 max-w-none text-[var(--text)] dark:prose-invert prose-headings:font-display prose-headings:font-bold prose-h1:text-base prose-h2:text-[15px] prose-h3:text-sm prose-h4:text-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {answer.body}
            </ReactMarkdown>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-2)]">
            <VoteButton
              score={answer.vote_score}
              userVote={answer.userVote}
              onVote={onVote}
              disabled={disabled}
              layout="horizontal"
            />
            <FlagButton answerId={answer.id} />
            {isAuthor && onDelete && (
              <DeleteButton answerId={answer.id} onDeleted={onDelete} />
            )}
            {/* Thread author only, and never on their own answer. */}
            {isThreadAuthor && answer.author_id !== currentUserId && (
              <AcceptAnswerButton
                isAccepted={answer.is_accepted}
                onAccept={onAccept}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
