"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { useVote } from "@/hooks/use-vote";
import { useThreadContexts } from "@/hooks/use-thread-contexts";
import { VoteButton } from "@/components/community/vote-button";
import { LessonContextChip } from "@/components/community/lesson-context-chip";
import { ThreadStatusBadge } from "@/components/community/thread-status-badge";
import { AnswerCard } from "@/components/community/answer-card";
import { AnswerEditor } from "@/components/community/answer-editor";
import { FlagButton } from "@/components/community/flag-button";
import { DeleteButton } from "@/components/community/delete-button";
import { LevelBadge } from "@/components/gamification/level-badge";

interface Author {
  username: string | null;
  avatar_url: string | null;
  level: number;
}

interface Answer {
  id: string;
  body: string;
  is_accepted: boolean;
  vote_score: number;
  author_id: string;
  author: Author;
  userVote: 1 | -1 | null;
  created_at: string;
}

interface ThreadData {
  id: string;
  title: string;
  body: string;
  type: "question" | "discussion";
  is_solved: boolean;
  is_pinned: boolean;
  is_locked: boolean;
  vote_score: number;
  view_count: number;
  answer_count: number;
  author_id: string;
  author: Author;
  category: { id: string; name: string; slug: string } | null;
  /** Scope the thread was created under — drives the provenance chip. The
   * route selects `*`, so these already ride the existing payload. */
  course_id: string | null;
  lesson_id: string | null;
  userVote: 1 | -1 | null;
  answers: Answer[];
  created_at: string;
}

