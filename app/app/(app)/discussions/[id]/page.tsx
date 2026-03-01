"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowLeft, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ThreadType = "discussion" | "question";

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

interface CommunityReply {
  id: number;
  threadId: number;
  body: string;
  authorName: string;
  walletAddress: string | null;
  createdAt: string;
}

function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function walletToLabel(wallet: string | null): string {
  if (!wallet) return "Anonymous";
  if (wallet.length < 10) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export default function DiscussionThreadPage() {
  const params = useParams<{ id: string }>();
  const { publicKey } = useWallet();

  const [loading, setLoading] = useState(true);
  const [thread, setThread] = useState<CommunityThread | null>(null);
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const threadId = useMemo(() => {
    const parsed = Number.parseInt(params.id, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [params.id]);

  const fetchThread = useCallback(async () => {
    if (!threadId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/community/threads/${threadId}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        thread?: CommunityThread;
        replies?: CommunityReply[];
        error?: string;
      };

      if (!response.ok || !payload.thread) {
        throw new Error(payload.error ?? "Thread not found.");
      }

      setThread(payload.thread);
      setReplies(payload.replies ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load thread.";
      toast.error(message);
      setThread(null);
      setReplies([]);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    void fetchThread();
  }, [fetchThread]);

  const canReply = replyBody.trim().length >= 2 && !isReplying && Boolean(thread);

  async function onSubmitReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!thread || !canReply) return;

    setIsReplying(true);
    try {
      const response = await fetch(`/api/community/threads/${thread.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: replyBody.trim(),
          authorName: authorName.trim(),
          walletAddress: publicKey?.toBase58() ?? null,
        }),
      });

      const payload = (await response.json()) as {
        reply?: CommunityReply;
        error?: string;
      };

      if (!response.ok || !payload.reply) {
        throw new Error(payload.error ?? "Could not post reply.");
      }

      const createdReply = payload.reply;
      setReplies((current) => [...current, createdReply]);
      setThread((current) =>
        current ? { ...current, replyCount: current.replyCount + 1 } : current
      );
      setReplyBody("");
      setAuthorName("");
      toast.success("Reply posted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not post reply.";
      toast.error(message);
    } finally {
      setIsReplying(false);
    }
  }

  if (!threadId) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border bg-card p-8 text-center">
        <h1 className="font-game text-3xl">Invalid Thread</h1>
        <p className="mt-2 text-muted-foreground">The thread id is not valid.</p>
        <Link href="/discussions" className="mt-5 inline-flex">
          <Button variant="outline">Back to discussions</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-2xl border bg-card p-8 text-center text-muted-foreground">
        Loading thread...
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border bg-card p-8 text-center">
        <h1 className="font-game text-3xl">Thread Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          This discussion may have been removed or never existed.
        </p>
        <Link href="/discussions" className="mt-5 inline-flex">
          <Button variant="outline">Back to discussions</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Link href="/discussions" className="inline-flex">
        <Button variant="ghost" className="-ml-2 gap-1">
          <ArrowLeft className="size-4" />
          Back to Discussions
        </Button>
      </Link>

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant={thread.type === "question" ? "secondary" : "outline"}>
            {thread.type === "question" ? "Question" : "Discussion"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
          </span>
        </div>

        <h1 className="font-game text-4xl leading-tight sm:text-5xl">{thread.title}</h1>

        <p className="mt-4 whitespace-pre-wrap text-sm sm:text-base">{thread.body}</p>

        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquareText className="size-3.5" />
          <span>
            by {thread.authorName || walletToLabel(thread.walletAddress)} on{" "}
            {formatDateTime(thread.createdAt)}
          </span>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 className="font-game text-3xl">Replies</h2>
        {replies.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
            No replies yet. Be the first one to respond.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {replies.map((reply) => (
              <article key={reply.id} className="rounded-xl border p-4">
                <p className="whitespace-pre-wrap text-sm sm:text-base">{reply.body}</p>
                <div className="mt-3 text-xs text-muted-foreground">
                  by {reply.authorName || walletToLabel(reply.walletAddress)} on{" "}
                  {formatDateTime(reply.createdAt)}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 className="font-game text-3xl">Post Reply</h2>
        <form onSubmit={onSubmitReply} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="reply-body" className="mb-2 block">
              Your reply
            </Label>
            <textarea
              id="reply-body"
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              rows={5}
              placeholder="Share your answer, idea, or feedback..."
              maxLength={10000}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Minimum 2 characters.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="reply-author" className="mb-2 block">
                Display Name (optional)
              </Label>
              <Input
                id="reply-author"
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                placeholder="Anonymous"
                maxLength={80}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                variant="pixel"
                className="w-full font-game text-xl"
                disabled={!canReply}
              >
                {isReplying ? "Posting..." : "Post Reply"}
              </Button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
