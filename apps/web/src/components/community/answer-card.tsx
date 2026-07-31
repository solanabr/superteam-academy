"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { VoteButton } from "./vote-button";
import { AcceptAnswerButton } from "./accept-answer-button";
import { FlagButton } from "./flag-button";
import { DeleteButton } from "./delete-button";
import { LevelBadge } from "@/components/gamification/level-badge";
import { cn } from "@/lib/utils";

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
    <div
      className={cn(
        "rounded-md border px-4 py-3",
        answer.is_accepted
          ? "border-[var(--primary)] bg-[var(--primary-dim)]"
          : "border-[var(--border-default)] bg-[var(--card)]"
      )}
    >
      {answer.is_accepted && (
        <span className="mb-1.5 inline-flex items-center text-xs font-semibold text-[var(--primary)]">
          {t("acceptedAnswer")}
        </span>
      )}

      {/* Comment anatomy: WHO (identity header) → WHAT (body) → ACTIONS. */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-2)]">
        {answer.author.avatar_url ? (
          <Image
            src={answer.author.avatar_url}
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px] rounded-full"
          />
        ) : (
          <div className="h-[18px] w-[18px] rounded-full bg-[var(--primary-dim)]" />
        )}
        <span className="font-semibold text-[var(--text)]">
          {answer.author.username || t("anonymous")}
        </span>
        {answer.author.level > 0 && (
          <LevelBadge level={answer.author.level} size="xs" />
        )}
        <span aria-hidden="true">·</span>
        <span>{timeAgo(answer.created_at, t)}</span>
      </div>

      {/* Headings step DOWN explicitly: `prose-sm` scales body copy but still
          renders an authored `#`/`##` larger than the question title above. */}
      <div className="prose prose-sm mt-1.5 max-w-none text-[var(--text)] dark:prose-invert prose-headings:font-display prose-headings:font-bold prose-h1:text-base prose-h2:text-[15px] prose-h3:text-sm prose-h4:text-sm">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {answer.body}
        </ReactMarkdown>
      </div>

      {/* Action row: vote cluster + quiet actions, accept last. */}
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
  );
}
