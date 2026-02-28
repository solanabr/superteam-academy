import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getThread, getReplies, getVoteCount, formatTimeAgo } from "@/lib/forum";
import { ReplyForm } from "./ReplyForm";
import { UpvoteButton } from "./UpvoteButton";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const thread = await getThread(id);
  if (!thread) return { title: "Thread Not Found" };
  return {
    title: thread.title,
    description: thread.body.slice(0, 160),
  };
}

export default async function ThreadDetailPage({ params }: Props) {
  const { id } = await params;

  const [thread, replies, voteCount] = await Promise.all([
    getThread(id),
    getReplies(id),
    getVoteCount(id),
  ]);

  if (!thread) notFound();

  const catColor = thread.category?.color ?? "#666666";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link href="/community" className="hover:text-foreground transition-colors">
          Community
        </Link>
        <span>/</span>
        {thread.category && (
          <>
            <Link
              href={`/community?category=${thread.category.slug}` as Parameters<typeof Link>[0]["href"]}
              className="hover:text-foreground transition-colors"
            >
              {thread.category.label}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground truncate max-w-[200px]">{thread.title}</span>
      </nav>

      {/* Thread */}
      <article className="bg-card border border-border rounded-lg p-6 space-y-4">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {thread.category && (
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                style={{
                  color: catColor,
                  borderColor: `${catColor}40`,
                  backgroundColor: `${catColor}10`,
                }}
              >
                {thread.category.label}
              </span>
            )}
            {thread.is_pinned && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#F5A623]/40 bg-[#F5A623]/10 text-[#F5A623]">
                Pinned
              </span>
            )}
            {thread.is_answered && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#14F195]/40 bg-[#14F195]/10 text-[#14F195]">
                Answered
              </span>
            )}
          </div>

          <h1 className="font-mono text-xl font-bold text-foreground leading-snug">
            {thread.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-muted-foreground">
            <span className="text-foreground">{thread.author_wallet}</span>
            <span>·</span>
            <span>{formatTimeAgo(thread.created_at)}</span>
            <span>·</span>
            <span>{thread.views} views</span>
            <span>·</span>
            <span>{replies.length} {replies.length === 1 ? "reply" : "replies"}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Body */}
        <div className="prose prose-invert max-w-none">
          <p className="font-mono text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {thread.body}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <UpvoteButton threadId={thread.id} initialCount={voteCount} />
          <span className="text-[10px] font-mono text-muted-foreground">
            {voteCount} {voteCount === 1 ? "upvote" : "upvotes"}
          </span>
        </div>
      </article>

      {/* Replies */}
      {replies.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-1">
            {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
          </h2>

          {replies.map((reply, index) => (
            <div
              key={reply.id}
              className={[
                "bg-card border rounded-lg p-5 space-y-3",
                reply.is_accepted
                  ? "border-[#14F195]/40 bg-[#14F195]/5"
                  : "border-border",
              ].join(" ")}
            >
              {reply.is_accepted && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#14F195]/40 bg-[#14F195]/10 text-[#14F195]">
                    Accepted Answer
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                <span className="text-foreground font-semibold">{reply.author_wallet}</span>
                <span>·</span>
                <span>{formatTimeAgo(reply.created_at)}</span>
                <span className="ml-auto text-muted-foreground/50">#{index + 1}</span>
              </div>

              <p className="font-mono text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {reply.body}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Reply form */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="font-mono text-sm font-semibold text-foreground">
          Leave a Reply
        </h2>
        <ReplyForm threadId={thread.id} />
      </section>
    </div>
  );
}
