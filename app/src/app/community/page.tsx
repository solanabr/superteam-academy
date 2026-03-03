"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    ArrowUp,
    ArrowDown,
    MessageSquare,
    Search,
    Plus,
    Flame,
    Clock,
    CheckCircle2,
    User,
    Tag,
    Eye,
    Pin,
} from "lucide-react";

/* ── Mock forum data ── */
const TAGS = ["All", "Solana Core", "DeFi", "NFTs", "Anchor", "Web3.js", "Token-2022", "Help", "Discussion"];

type ForumThread = {
    id: string;
    title: string;
    author: string;
    authorAvatar: string;
    content: string;
    tags: string[];
    votes: number;
    replies: number;
    views: number;
    createdAt: string;
    isPinned?: boolean;
    isSolved?: boolean;
    lastReplyAt: string;
};

const THREADS: ForumThread[] = [
    {
        id: "1",
        title: "How to derive PDAs for multi-level enrollment tracking?",
        author: "sol_builder",
        authorAvatar: "SB",
        content: "I'm building a module that needs to track enrollment at both the course and lesson level. What's the best PDA seed strategy to avoid collisions while keeping derivations efficient?",
        tags: ["Anchor", "Help"],
        votes: 42,
        replies: 12,
        views: 234,
        createdAt: "2h ago",
        isPinned: true,
        isSolved: true,
        lastReplyAt: "30m ago",
    },
    {
        id: "2",
        title: "Token-2022 extensions: NonTransferable vs PermanentDelegate for soulbound XP",
        author: "defi_queen",
        authorAvatar: "DQ",
        content: "Comparing different approaches for implementing soulbound XP tokens. NonTransferable seems simpler but PermanentDelegate gives more control. Thoughts?",
        tags: ["Token-2022", "Discussion"],
        votes: 38,
        replies: 8,
        views: 189,
        createdAt: "5h ago",
        isPinned: true,
        lastReplyAt: "1h ago",
    },
    {
        id: "3",
        title: "Best practices for Helius DAS API rate limiting in Next.js?",
        author: "web3_dev",
        authorAvatar: "WD",
        content: "I'm hitting rate limits when fetching token accounts for the leaderboard. How do you handle caching and request batching with Helius DAS in a Next.js app?",
        tags: ["Solana Core", "Help"],
        votes: 27,
        replies: 6,
        views: 156,
        createdAt: "1d ago",
        isSolved: true,
        lastReplyAt: "3h ago",
    },
    {
        id: "4",
        title: "Metaplex Core vs Token Metadata for credential NFTs",
        author: "nft_wizard",
        authorAvatar: "NW",
        content: "Starting a new project where I need to issue completion certificates as NFTs. Should I use Metaplex Core or the legacy Token Metadata program? What are the tradeoffs?",
        tags: ["NFTs", "Discussion"],
        votes: 21,
        replies: 15,
        views: 312,
        createdAt: "2d ago",
        lastReplyAt: "6h ago",
    },
    {
        id: "5",
        title: "Challenge: Implement a SPL token swap with slippage protection",
        author: "challenge_master",
        authorAvatar: "CM",
        content: "Weekly coding challenge! Implement a token swap function using the SPL Token Swap program. Must handle slippage tolerance and proper error handling. Post your solution below!",
        tags: ["DeFi", "Discussion"],
        votes: 56,
        replies: 23,
        views: 567,
        createdAt: "3d ago",
        lastReplyAt: "2h ago",
    },
    {
        id: "6",
        title: "How to simulate Anchor transactions in local validator?",
        author: "rust_learner",
        authorAvatar: "RL",
        content: "I'm new to Anchor and running into issues testing my program on the local validator. The transactions keep failing with InstructionError. Any tips?",
        tags: ["Anchor", "Help"],
        votes: 15,
        replies: 4,
        views: 89,
        createdAt: "4d ago",
        isSolved: true,
        lastReplyAt: "1d ago",
    },
    {
        id: "7",
        title: "Building a real-time notification system with Solana WebSockets",
        author: "realtime_dev",
        authorAvatar: "RD",
        content: "Has anyone implemented WebSocket subscriptions for monitoring on-chain events in a Next.js app? Looking for patterns around reconnection handling and state sync.",
        tags: ["Web3.js", "Discussion"],
        votes: 19,
        replies: 7,
        views: 145,
        createdAt: "5d ago",
        lastReplyAt: "2d ago",
    },
    {
        id: "8",
        title: "Completed the Solana Core track! My experience and tips",
        author: "graduate_2026",
        authorAvatar: "G2",
        content: "Just finished all modules in the Solana Core track. Here's a summary of what I learned, common pitfalls, and advice for new learners starting their journey.",
        tags: ["Solana Core", "Discussion"],
        votes: 73,
        replies: 31,
        views: 892,
        createdAt: "1w ago",
        lastReplyAt: "5h ago",
    },
    {
        id: "9",
        title: "CPI best practices: Cross-program invocations in Anchor",
        author: "advanced_sol",
        authorAvatar: "AS",
        content: "Let's discuss CPI patterns. When should you use invoke vs invoke_signed? How do you handle remaining accounts? Share your patterns here.",
        tags: ["Anchor", "Solana Core"],
        votes: 34,
        replies: 11,
        views: 267,
        createdAt: "1w ago",
        lastReplyAt: "1d ago",
    },
    {
        id: "10",
        title: "Proposal: Add Rust systems programming track",
        author: "systems_fan",
        authorAvatar: "SF",
        content: "Would love to see a track focused on Rust fundamentals before diving into Solana/Anchor. Many newcomers struggle with ownership/borrowing concepts. Upvote if you agree!",
        tags: ["Discussion"],
        votes: 89,
        replies: 42,
        views: 1203,
        createdAt: "2w ago",
        lastReplyAt: "12h ago",
    },
];

