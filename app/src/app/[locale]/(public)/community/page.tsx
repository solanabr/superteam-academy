import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Forum",
  description: "Ask questions, share knowledge, help others learn Solana.",
};

const CATEGORIES = [
  { label: "General Discussion", posts: 42, slug: "general" },
  { label: "Solana Basics", posts: 87, slug: "solana-basics" },
  { label: "Anchor Framework", posts: 63, slug: "anchor-framework" },
  { label: "DeFi & AMMs", posts: 29, slug: "defi-amms" },
  { label: "Security", posts: 31, slug: "security" },
  { label: "Showcase", posts: 18, slug: "showcase" },
] as const;

const THREADS = [
  {
    id: 1,
    title: "How do I derive a PDA with multiple seeds?",
    author: "7xKp...3mRt",
    category: "Anchor Framework",
    replies: 12,
    views: 234,
    timeAgo: "2h ago",
    answered: true,
  },
  {
    id: 2,
    title: "Getting 'Account not found' error on devnet — help!",
    author: "9Bw2...8nLq",
    category: "Solana Basics",
    replies: 3,
    views: 89,
    timeAgo: "45m ago",
    answered: false,
  },
  {
    id: 3,
    title: "Showcase: Built a token vesting program using this course!",
    author: "3dFy...5kJv",
    category: "Showcase",
    replies: 8,
    views: 312,
    timeAgo: "1d ago",
    answered: null,
  },
  {
    id: 4,
    title: "Best practices for CPI error handling?",
    author: "Aq1R...7hZe",
    category: "Anchor Framework",
    replies: 15,
    views: 445,
    timeAgo: "3d ago",
    answered: true,
  },
  {
    id: 5,
    title: "Token-2022 transfer hooks — where to start?",
    author: "6sNp...2wMc",
    category: "DeFi & AMMs",
    replies: 2,
    views: 67,
    timeAgo: "5h ago",
    answered: false,
  },
  {
    id: 6,
    title: "Common reentrancy patterns in Solana AMMs",
    author: "Bq3T...9rWx",
    category: "Security",
    replies: 21,
    views: 567,
    timeAgo: "5d ago",
    answered: true,
  },
  {
    id: 7,
    title: "How does the XP bitmap work exactly?",
    author: "Yr8K...4mDz",
    category: "General Discussion",
    replies: 6,
    views: 123,
    timeAgo: "12h ago",
    answered: null,
  },
  {
    id: 8,
    title: "Completed Solana Fundamentals — AMA!",
    author: "Pv5L...1nFg",
    category: "Showcase",
    replies: 34,
    views: 891,
    timeAgo: "1w ago",
    answered: null,
  },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  "General Discussion": "#666666",
  "Solana Basics": "#14F195",
  "Anchor Framework": "#9945FF",
  "DeFi & AMMs": "#F1C40F",
  Security: "#E74C3C",
  Showcase: "#3498DB",
};

export default function CommunityPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Coming soon banner */}
      <div className="flex items-center gap-3 px-4 py-3 border border-[#1F1F1F] bg-[#111111] rounded text-sm font-mono text-[#666666]">
        <span className="text-base">🚧</span>
        <span>
          Community is in early access.{" "}
          <span className="text-[#EDEDED]">Full forum launching soon.</span>
        </span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-3xl font-bold text-[#EDEDED] mb-1">Community</h1>
          <p className="text-sm text-[#666666]">
            Ask questions, share knowledge, help others learn Solana.
          </p>
        </div>
        <button className="shrink-0 px-4 py-2 bg-[#14F195] text-black font-mono font-semibold text-sm rounded hover:bg-[#0D9E61] transition-colors">
          + New Thread
        </button>
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Categories sidebar */}
        <aside className="lg:w-1/4 shrink-0 space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#666666] px-1 mb-3">
            Categories
          </p>
          {CATEGORIES.map(({ label, posts, slug }) => (
            <div
              key={slug}
              className="flex items-center justify-between px-3 py-2.5 bg-[#111111] border border-[#1F1F1F] rounded cursor-pointer hover:border-[#2E2E2E] hover:bg-[#141414] transition-colors group"
            >
              <span className="font-mono text-sm text-[#EDEDED] group-hover:text-[#14F195] transition-colors">
                {label}
              </span>
              <span className="font-mono text-[10px] text-[#666666] bg-[#1A1A1A] px-1.5 py-0.5 rounded">
                {posts}
              </span>
            </div>
          ))}
        </aside>

        {/* Thread list */}
        <div className="flex-1 space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#666666] px-1 mb-3">
            Latest Threads
          </p>
          {THREADS.map((thread) => {
            const catColor = CATEGORY_COLORS[thread.category] ?? "#666666";
            return (
              <div
                key={thread.id}
                className="bg-[#111111] border border-[#1F1F1F] rounded-lg px-5 py-4 hover:border-[#2E2E2E] hover:bg-[#141414] transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {/* Category tag */}
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                        style={{
                          color: catColor,
                          borderColor: `${catColor}40`,
                          backgroundColor: `${catColor}10`,
                        }}
                      >
                        {thread.category}
                      </span>

                      {/* Answered badge */}
                      {thread.answered === true && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#14F195]/40 bg-[#14F195]/10 text-[#14F195]">
                          Answered
                        </span>
                      )}
                      {thread.answered === false && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#666666]/40 bg-[#666666]/10 text-[#666666]">
                          Unanswered
                        </span>
                      )}
                    </div>

                    <h3 className="font-mono text-sm font-semibold text-[#EDEDED] leading-snug mb-2">
                      {thread.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-[#666666]">
                      <span>{thread.author}</span>
                      <span>·</span>
                      <span>{thread.replies} replies</span>
                      <span>·</span>
                      <span>{thread.views} views</span>
                      <span>·</span>
                      <span>{thread.timeAgo}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
