"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowLeft, Wallet } from "lucide-react";
import { ThreadDetail } from "@/components/community/thread-detail";
import { ReplyItem } from "@/components/community/reply-item";
import { ReplyForm } from "@/components/community/reply-form";
import { useThreadDetail } from "@/lib/hooks/use-thread-detail";
import { isAdmin as checkIsAdmin } from "@/lib/auth/admin";

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "en";
  const threadId = params.threadId as string;
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;
  const adminStatus = wallet ? checkIsAdmin(wallet) : false;

  const { thread, replies, loading, error, refresh } = useThreadDetail(threadId);

  const topLevelReplies = replies.filter((r) => !r.parent_reply_id);

  const handleDelete = async () => {
    if (!wallet || !thread) return;
    const confirmed = window.confirm("Remove this thread? This action sets the content to [deleted].");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/community/threads/${thread.id}/moderate`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });

      if (res.ok) {
        router.push(`/${locale}/community`);
      }
    } catch (error) {
      console.error("[ThreadPage] Failed to moderate thread:", error);
    }
  };

  const handleAcceptAnswer = async (replyId: string) => {
    if (!wallet || !thread) return;

    try {
      const res = await fetch(`/api/community/threads/${thread.id}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyId, wallet }),
      });

      if (res.ok) {
        refresh();
      }
    } catch (error) {
      console.error("[ThreadPage] Failed to accept answer:", error);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-8 w-48 rounded-[2px] skeleton-shimmer" />
          <div className="h-64 rounded-[2px] border border-[var(--c-border-subtle)] skeleton-shimmer" />
          <div className="h-32 rounded-[2px] border border-[var(--c-border-subtle)] skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-20 pt-24 text-center">
        <h1 className="mb-2 text-lg font-semibold text-[var(--c-text)]">
          Thread Not Found
        </h1>
        <p className="mb-6 text-sm text-[var(--c-text-2)]">
          {error || "This thread does not exist or has been removed."}
        </p>
        <Link href={`/${locale}/community`}>
          <button className="font-mono text-xs uppercase tracking-wider text-[var(--c-text-2)] transition-colors hover:text-[var(--c-text)]">
            Back to Community
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href={`/${locale}/community`}
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--c-text-2)] transition-colors hover:text-[var(--c-text)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Community
      </Link>

      {/* Thread */}
      <ThreadDetail
        thread={thread}
        wallet={wallet}
        isAdmin={adminStatus}
        onDelete={adminStatus ? handleDelete : undefined}
      />

      {/* Replies section */}
      <div className="mt-8">
        <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[4px] text-[var(--c-text-muted)]">
          {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
        </h2>

        {topLevelReplies.length > 0 ? (
          <div className="space-y-3">
            {topLevelReplies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                allReplies={replies}
                wallet={wallet}
                threadId={thread.id}
                threadAuthor={thread.author_wallet}
                onAcceptAnswer={
                  wallet === thread.author_wallet ? handleAcceptAnswer : undefined
                }
                onReplyAdded={refresh}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-8 text-center">
            <p className="text-sm text-[var(--c-text-2)]">
              No replies yet. Be the first to respond.
            </p>
          </div>
        )}
      </div>

      {/* Reply form */}
      <div className="mt-8">
        <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[4px] text-[var(--c-text-muted)]">
          Add Reply
        </h2>

        {wallet ? (
          <ReplyForm threadId={thread.id} wallet={wallet} onSuccess={refresh} />
        ) : (
          <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-6 text-center">
            <Wallet className="mx-auto mb-3 h-6 w-6 text-[var(--c-text-muted)]" />
            <p className="text-sm text-[var(--c-text-2)]">
              Connect your wallet to reply.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
