"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Plus, Search, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryFilter } from "@/components/community/category-filter";
import { ThreadList } from "@/components/community/thread-list";
import { useThreads } from "@/lib/hooks/use-threads";

export default function CommunityPage() {
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;

  const [category, setCategory] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filters = useMemo(
    () => ({
      category: category !== "all" ? category : undefined,
      search: searchQuery || undefined,
    }),
    [category, searchQuery],
  );

  const { threads, loading, error, hasMore, loadMore } = useThreads(filters);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)]">
            <MessageSquare className="h-5 w-5 text-[#55E9AB]" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--c-text)]">
            Community
          </h1>
        </div>
        <p className="text-sm text-[var(--c-text-2)]">
          Ask questions, share projects, and connect with fellow builders.
        </p>
      </div>

      {/* Actions bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CategoryFilter value={category} onChange={setCategory} />

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-text-muted)]" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search threads..."
              className="h-9 w-48 pl-8 text-xs"
            />
          </form>

          {wallet ? (
            <Link href={`/${locale}/community/new`}>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                New Thread
              </Button>
            </Link>
          ) : (
            <Button size="sm" variant="outline" disabled className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-[2px] border border-[#EF4444]/20 bg-[#EF4444]/5 px-4 py-3 text-sm text-[#EF4444]">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && threads.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] skeleton-shimmer"
            />
          ))}
        </div>
      ) : (
        <>
          <ThreadList threads={threads} wallet={wallet} />

          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                disabled={loading}
                className="font-mono text-[10px] uppercase tracking-wider"
              >
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
