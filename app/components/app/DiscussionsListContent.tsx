"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRequireWallet } from "@/hooks/useRequireWallet";
import { MessageSquareText, PlusCircle, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ThreadType = "discussion" | "question";
type ThreadFilter = "all" | ThreadType;

interface CommunityThread {
  id: number;
  type: ThreadType;
  title: string;
  body: string;
  authorName: string;
  walletAddress: string | null;
  createdAt: string;
  replyCount: number;
}

const FILTERS: { value: ThreadFilter; label: string }[] = [
  { value: "all", label: "All threads" },
  { value: "question", label: "Questions" },
  { value: "discussion", label: "Discussions" },
];

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, unitSeconds] of units) {
    if (Math.abs(seconds) >= unitSeconds || unit === "second") {
      return formatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }

  return "just now";
}

function walletToLabel(wallet: string | null): string {
  if (!wallet) return "Anonymous";
  if (wallet.length < 10) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export function DiscussionsListContent() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { requireWallet } = useRequireWallet();

  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ThreadFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [threadType, setThreadType] = useState<ThreadType>("discussion");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    if (!isCreateModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCreateModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isCreateModalOpen]);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (activeFilter !== "all") params.set("type", activeFilter);
      if (debouncedSearch) params.set("q", debouncedSearch);

      const response = await fetch(`/api/community/threads?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        threads?: CommunityThread[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load discussions.");
      }

      setThreads(payload.threads ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load discussions.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, debouncedSearch]);

  useEffect(() => {
    void fetchThreads();
  }, [fetchThreads]);

  const canSubmit = useMemo(() => {
    return title.trim().length >= 5 && body.trim().length >= 10 && !isCreating;
  }, [title, body, isCreating]);

  async function onCreateThread(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    if (!requireWallet()) return;
    setIsCreating(true);

    try {
      const response = await fetch("/api/community/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: threadType,
          title: title.trim(),
          body: body.trim(),
          authorName: authorName.trim(),
          walletAddress: publicKey?.toBase58() ?? null,
        }),
      });

      const payload = (await response.json()) as {
        thread?: CommunityThread;
        error?: string;
      };

      if (!response.ok || !payload.thread) {
        throw new Error(payload.error ?? "Could not create thread.");
      }

      toast.success("Thread created.");
      setTitle("");
      setBody("");
      setAuthorName("");
      setIsCreateModalOpen(false);
      router.push(`/discussions/${payload.thread.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create thread.";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <h1 className="font-game text-4xl sm:text-5xl">Discussions</h1>
        <p className="mt-2 font-game text-muted-foreground">
          Ask questions, start discussions, and help other builders. A lightweight
          Stack Overflow-style community for Superteam Academy.
        </p>
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={activeFilter === filter.value ? "default" : "outline"}
                size="sm"
                className="font-game text-md"
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <div className="flex w-full gap-2 lg:max-w-xl">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9 font-game text-md"
                placeholder="Search threads..."
              />
            </div>
            <Button
              variant="pixel"
              className="shrink-0 font-game text-md"
              onClick={() => {
                if (!requireWallet(() => setIsCreateModalOpen(true))) return;
              }}
            >
              <PlusCircle className="size-4" />
              New Thread
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-md font-game text-muted-foreground">
            Loading discussions...
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-md font-game text-muted-foreground">
            No threads found for this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/discussions/${thread.id}`}
                className="block rounded-xl border p-4 transition-colors hover:bg-accent/40"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={thread.type === "question" ? "secondary" : "outline"} className="font-game text-md">
                      {thread.type === "question" ? "Question" : "Discussion"}
                    </Badge>
                    <span className="font-game text-sm text-muted-foreground">
                      {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
                    </span>
                  </div>
                  <span className="font-game text-xs text-muted-foreground">
                    {formatRelativeTime(thread.createdAt)}
                  </span>
                </div>

                <h3 className="font-game text-2xl leading-tight">{thread.title}</h3>
                <p className="mt-1 line-clamp-2 font-game text-sm text-muted-foreground">{thread.body}</p>

                <div className="mt-3 flex items-center gap-2 font-game text-xs text-muted-foreground">
                  <MessageSquareText className="size-3.5" />
                  <span>
                    by {thread.authorName || walletToLabel(thread.walletAddress)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
            aria-label="Close create thread modal"
          />

          <div className="relative z-10 w-full max-w-2xl rounded-2xl border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <PlusCircle className="size-5 text-yellow-500" />
                <h2 className="font-game text-3xl">Create Thread</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={onCreateThread} className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-1">
                  <Label htmlFor="thread-type" className="mb-2 block font-game">
                    Type
                  </Label>
                  <Select
                    value={threadType}
                    onValueChange={(value) => setThreadType(value as ThreadType)}
                  >
                    <SelectTrigger id="thread-type" className="w-full font-game">
                      <SelectValue placeholder="Pick a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discussion">Discussion</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="thread-title" className="mb-2 block font-game">
                    Title
                  </Label>
                  <Input
                    id="thread-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="font-game"
                    placeholder="e.g. Best way to structure Anchor account validation?"
                    maxLength={160}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="thread-body" className="mb-2 block font-game">
                  Details
                </Label>
                <textarea
                  id="thread-body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Write your question or start the discussion..."
                  required
                  rows={6}
                  maxLength={10000}
                  className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 font-game w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                />
                <p className="mt-1 font-game text-xs text-muted-foreground">
                  Minimum 10 characters.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="thread-author" className="mb-2 block font-game">
                    Display Name (optional)
                  </Label>
                  <Input
                    id="thread-author"
                    className="font-game"
                    value={authorName}
                    onChange={(event) => setAuthorName(event.target.value)}
                    placeholder="Anonymous"
                    maxLength={80}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 font-game"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="pixel"
                    className="flex-1 font-game text-xl"
                    disabled={!canSubmit}
                  >
                    {isCreating ? "Posting..." : "Post Thread"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