interface ThreadDetailClientProps {
  shortId: string;
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

function VotableAnswerCard({
  answer,
  isThreadAuthor,
  currentUserId,
  onAccept,
  onDelete,
}: {
  answer: Answer;
  isThreadAuthor: boolean;
  currentUserId?: string;
  onAccept: () => void;
  onDelete: () => void;
}) {
  const { user } = useAuth();
  const { score, userVote, isVoting, handleVote } = useVote({
    targetType: "answer",
    targetId: answer.id,
    initialScore: answer.vote_score,
    initialUserVote: answer.userVote,
  });

  return (
    <AnswerCard
      answer={{ ...answer, vote_score: score, userVote }}
      isThreadAuthor={isThreadAuthor}
      currentUserId={currentUserId}
      onVote={handleVote}
      onAccept={onAccept}
      onDelete={onDelete}
      disabled={!user || isVoting}
    />
  );
}

export function ThreadDetailClient({ shortId }: ThreadDetailClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations("community");
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Same provenance resolution the feed uses, for a single thread.
  const contexts = useThreadContexts(thread ? [thread] : []);
  const context = thread ? contexts.get(thread.id) : undefined;

  /**
   * `silent` refetches in place, without dropping the page back to the
   * full-screen spinner. Used after posting or accepting an answer: the
   * learner stays where they are and the list simply grows.
   */
  const fetchThread = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        // A freshly posted answer must be in this response. Without
        // `no-store` the browser can serve the pre-post copy of the GET, and
        // the answer appears not to have been saved at all.
        const res = await fetch(`/api/community/threads/${shortId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Thread not found");
        const data = await res.json();
        setThread(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load thread");
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [shortId]
  );

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  const threadVote = useVote({
    targetType: "thread",
    targetId: thread?.id ?? "",
    initialScore: thread?.vote_score ?? 0,
    initialUserVote: thread?.userVote ?? null,
  });

  const handleAccept = async (answerId: string) => {
    const res = await fetch(`/api/community/answers/${answerId}/accept`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      console.error(
        "[community] accept failed:",
        data?.error || res.statusText
      );
    }
    fetchThread(true);
  };

  const handleAnswerPosted = () => {
    fetchThread(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="sol-spinner" aria-hidden="true" />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-[var(--text-2)]">{error || t("noResults")}</p>
        <Link
          href="/community"
          className="mt-2 inline-block text-[var(--primary)] hover:underline"
        >
          {t("backToCommunity")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Breadcrumb */}
      <Link
        href={
          thread.category ? `/community/${thread.category.slug}` : "/community"
        }
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-2)] transition-colors hover:text-[var(--primary)]"
      >
        <ArrowLeft size={14} />
        {thread.category?.name || t("title")}
      </Link>

      {/* The question, in the same anatomy as an answer: WHO → WHAT →
          ACTIONS, one column, no rail. The floating vote column used to sit
          apart from everything it belonged to; thread voting now lives in the
          inline action row, exactly like the answers below. */}
      <article>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-extrabold text-[var(--text)]">
            {thread.title}
          </h1>
          <ThreadStatusBadge type={thread.type} isSolved={thread.is_solved} />
        </div>

        {/* Provenance — one chip row under the title, linking back to the
            lesson the question came from. */}
        {context && (
          <div className="mt-2">
            <LessonContextChip context={context} />
          </div>
        )}

        {/* Meta — author, reputation, time, views on one tight line. */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-2)]">
          {thread.author.username ? (
            <Link
              href={`/profile/${encodeURIComponent(thread.author.username)}`}
              className="flex items-center gap-1.5 transition-colors hover:text-[var(--primary)]"
            >
              {thread.author.avatar_url ? (
                <Image
                  src={thread.author.avatar_url}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-full"
                />
              ) : (
                <div className="h-5 w-5 rounded-full bg-[var(--primary-dim)]" />
              )}
              <span className="text-sm font-semibold text-[var(--text)]">
                {thread.author.username}
              </span>
            </Link>
          ) : (
            <span className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-[var(--primary-dim)]" />
              <span className="text-sm font-semibold text-[var(--text)]">
                {t("anonymous")}
              </span>
            </span>
          )}
          {thread.author.level > 0 && (
            <LevelBadge level={thread.author.level} size={30} />
          )}
          <span>{timeAgo(thread.created_at, t)}</span>
          <span>{t("views", { count: thread.view_count })}</span>
        </div>

        {/* Body — heading sizes are stepped DOWN explicitly. `prose-sm`
            scales the body copy but still renders an authored `#`/`##`
            larger than the page h1 above, so the question's own markdown
            could out-shout the question's title. */}
        <div className="prose prose-sm mt-3 max-w-none text-[var(--text)] dark:prose-invert prose-headings:font-display prose-headings:font-bold prose-h1:text-base prose-h2:text-[15px] prose-h3:text-sm prose-h4:text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {thread.body}
          </ReactMarkdown>
        </div>

        {/* Action row — the answers' idiom, applied to the question. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-2)]">
          <VoteButton
            score={threadVote.score}
            userVote={threadVote.userVote}
            onVote={threadVote.handleVote}
            disabled={!user || threadVote.isVoting}
            layout="horizontal"
          />
          {user && <FlagButton threadId={thread.id} />}
          {user?.id === thread.author_id && (
            <DeleteButton
              threadId={thread.id}
              onDeleted={() =>
                router.push(
                  thread.category
                    ? `/community/${thread.category.slug}`
                    : "/community"
                )
              }
            />
          )}
        </div>
      </article>

      {/* Answers — comment-thread order: header, composer, sort line, then the
          flat list. The composer sits at the TOP because that is where you act;
          burying it under N answers made replying a scroll hunt. */}
      <div className="mt-6 border-t border-[var(--border-default)] pt-6">
        <h2 className="mb-3 font-display text-lg font-bold text-[var(--text)]">
          {t("answersCount", { count: thread.answers.length })}
        </h2>

        {user && !thread.is_locked && (
          <AnswerEditor
            threadId={thread.id}
            onAnswerPosted={handleAnswerPosted}
          />
        )}

        {thread.answers.length > 0 && (
          <>
            {/* Sort is a fixed "Latest" for v1 — answers already come back
                accepted-first, then by score. Wired to real state when the
                answers list gets its own sort control. */}
            <p className="mt-4 text-xs text-[var(--text-2)]">
              {t("sortBy")}{" "}
              <span className="font-semibold text-[var(--text)]">
                {t("sortLatest")}
              </span>
            </p>

            {/* Flat list: no per-item frame, hairline dividers only. */}
            <div className="mt-1 divide-y divide-[var(--border-default)]">
              {thread.answers.map((answer) => (
                <VotableAnswerCard
                  key={answer.id}
                  answer={answer}
                  isThreadAuthor={user?.id === thread.author_id}
                  currentUserId={user?.id}
                  onAccept={() => handleAccept(answer.id)}
                  onDelete={() => fetchThread(true)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
