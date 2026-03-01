"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/context/AuthContext";
import { shortenAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MessageSquare, ThumbsUp, Pin, Flame, Clock, Tag, Plus, X, Send } from "lucide-react";

const categories = ["All", "General", "Anchor", "DeFi", "NFTs", "Security", "Help", "Showcase"];

const mockPosts = [
  {
    id: 1,
    title: "How do I properly validate account ownership in Anchor?",
    body: "I'm building a program that requires users to prove they own an account. What's the best pattern for this in Anchor? Should I use has_one or a custom constraint?",
    author: "7xKXtg...AsU",
    category: "Help",
    upvotes: 24,
    replies: 8,
    pinned: true,
    hot: true,
    timestamp: "2h ago",
    tags: ["anchor", "security", "accounts"],
    replies_data: [
      { author: "9WzDXw...WM", body: "Use has_one for simple ownership checks. It automatically validates that the account's field matches the signer.", upvotes: 12, timestamp: "1h ago" },
      { author: "3FZbgi...3q", body: "For more complex cases, consider using constraint = account.owner == signer.key()", upvotes: 8, timestamp: "45m ago" },
    ],
  },
  {
    id: 2,
    title: "Just shipped my first DEX aggregator on Solana devnet! 🎉",
    body: "After 3 weeks of grinding through the Superteam Academy courses, I finally deployed my first DEX aggregator. It routes trades through Raydium, Orca, and Meteora. Check it out!",
    author: "5Q544f...j1",
    category: "Showcase",
    upvotes: 67,
    replies: 15,
    pinned: false,
    hot: true,
    timestamp: "4h ago",
    tags: ["defi", "dex", "showcase"],
    replies_data: [
      { author: "DezXAZ...63", body: "This is incredible! What routing algorithm did you use?", upvotes: 5, timestamp: "3h ago" },
    ],
  },
  {
    id: 3,
    title: "Understanding PDAs: A Complete Guide for Beginners",
    body: "Program Derived Addresses are one of the most powerful features of Solana. In this post, I'll explain how they work, when to use them, and common pitfalls to avoid.",
    author: "EPjFWd...1v",
    category: "General",
    upvotes: 89,
    replies: 23,
    pinned: true,
    hot: false,
    timestamp: "1d ago",
    tags: ["pdas", "beginner", "guide"],
    replies_data: [],
  },
  {
    id: 4,
    title: "Token-2022 Transfer Hooks - My Experience",
    body: "I spent the last week implementing transfer hooks for a loyalty token system. Here are my findings and a code snippet that might help others.",
    author: "4k3Dyj...D8",
    category: "Anchor",
    upvotes: 45,
    replies: 11,
    pinned: false,
    hot: true,
    timestamp: "6h ago",
    tags: ["token-2022", "transfer-hooks"],
    replies_data: [],
  },
  {
    id: 5,
    title: "Common Solana Security Vulnerabilities - Checklist",
    body: "After auditing 10+ Solana programs, I've compiled a checklist of the most common vulnerabilities. Bookmark this before your next deployment!",
    author: "So1111...112",
    category: "Security",
    upvotes: 112,
    replies: 34,
    pinned: false,
    hot: true,
    timestamp: "2d ago",
    tags: ["security", "auditing", "checklist"],
    replies_data: [],
  },
  {
    id: 6,
    title: "NFT Royalties on Solana - State of the Ecosystem",
    body: "With the shift to Token-2022 and Metaplex Core, royalty enforcement is finally becoming a reality. Here's a breakdown of the current state and what's coming.",
    author: "Es9vMF...YB",
    category: "NFTs",
    upvotes: 38,
    replies: 9,
    pinned: false,
    hot: false,
    timestamp: "3d ago",
    tags: ["nft", "royalties", "metaplex"],
    replies_data: [],
  },
];

