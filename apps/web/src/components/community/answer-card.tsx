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
import { cn } from "@/lib/utils";
import { LevelBadge } from "@/components/gamification/level-badge";

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
        "flex gap-4 rounded-lg border p-4",
        answer.is_accepted
          ? "border-[var(--primary)] bg-[var(--primary-dim)]"
          : "border-[var(--border-default)] bg-[var(--card)]"
      )}
    >
      <div className="flex flex-col items-center gap-1">
        <VoteButton
          score={answer.vote_score}
          userVote={answer.userVote}
          onVote={onVote}
          disabled={disabled}
          size="sm"
        />
        {isThreadAuthor && answer.author_id !== currentUserId && (
          <AcceptAnswerButton
            isAccepted={answer.is_accepted}
            onAccept={onAccept}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {answer.is_accepted && (
          <span className="mb-2 inline-flex items-center text-xs font-semibold text-[var(--primary)]">
            {t("acceptedAnswer")}
          </span>
        )}

        <div className="prose prose-sm max-w-none text-[var(--text)] dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {answer.body}
          </ReactMarkdown>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-[var(--text-2)]">
          <span className="flex items-center gap-1.5">
            {answer.author.avatar_url ? (
              <Image
                src={answer.author.avatar_url}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 rounded-full"
              />
            ) : (
              <div className="h-4 w-4 rounded-full bg-[var(--primary-dim)]" />
            )}
            <span>{answer.author.username || t("anonymous")}</span>
            {answer.author.level > 0 && (
              <LevelBadge level={answer.author.level} size="xs" />
            )}
          </span>
          <span>{timeAgo(answer.created_at, t)}</span>
          <FlagButton answerId={answer.id} />
          {isAuthor && onDelete && (
            <DeleteButton answerId={answer.id} onDeleted={onDelete} />
          )}
        </div>
      </div>
    </div>
  );
}
