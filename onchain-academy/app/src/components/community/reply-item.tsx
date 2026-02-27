"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { VoteButton } from "./vote-button";
import { ReplyForm } from "./reply-form";
import { cn } from "@/lib/utils";
import type { Reply } from "@/lib/supabase/types";

function shortWallet(wallet: string): string {
  if (wallet.length <= 10) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface ReplyItemProps {
  reply: Reply;
  allReplies: Reply[];
  wallet: string | null;
  threadId: string;
  threadAuthor: string;
  depth?: number;
  onAcceptAnswer?: (replyId: string) => void;
  onReplyAdded?: () => void;
}

export function ReplyItem({
  reply,
  allReplies,
  wallet,
  threadId,
  threadAuthor,
  depth = 0,
  onAcceptAnswer,
  onReplyAdded,
}: ReplyItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const nestedReplies = allReplies.filter((r) => r.parent_reply_id === reply.id);
  const canAcceptAnswer = wallet === threadAuthor && !reply.is_accepted_answer;
  const maxDepth = 3;

  return (
    <div
      className={cn(
        "relative",
        depth > 0 && "ml-6 pl-4 border-l border-[var(--c-border-subtle)]",
      )}
    >
      <div
        className={cn(
          "rounded-[2px] p-4 transition-colors",
          reply.is_accepted_answer
            ? "border border-[#55E9AB]/20 bg-[#55E9AB]/5"
            : "bg-[var(--c-bg-card)]/50",
        )}
      >
        <div className="flex gap-3">
          <VoteButton
            count={reply.upvotes}
            replyId={reply.id}
            wallet={wallet}
            className="shrink-0"
          />

          <div className="min-w-0 flex-1">
            {reply.is_accepted_answer && (
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#55E9AB]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Accepted Answer
              </div>
            )}

            <div className="prose-academy text-sm text-[var(--c-text-body)] leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {reply.body}
              </ReactMarkdown>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <span className="font-mono text-[10px] text-[var(--c-text-muted)]">
                {shortWallet(reply.author_wallet)}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[var(--c-text-muted)]">
                <Clock className="h-3 w-3" />
                {timeAgo(reply.created_at)}
              </span>

              {depth < maxDepth && wallet && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--c-text-2)] transition-colors hover:text-[var(--c-text)]"
                >
                  <MessageSquare className="h-3 w-3" />
                  Reply
                </button>
              )}

              {canAcceptAnswer && onAcceptAnswer && (
                <button
                  onClick={() => onAcceptAnswer(reply.id)}
                  className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--c-text-2)] transition-colors hover:text-[#55E9AB]"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Accept
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReplyForm && wallet && (
        <div className="mt-2 ml-6">
          <ReplyForm
            threadId={threadId}
            wallet={wallet}
            parentReplyId={reply.id}
            onSuccess={() => {
              setShowReplyForm(false);
              onReplyAdded?.();
            }}
            compact
          />
        </div>
      )}

      {nestedReplies.length > 0 && (
        <div className="mt-2 space-y-2">
          {nestedReplies.map((nested) => (
            <ReplyItem
              key={nested.id}
              reply={nested}
              allReplies={allReplies}
              wallet={wallet}
              threadId={threadId}
              threadAuthor={threadAuthor}
              depth={depth + 1}
              onAcceptAnswer={onAcceptAnswer}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