export default function CommunityPage() {
  const { publicKey } = useWallet();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPost, setSelectedPost] = useState<typeof mockPosts[0] | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [sortBy, setSortBy] = useState<"hot" | "new" | "top">("hot");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [replyText, setReplyText] = useState("");
  const [upvoted, setUpvoted] = useState<number[]>([]);

  const isLoggedIn = !!(publicKey || user);
  const displayName = user?.email?.split('@')[0].toUpperCase() ||
    (publicKey ? shortenAddress(publicKey.toBase58()) : "ANON");

  const filtered = mockPosts.filter(p =>
    selectedCategory === "All" || p.category === selectedCategory
  ).sort((a, b) => {
    if (sortBy === "hot") return (b.hot ? 1 : 0) - (a.hot ? 1 : 0) || b.upvotes - a.upvotes;
    if (sortBy === "top") return b.upvotes - a.upvotes;
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#020202]">

      {/* Header */}
      <div className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-4">// COMMUNITY</div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-display font-black text-6xl uppercase tracking-tighter mb-3">
                BUILDER <span className="text-[#9945ff]">FORUM</span>
              </h1>
              <p className="text-sm font-mono text-[#555]">
                Discuss, share, and learn with the Solana builder community
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-display font-black text-3xl text-[#14f195]">{mockPosts.length}</div>
                <div className="text-[9px] font-mono text-[#444] uppercase">Posts</div>
              </div>
              <div className="w-px h-10 bg-[#1a1a1a]" />
              <div className="text-right">
                <div className="font-display font-black text-3xl text-[#9945ff]">
                  {mockPosts.reduce((a, b) => a + b.replies, 0)}
                </div>
                <div className="text-[9px] font-mono text-[#444] uppercase">Replies</div>
              </div>
              {isLoggedIn && (
                <button
                  onClick={() => setShowNewPost(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#9945ff] text-white font-mono text-[11px] uppercase tracking-widest hover:bg-[#8835ef] transition-colors ml-4"
                >
                  <Plus className="w-4 h-4" />
                  New Post
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowNewPost(false)} />
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-[#0a0a0a] border border-[#1a1a1a]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1a1a1a]">
              <h2 className="font-display font-black text-xl uppercase">New Post</h2>
              <button onClick={() => setShowNewPost(false)} className="w-8 h-8 flex items-center justify-center border border-[#1a1a1a] text-[#444] hover:text-[#f5f5f0] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[9px] font-mono text-[#444] uppercase tracking-widest mb-2 block">Title</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="What's your question or topic?"
                  className="w-full bg-[#020202] border border-[#1a1a1a] px-4 py-3 text-sm font-mono text-[#f5f5f0] placeholder-[#333] focus:outline-none focus:border-[#9945ff] transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-[#444] uppercase tracking-widest mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.filter(c => c !== "All").map(c => (
                    <button
                      key={c}
                      onClick={() => setNewCategory(c)}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border transition-colors",
                        newCategory === c
                          ? "border-[#9945ff] text-[#9945ff] bg-[#9945ff]/10"
                          : "border-[#1a1a1a] text-[#444] hover:text-[#f5f5f0]"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] font-mono text-[#444] uppercase tracking-widest mb-2 block">Body</label>
                <textarea
                  value={newBody}
                  onChange={e => setNewBody(e.target.value)}
                  placeholder="Share your thoughts, question, or code..."
                  rows={6}
                  className="w-full bg-[#020202] border border-[#1a1a1a] px-4 py-3 text-sm font-mono text-[#f5f5f0] placeholder-[#333] focus:outline-none focus:border-[#9945ff] transition-colors resize-none"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[9px] font-mono text-[#333]">Posting as {displayName}</span>
                <button
                  onClick={() => setShowNewPost(false)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#9945ff] text-white font-mono text-[10px] uppercase tracking-widest hover:bg-[#8835ef] transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-8 py-8 flex gap-8">

        {/* Left: Post list */}
        <div className="flex-1 min-w-0">

          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={cn(
                    "px-3 py-2 text-[10px] font-mono uppercase tracking-widest border transition-colors",
                    selectedCategory === c
                      ? "border-[#9945ff] text-[#9945ff] bg-[#9945ff]/10"
                      : "border-[#1a1a1a] text-[#444] hover:text-[#f5f5f0]"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {(["hot", "new", "top"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={cn(
                    "px-3 py-2 text-[10px] font-mono uppercase tracking-widest border transition-colors",
                    sortBy === s
                      ? "border-[#9945ff] text-[#9945ff]"
                      : "border-[#1a1a1a] text-[#444] hover:text-[#f5f5f0]"
                  )}
                >
                  {s === "hot" ? "🔥" : s === "new" ? "⚡" : "⬆"} {s}
                </button>
              ))}
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-3">
            {filtered.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                className={cn(
                  "border p-5 cursor-pointer transition-all hover:border-[#9945ff]/40",
                  selectedPost?.id === post.id
                    ? "border-[#9945ff]/60 bg-[#0d0d0d]"
                    : "border-[#1a1a1a] bg-[#0a0a0a] hover:bg-[#0d0d0d]"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Upvote */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); setUpvoted(prev => prev.includes(post.id) ? prev.filter(id => id !== post.id) : [...prev, post.id]); }}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center border transition-colors",
                        upvoted.includes(post.id)
                          ? "border-[#9945ff] text-[#9945ff] bg-[#9945ff]/10"
                          : "border-[#1a1a1a] text-[#444] hover:border-[#9945ff] hover:text-[#9945ff]"
                      )}
                    >
                      ▲
                    </button>
                    <span className="text-[10px] font-mono text-[#f5f5f0] font-bold">
                      {post.upvotes + (upvoted.includes(post.id) ? 1 : 0)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {post.pinned && (
                        <span className="flex items-center gap-1 text-[8px] font-mono text-[#f5a623] border border-[#f5a623]/30 px-2 py-0.5 uppercase">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                      {post.hot && (
                        <span className="flex items-center gap-1 text-[8px] font-mono text-[#ff3366] border border-[#ff3366]/30 px-2 py-0.5 uppercase">
                          <Flame className="w-2.5 h-2.5" /> Hot
                        </span>
                      )}
                      <span className="text-[8px] font-mono text-[#9945ff] border border-[#9945ff]/30 px-2 py-0.5 uppercase">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-mono text-[#f5f5f0] font-bold uppercase mb-2 hover:text-[#9945ff] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-[11px] font-mono text-[#555] line-clamp-2 mb-3 leading-relaxed">
                      {post.body}
                    </p>
                    <div className="flex items-center gap-4 text-[9px] font-mono text-[#333]">
                      <span className="text-[#444]">{post.author}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {post.timestamp}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5" /> {post.replies} replies
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {post.tags.map(tag => (
                          <span key={tag} className="text-[#333] border border-[#1a1a1a] px-1.5 py-0.5">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded replies */}
                {selectedPost?.id === post.id && (
                  <div className="mt-5 pt-5 border-t border-[#1a1a1a]" onClick={e => e.stopPropagation()}>
                    <p className="text-xs font-mono text-[#555] mb-5 leading-relaxed">{post.body}</p>

                    {post.replies_data.length > 0 && (
                      <div className="space-y-3 mb-5">
                        <div className="text-[9px] font-mono text-[#333] uppercase tracking-widest">
                          {post.replies_data.length} Replies
                        </div>
                        {post.replies_data.map((reply, ri) => (
                          <div key={ri} className="border border-[#1a1a1a] p-4 bg-[#020202]">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-[10px] font-mono text-[#9945ff]">{reply.author}</span>
                              <span className="text-[9px] font-mono text-[#333]">{reply.timestamp}</span>
                              <span className="ml-auto text-[9px] font-mono text-[#444]">▲ {reply.upvotes}</span>
                            </div>
                            <p className="text-xs font-mono text-[#555] leading-relaxed">{reply.body}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {isLoggedIn ? (
                      <div className="flex gap-3">
                        <input
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 bg-[#020202] border border-[#1a1a1a] px-4 py-2.5 text-xs font-mono text-[#f5f5f0] placeholder-[#333] focus:outline-none focus:border-[#9945ff] transition-colors"
                        />
                        <button
                          onClick={() => setReplyText("")}
                          className="flex items-center gap-2 px-5 py-2.5 bg-[#9945ff] text-white font-mono text-[10px] uppercase tracking-widest hover:bg-[#8835ef] transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Reply
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-4 border border-dashed border-[#1a1a1a]">
                        <p className="text-[10px] font-mono text-[#444]">Sign in to reply</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="w-64 shrink-0 space-y-6">

          {/* Community stats */}
          <div className="border border-[#1a1a1a] p-5 bg-[#0a0a0a]">
            <div className="text-[9px] font-mono text-[#333] uppercase tracking-widest mb-4">Community Stats</div>
            <div className="space-y-3">
              {[
                { label: "Members", value: "1,240", color: "text-[#9945ff]" },
                { label: "Posts", value: mockPosts.length.toString(), color: "text-[#14f195]" },
                { label: "Replies", value: mockPosts.reduce((a, b) => a + b.replies, 0).toString(), color: "text-[#f5a623]" },
                { label: "Online Now", value: "47", color: "text-[#ff3366]" },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#444] uppercase">{stat.label}</span>
                  <span className={cn("text-[11px] font-mono font-bold", stat.color)}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top contributors */}
          <div className="border border-[#1a1a1a] p-5 bg-[#0a0a0a]">
            <div className="text-[9px] font-mono text-[#333] uppercase tracking-widest mb-4">Top Contributors</div>
            <div className="space-y-2">
              {[
                { name: "So1111...112", posts: 34, color: "text-[#f5a623]" },
                { name: "EPjFWd...1v", posts: 23, color: "text-[#9945ff]" },
                { name: "5Q544f...j1", posts: 15, color: "text-[#14f195]" },
                { name: "7xKXtg...AsU", posts: 8, color: "text-[#f5f5f0]" },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[9px] font-mono text-[#333] w-4">{i + 1}</span>
                  <div className="w-5 h-5 bg-[#1a1a1a] flex items-center justify-center text-[8px] font-mono">
                    {c.name.slice(0, 2)}
                  </div>
                  <span className={cn("text-[10px] font-mono flex-1 truncate", c.color)}>{c.name}</span>
                  <span className="text-[9px] font-mono text-[#444]">{c.posts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular tags */}
          <div className="border border-[#1a1a1a] p-5 bg-[#0a0a0a]">
            <div className="text-[9px] font-mono text-[#333] uppercase tracking-widest mb-4">Popular Tags</div>
            <div className="flex flex-wrap gap-2">
              {["anchor", "security", "pdas", "defi", "nft", "token-2022", "beginner", "showcase"].map(tag => (
                <button
                  key={tag}
                  className="text-[9px] font-mono text-[#444] border border-[#1a1a1a] px-2 py-1 hover:border-[#9945ff] hover:text-[#9945ff] transition-colors uppercase"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Join CTA */}
          {!isLoggedIn && (
            <div className="border border-[#9945ff]/30 p-5 bg-[#9945ff]/5">
              <div className="text-[10px] font-mono text-[#9945ff] uppercase tracking-widest mb-2 font-bold">
                Join the Community
              </div>
              <p className="text-[10px] font-mono text-[#555] mb-4 leading-relaxed">
                Sign in to post, reply, and connect with other builders.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}