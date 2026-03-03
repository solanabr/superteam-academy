"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDiscussionThreads } from "@/lib/hooks/use-discussion-threads";
import { discussionApi } from "@/lib/services/discussion-api";
import { ThreadList } from "@/components/discussions/thread-list";
import { NewThreadDialog } from "@/components/discussions/new-thread-dialog";
import type {
  ThreadCategory,
  ThreadListParams,
  CreateThreadPayload,
  VoteValue,
} from "@/types";

type SortKey = "newest" | "top" | "mostCommented";

export default function DiscussionsPage() {
  const t = useTranslations("discussions");
  const router = useRouter();
  const [category, setCategory] = useState<ThreadCategory | undefined>();
  const [sort, setSort] = useState<SortKey>("newest");
  const [search, setSearch] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);

  const params = useMemo<ThreadListParams>(
    () => ({
      scope: "community",
      category,
      sort,
      search: search || undefined,
    }),
    [category, sort, search],
  );

  const {
    threads,
    isLoading,
    nextCursor,
    isLoadingMore,
    loadMore,
    voteThread,
    refresh,
  } = useDiscussionThreads(params);

  const handleVote = useCallback(
    (threadId: string, value: VoteValue) => {
      voteThread(threadId, value);
    },
    [voteThread],
  );

  const handleNewThread = useCallback(
    async (data: CreateThreadPayload) => {
      try {
        const result = await discussionApi.createThread(data);
        refresh();
        router.push(`/discussions/${result.id}`);
      } catch {
        // swallow
      }
    },
    [refresh, router],
  );

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Heading */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold sm:text-4xl">
              {t("forumTitle")}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {t("forumDescription")}
            </p>
          </div>
          <button
            onClick={() => setShowNewThread(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 whitespace-nowrap"
          >
            + {t("newThread")}
          </button>
        </div>

        <ThreadList
          threads={threads}
          isLoading={isLoading}
          nextCursor={nextCursor}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMore}
          onVote={handleVote}
          onCategoryChange={setCategory}
          onSortChange={setSort}
          onSearchChange={setSearch}
          category={category}
          sort={sort}
          search={search}
        />
      </div>

      {showNewThread && (
        <NewThreadDialog
          onClose={() => setShowNewThread(false)}
          onSubmit={handleNewThread}
        />
      )}
    </>
  );
}