type SortMode = "hot" | "new" | "top" | "unanswered";

export default function CommunityPage() {
    const [activeTag, setActiveTag] = useState("All");
    const [sortMode, setSortMode] = useState<SortMode>("hot");
    const [searchQuery, setSearchQuery] = useState("");
    const [votedThreads, setVotedThreads] = useState<Record<string, "up" | "down" | null>>({});

    const handleVote = (threadId: string, direction: "up" | "down") => {
        setVotedThreads((prev) => ({
            ...prev,
            [threadId]: prev[threadId] === direction ? null : direction,
        }));
    };

    const filteredThreads = THREADS.filter((t) => {
        const matchesTag = activeTag === "All" || t.tags.includes(activeTag);
        const matchesSearch =
            searchQuery === "" ||
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTag && matchesSearch;
    }).sort((a, b) => {
        if (sortMode === "hot") return b.votes + b.replies - (a.votes + a.replies);
        if (sortMode === "top") return b.votes - a.votes;
        if (sortMode === "unanswered") return a.replies - b.replies;
        return 0; // "new" — already in order
    });

    const getVoteCount = (thread: ForumThread) => {
        const vote = votedThreads[thread.id];
        if (vote === "up") return thread.votes + 1;
        if (vote === "down") return thread.votes - 1;
        return thread.votes;
    };

    return (
        <div className="min-h-screen bg-background noise-bg">
            {/* Hero Header */}
            <section className="border-b border-border bg-background relative overflow-hidden">
                <div className="absolute right-[10%] top-[20%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full mix-blend-screen opacity-15 blur-[80px] bg-accent pointer-events-none" />
                <div className="mx-auto max-w-6xl px-6 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 border border-border bg-black/50 px-3 py-1 text-xs font-mono uppercase tracking-widest text-primary mb-4 rounded-none">
                            <MessageSquare className="h-3 w-3" />
                            Community
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-extrabold uppercase tracking-tighter text-foreground">
                            Community <span className="text-primary">Forum</span>
                        </h1>
                        <p className="mt-4 text-muted-foreground font-mono text-sm max-w-xl">
                            {"> "}Ask questions, share knowledge, and connect with fellow Solana builders. Discuss courses, challenges, and everything on-chain.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-6 py-8">
                {/* Controls Bar */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search threads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 rounded-none border-border bg-black/40 font-mono text-sm h-10"
                        />
                    </div>

                    {/* Sort Buttons */}
                    <div className="flex gap-2">
                        {(
                            [
                                { key: "hot" as SortMode, icon: Flame, label: "Hot" },
                                { key: "new" as SortMode, icon: Clock, label: "New" },
                                { key: "top" as SortMode, icon: ArrowUp, label: "Top" },
                                { key: "unanswered" as SortMode, icon: MessageSquare, label: "Open" },
                            ] as const
                        ).map(({ key, icon: Icon, label }) => (
                            <Button
                                key={key}
                                variant={sortMode === key ? "default" : "outline"}
                                size="sm"
                                className={`rounded-none font-mono text-xs uppercase tracking-wider ${sortMode === key ? "bg-primary text-black" : "border-border bg-black/40"}`}
                                onClick={() => setSortMode(key)}
                            >
                                <Icon className="h-3 w-3 mr-1" />
                                {label}
                            </Button>
                        ))}
                    </div>

                    {/* New Thread */}
                    <Button className="rounded-none bg-primary text-black font-bold uppercase tracking-widest text-xs">
                        <Plus className="h-4 w-4 mr-1" />
                        New Thread
                    </Button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {TAGS.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setActiveTag(tag)}
                            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border transition-all
                ${activeTag === tag
                                    ? "border-primary bg-primary/20 text-primary"
                                    : "border-border bg-black/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Thread List */}
                <div className="space-y-3">
                    <AnimatePresence>
                        {filteredThreads.map((thread, idx) => (
                            <motion.div
                                key={thread.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03, duration: 0.3 }}
                            >
                                <Card className="border-border bg-card/5 backdrop-blur-sm hover:border-primary/30 transition-all group rounded-none">
                                    <CardContent className="p-0">
                                        <div className="flex">
                                            {/* Vote Column */}
                                            <div className="flex flex-col items-center justify-center gap-1 px-4 py-4 border-r border-border min-w-[64px]">
                                                <button
                                                    onClick={() => handleVote(thread.id, "up")}
                                                    className={`p-1 transition-colors ${votedThreads[thread.id] === "up" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                                                >
                                                    <ArrowUp className="h-4 w-4" />
                                                </button>
                                                <span className={`text-sm font-mono font-bold ${votedThreads[thread.id] === "up" ? "text-primary" : votedThreads[thread.id] === "down" ? "text-destructive" : "text-foreground"}`}>
                                                    {getVoteCount(thread)}
                                                </span>
                                                <button
                                                    onClick={() => handleVote(thread.id, "down")}
                                                    className={`p-1 transition-colors ${votedThreads[thread.id] === "down" ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
                                                >
                                                    <ArrowDown className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 p-4">
                                                <div className="flex items-start gap-2 mb-2">
                                                    {thread.isPinned && (
                                                        <Pin className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                                                    )}
                                                    <Link href={`/community/${thread.id}`} className="flex-1">
                                                        <h3 className="font-space font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                                                            {thread.title}
                                                        </h3>
                                                    </Link>
                                                    {thread.isSolved && (
                                                        <Badge variant="outline" className="rounded-none border-green-500/50 text-green-400 text-[10px] font-mono uppercase flex-shrink-0">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Solved
                                                        </Badge>
                                                    )}
                                                </div>

                                                <p className="text-xs text-muted-foreground font-mono line-clamp-1 mb-3">
                                                    {thread.content}
                                                </p>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {/* Tags */}
                                                        <div className="flex gap-1">
                                                            {thread.tags.map((tag) => (
                                                                <span key={tag} className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-border text-muted-foreground">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="h-3 w-3" />
                                                            {thread.replies}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="h-3 w-3" />
                                                            {thread.views.toLocaleString("en-US")}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {thread.author}
                                                        </span>
                                                        <span className="hidden sm:inline">{thread.createdAt}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredThreads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="font-space text-lg text-muted-foreground">No threads found</p>
                        <p className="font-mono text-sm text-muted-foreground/60 mt-1">Try a different search or filter</p>
                    </div>
                )}

                {/* Stats Footer */}
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 border-t border-border divide-x divide-border bg-black/40 backdrop-blur-sm">
                    {[
                        { label: "Threads", value: "1,247" },
                        { label: "Replies", value: "8,932" },
                        { label: "Members", value: "3,456" },
                        { label: "Solved", value: "892" },
                    ].map((stat) => (
                        <div key={stat.label} className="px-6 py-6 text-center">
                            <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-1">
                                {"// "}{stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
