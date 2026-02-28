import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getCategories, getThreads, getForumStats, formatTimeAgo } from "@/lib/forum";
import type { ForumThread } from "@/lib/forum";

export const metadata: Metadata = {
  title: "Community Forum",
  description: "Ask questions, share knowledge, help others learn Solana.",
};

export const revalidate = 60;

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [categories, threads, stats] = await Promise.all([
    getCategories(),
    getThreads(category, 20, 0),
    getForumStats(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Stats bar */}
      <div className="flex items-center gap-6 px-4 py-3 border border-border bg-card rounded text-xs font-mono text-muted-foreground">
        <span>
          <span className="text-[#14F195] font-semibold">{stats.thread_count}</span>{" "}
          threads
        </span>
        <span>·</span>
        <span>
          <span className="text-[#14F195] font-semibold">{stats.reply_count}</span>{" "}
          replies
        </span>
        <span>·</span>
        <span>
          <span className="text-[#14F195] font-semibold">{stats.member_count}</span>{" "}
          members
        </span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-3xl font-bold text-foreground mb-1">
            Community
          </h1>
          <p className="text-sm text-muted-foreground">
            Ask questions, share knowledge, help others learn Solana.
          </p>
        </div>
        <Link
          href="/community/new"
          className="shrink-0 px-4 py-2 bg-[#14F195] text-black font-mono font-semibold text-sm rounded hover:bg-[#0D9E61] transition-colors"
        >
          + New Thread
        </Link>
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Categories sidebar */}
        <aside className="lg:w-1/4 shrink-0 space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-1 mb-3">
            Categories
          </p>
          <Link
            href="/community"
            className={`flex items-center justify-between px-3 py-2.5 bg-card border rounded hover:bg-elevated transition-colors ${!category ? "border-[#14F195]/40" : "border-border hover:border-border-hover"}`}
          >
            <span className={`font-mono text-sm ${!category ? "text-[#14F195]" : "text-foreground"}`}>All</span>
            <span className="font-mono text-[10px] text-muted-foreground bg-elevated px-1.5 py-0.5 rounded">
              {stats.thread_count}
            </span>
          </Link>
          {categories.map((cat) => {
            const isActive = category === cat.slug;
            return (
              <Link
                key={cat.slug}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={`/community?category=${cat.slug}` as any}
                className={`flex items-center justify-between px-3 py-2.5 bg-card border rounded hover:bg-elevated transition-colors group ${isActive ? "border-[#14F195]/40" : "border-border hover:border-border-hover"}`}
              >
                <span className={`font-mono text-sm flex items-center gap-2 ${isActive ? "text-[#14F195]" : "text-foreground group-hover:text-[#14F195] transition-colors"}`}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  {cat.label}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground bg-elevated px-1.5 py-0.5 rounded">
                  {cat.thread_count ?? 0}
                </span>
              </Link>
            );
          })}
        </aside>

        {/* Thread list */}
        <div className="flex-1 space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-1 mb-3">
            Latest Threads
          </p>

          {threads.length === 0 ? (
            <div className="bg-card border border-border rounded-lg px-5 py-16 text-center">
              <p className="font-mono text-sm text-muted-foreground">
                No threads yet.{" "}
                <Link href="/community/new" className="text-[#14F195] hover:underline">
                  Start the first one.
                </Link>
              </p>
            </div>
          ) : (
            threads.map((thread: ForumThread) => {
              const catColor = thread.category?.color ?? "#666666";
              return (
                <Link
                  key={thread.id}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={`/community/${thread.id}` as any}
                  className="block bg-card border border-border rounded-lg px-5 py-4 hover:border-border-hover hover:bg-elevated transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {/* Category tag */}
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

                        {/* Pinned badge */}
                        {thread.is_pinned && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#F5A623]/40 bg-[#F5A623]/10 text-[#F5A623]">
                            Pinned
                          </span>
                        )}

                        {/* Answered badge */}
                        {thread.is_answered === true && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#14F195]/40 bg-[#14F195]/10 text-[#14F195]">
                            Answered
                          </span>
                        )}
                        {thread.is_answered === false && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#666666]/40 bg-[#666666]/10 text-muted-foreground">
                            Unanswered
                          </span>
                        )}
                      </div>

                      <h3 className="font-mono text-sm font-semibold text-foreground leading-snug mb-2">
                        {thread.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-muted-foreground">
                        <span className="truncate max-w-[120px]">{thread.author_wallet}</span>
                        <span>·</span>
                        <span>{thread.reply_count ?? 0} replies</span>
                        <span>·</span>
                        <span>{thread.views} views</span>
                        <span>·</span>
                        <span>{formatTimeAgo(thread.created_at)}</span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="shrink-0 text-muted-foreground text-xs mt-1">
                      →
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
