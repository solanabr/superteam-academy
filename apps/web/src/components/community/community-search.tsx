"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { ThreadCard } from "./thread-card";

interface ThreadAuthor {
  username: string | null;
  avatar_url: string | null;
  level: number;
}

interface ThreadCategory {
  id: string;
  name: string;
  slug: string;
}

interface SearchThread {
  id: string;
  title: string;
  slug: string;
  short_id: string;
  type: "question" | "discussion";
  is_solved: boolean;
  is_pinned: boolean;
  vote_score: number;
  answer_count: number;
  created_at: string;
  author: ThreadAuthor;
  category: ThreadCategory | null;
  userVote: 1 | -1 | null;
}

export function CommunitySearch() {
  const t = useTranslations("community");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchThread[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleVote = useCallback(
    async (threadId: string, value: 0 | 1 | -1) => {
      try {
        await fetch("/api/community/votes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId, value }),
        });
      } catch {
        // Vote failed silently
      }
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/community/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(data.threads || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div>
      <div className="relative">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-2)]"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--input)] py-2 pl-9 pr-4 text-sm text-[var(--text)] placeholder:text-[var(--text-2)] focus:border-[var(--primary)] focus:outline-none"
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="mt-4">
          {isSearching ? (
            <div className="flex justify-center py-8">
              <div className="sol-spinner" aria-hidden="true" />
            </div>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-2)]">
              {t("noResults")}
            </p>
          ) : (
            <div className="space-y-2">
              {results.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  id={thread.id}
                  title={thread.title}
                  slug={thread.slug}
                  shortId={thread.short_id}
                  type={thread.type}
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
          )}
        </div>
      )}
    </div>
  );
}
