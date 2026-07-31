"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useThreads } from "@/hooks/use-threads";
import { useThreadContexts } from "@/hooks/use-thread-contexts";
import { useVote } from "@/hooks/use-vote";
import { Button } from "@/components/ui/button";
import { ThreadCard } from "./thread-card";
import { ThreadFilters } from "./thread-filters";
import type { ThreadContext } from "./lesson-context-chip";

interface ThreadScope {
  categorySlug?: string;
  courseId?: string;
  lessonId?: string;
}

interface ThreadListProps {
  scope?: ThreadScope;
  showFilters?: boolean;
  emptyMessage?: string;
  /**
   * Reports how many threads are currently loaded so a caller can label a
   * collapsed section header (#942). `hasMore` is true when the page is
   * capped, so the label can render "20+" instead of a wrong exact total.
   */
  onCountChange?: (count: number, hasMore: boolean) => void;
  /**
   * Bump to refetch — the lesson pane's inline composer uses it to show a
   * freshly posted thread without a full navigation.
   */
  refreshToken?: number;
  /**
   * Resolve and render each thread's course/lesson provenance chip. Off inside
   * a lesson embed, where every thread shares that lesson's scope and the chip
   * would repeat the page you are already on.
   */
  showContext?: boolean;
}

interface ListThread {
  id: string;
  title: string;
  slug: string;
  short_id: string;
  type: string;
  is_solved: boolean;
  is_pinned: boolean;
  vote_score: number;
  userVote: 1 | -1 | null;
  answer_count: number;
  author: {
    username: string | null;
    avatar_url: string | null;
    level: number;
  };
  category?: { slug: string } | null;
  created_at: string;
}

/** Wrapper that gives each ThreadCard its own optimistic vote state. */
function VotableThreadCard({
  thread,
  context,
}: {
  thread: ListThread;
  context?: ThreadContext | null;
}) {
  const { score, userVote, handleVote } = useVote({
    targetType: "thread",
    targetId: thread.id,
    initialScore: thread.vote_score,
    initialUserVote: thread.userVote,
  });

  return (
    <ThreadCard
      id={thread.id}
      title={thread.title}
      slug={thread.slug}
      shortId={thread.short_id}
      type={thread.type as "question" | "discussion"}
      isSolved={thread.is_solved}
      isPinned={thread.is_pinned}
      voteScore={score}
      userVote={userVote}
      answerCount={thread.answer_count}
      author={thread.author}
      categorySlug={thread.category?.slug}
      createdAt={thread.created_at}
      context={context}
      onVote={handleVote}
    />
  );
}

export function ThreadList({
  scope,
  showFilters = true,
  emptyMessage,
  onCountChange,
  refreshToken,
  showContext = false,
}: ThreadListProps) {
  const t = useTranslations("community");
  const [sort, setSort] = useState("latest");
  const [type, setType] = useState<string | undefined>(undefined);
  // "Course questions" is a scope filter, not a type — it stacks with the
  // type pills rather than replacing them.
  const [courseOnly, setCourseOnly] = useState(false);

  const { threads, isLoading, error, hasMore, loadMore } = useThreads({
    scope,
    sort,
    type,
    courseOnly,
    refreshToken,
  });

  const contexts = useThreadContexts(showContext ? threads : []);

  useEffect(() => {
    if (isLoading) return;
    onCountChange?.(threads.length, hasMore);
  }, [isLoading, threads.length, hasMore, onCountChange]);

  return (
    <div className="space-y-3">
      {showFilters && (
        <ThreadFilters
          sort={sort}
          onSortChange={setSort}
          type={type}
          onTypeChange={setType}
          courseOnly={courseOnly}
          onCourseOnlyChange={setCourseOnly}
          showCourseFilter={showContext}
        />
      )}

      {error && (
        <p className="py-8 text-center text-sm text-[var(--danger)]">{error}</p>
      )}

      {!isLoading && threads.length === 0 && !error && (
        <p className="py-12 text-center text-sm text-[var(--text-2)]">
          {emptyMessage || t("noThreads")}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--card)] empty:hidden">
        {threads.map((thread) => (
          <VotableThreadCard
            key={thread.id}
            thread={thread}
            context={contexts.get(thread.id) ?? null}
          />
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="sol-spinner" aria-hidden="true" />
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="flex justify-center pt-4">
          <Button variant="secondary" onClick={loadMore}>
            {t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
