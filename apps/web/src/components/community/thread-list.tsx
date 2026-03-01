"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ThreadCard } from "./thread-card";
import { ThreadFilters } from "./thread-filters";
import { useThreads } from "@/hooks/use-threads";
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

  const handleVote = useCallback(
    async (threadId: string, value: 0 | 1 | -1) => {
      try {
        await fetch("/api/community/votes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId, value }),
        });
      } catch {
        // Vote failed silently — optimistic UI will revert on next fetch
      }
    },
    []
  );

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
          <ThreadCard
            key={thread.id}
            id={thread.id}
            title={thread.title}
            slug={thread.slug}
            shortId={thread.short_id}
            type={thread.type as "question" | "discussion"}
            isSolved={thread.is_solved}
            isPinned={thread.is_pinned}
            voteScore={thread.vote_score}
            userVote={thread.userVote}
            answerCount={thread.answer_count}
            author={thread.author}
            categorySlug={thread.category?.slug}
            createdAt={thread.created_at}
            onVote={(value) => handleVote(thread.id, value)}
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
