"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ThreadCard } from "./thread-card";
import { ThreadFilters } from "./thread-filters";
import { useThreads } from "@/hooks/use-threads";
import { useVote } from "@/hooks/use-vote";
import { Button } from "@/components/ui/button";

interface ThreadScope {
  categorySlug?: string;
  courseId?: string;
  lessonId?: string;
}

interface ThreadListProps {
  scope?: ThreadScope;
  showFilters?: boolean;
  emptyMessage?: string;
}

/** Wrapper that gives each ThreadCard its own optimistic vote state. */
function VotableThreadCard(props: {
  thread: {
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
  };
}) {
  const { thread } = props;
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
      onVote={handleVote}
    />
  );
}

export function ThreadList({
  scope,
  showFilters = true,
  emptyMessage,
}: ThreadListProps) {
  const t = useTranslations("community");
  const [sort, setSort] = useState("latest");
  const [type, setType] = useState<string | undefined>(undefined);

  const { threads, isLoading, error, hasMore, loadMore } = useThreads({
    scope,
    sort,
    type,
  });

  return (
    <div className="space-y-4">
      {showFilters && (
        <ThreadFilters
          sort={sort}
          onSortChange={setSort}
          type={type}
          onTypeChange={setType}
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

      <div className="space-y-2">
        {threads.map((thread) => (
          <VotableThreadCard key={thread.id} thread={thread} />
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
