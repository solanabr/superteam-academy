"use client";

import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ThreadCard } from "./thread-card";
import type { ThreadListItem, ThreadCategory, VoteValue } from "@/types";

type SortKey = "newest" | "top" | "mostCommented";

const CATEGORIES: ThreadCategory[] = [
  "Help",
  "Show & Tell",
  "Ideas",
  "General",
];

interface ThreadListProps {
  threads: ThreadListItem[];
  isLoading: boolean;
  nextCursor: string | null;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onVote: (threadId: string, value: VoteValue) => void;
  onCategoryChange: (category: ThreadCategory | undefined) => void;
  onSortChange: (sort: SortKey) => void;
  onSearchChange: (search: string) => void;
  category?: ThreadCategory;
  sort: SortKey;
  search: string;
}

export function ThreadList({
  threads,
  isLoading,
  nextCursor,
  isLoadingMore,
  onLoadMore,
  onVote,
  onCategoryChange,
  onSortChange,
  onSearchChange,
  category,
  sort,
  search,
}: ThreadListProps) {
  const t = useTranslations("discussions");

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-48 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <select
          value={category ?? "all"}
          onChange={(e) =>
            onCategoryChange(
              e.target.value === "all"
                ? undefined
                : (e.target.value as ThreadCategory),
            )
          }
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">{t("allCategories")}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="newest">{t("sortNewest")}</option>
          <option value="top">{t("sortTop")}</option>
          <option value="mostCommented">{t("sortMostCommented")}</option>
        </select>
      </div>

      {/* Thread list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : threads.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {t("noThreads")}
        </p>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} onVote={onVote} />
          ))}
        </div>
      )}

      {/* Load more */}
      {nextCursor && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {isLoadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("loadMore")
            )}
          </button>
        </div>
      )}
    </div>
  );
}
