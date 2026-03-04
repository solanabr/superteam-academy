"use client";

import { useEffect, useState, useCallback, use, useMemo } from "react";
import { communityApi, Thread, Reply } from "@/lib/community";
import { ReplyItem } from "@/components/community/ReplyItem";
import { useAuth } from "@/components/providers/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    MessageSquare,
    ThumbsUp,
    Eye,
    Pin,
    Lock,
    CheckCircle2,
    User as UserIcon,
    Zap,
    BookOpen,
    BarChart3,
    Loader2,
    Send
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const t = useTranslations("Community");
    const dt = useTranslations("Dashboard");
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    const [thread, setThread] = useState<Thread | null>(null);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyBody, setReplyBody] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyPagination, setReplyPagination] = useState({ total: 0, totalPages: 0, page: 1 });

    // Helper to nest replies for a threaded view
    const nestedReplies = useMemo(() => {
        const replyMap: Record<string, Reply & { children?: Reply[] }> = {};
        const roots: (Reply & { children?: Reply[] })[] = [];

        // First pass: initialize the map
        replies.forEach(reply => {
            replyMap[reply._id] = { ...reply, children: [] };
        });

        // Second pass: build the tree
        replies.forEach(reply => {
            const current = replyMap[reply._id];
            if (reply.parentReplyId && replyMap[reply.parentReplyId]) {
                const parent = replyMap[reply.parentReplyId];
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(current);
                } else {
                    roots.push(current);
                }
            } else {
                roots.push(current);
            }
        });

        return roots;
    }, [replies]);

    const fetchThread = useCallback(async () => {
        setLoading(true);
        try {
            const res = await communityApi.getThread(id);
            if (res.success) {
                setThread(res.data.thread);
                setReplies(res.data.replies);
                setReplyPagination(res.data.replyPagination);
            }
        } catch (err) {
            console.error("Failed to fetch thread:", err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchThread();
    }, [fetchThread]);

    const handleVoteThread = async () => {
        if (!isAuthenticated) return router.push("/auth");
        try {
            const res = await communityApi.voteThread(id);
            if (res.success && thread) {
                setThread({ ...thread, upvotes: Array(res.data.upvotes).fill("id") }); // Mocking length update
                fetchThread(); // Get full updated state
            }
        } catch (err) {
            console.error("Failed to vote thread:", err);
        }
    };

    const handleVoteReply = async (replyId: string) => {
        if (!isAuthenticated) return router.push("/auth");
        try {
            await communityApi.voteReply(id, replyId);
            fetchThread(); // Refresh
        } catch (err) {
            console.error("Failed to vote reply:", err);
        }
    };

    const handleAcceptReply = async (replyId: string) => {
        try {
            const res = await communityApi.acceptReply(id, replyId);
            if (res.success) {
                fetchThread();
            }
        } catch (err) {
            console.error("Failed to accept reply:", err);
        }
    };

    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) return router.push("/auth");
        if (!replyBody.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await communityApi.createReply(id, { body: replyBody });
            if (res.success) {
                setReplyBody("");
                fetchThread();
            }
        } catch (err) {
            console.error("Failed to post reply:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center font-mono">
                <Loader2 className="w-10 h-10 text-neon-cyan animate-spin mb-4" />
                <p className="text-sm font-black text-zinc-500 uppercase tracking-widest animate-pulse">Retrieving encrypted data...</p>
            </div>
        );
    }

    if (!thread) {
        return (
            <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center font-mono space-y-6">
                <p className="text-xl text-white font-black uppercase tracking-tighter">404: RECORDS_NOT_FOUND</p>
                <Link href="/community" className="px-8 py-2 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 transition-all uppercase text-[10px] font-black tracking-widest">
                    Return to Hub
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050810] relative overflow-hidden flex flex-col font-sans">
            {/* Top Bar */}
            <header className="relative z-20 border-b border-white/5 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 text-white group-hover:border-neon-cyan/50 transition-colors">
                            <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-white tracking-widest uppercase font-mono group-hover:text-neon-cyan transition-colors">Osmos</span>
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Link href="/community" className="text-zinc-500 hover:text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="relative z-10 flex-1 px-4 py-8 md:py-12">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Back Link */}
                    <Link href="/community" className="inline-flex items-center gap-2 text-[10px] font-mono font-black text-neon-cyan uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
                        <ChevronLeft className="w-3 h-3" /> {t("allThreads")}
                    </Link>

                    {/* Thread Header Block */}
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            {thread.isPinned && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20">
                                    <Pin className="w-3 h-3" /> {t("pinned")}
                                </span>
                            )}
                            {thread.type === "question" && (
                                <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border ${thread.isSolved
                                    ? "bg-neon-green/10 text-neon-green border-neon-green/20"
                                    : "bg-red-400/10 text-red-400 border-red-400/20"
                                    }`}>
                                    <CheckCircle2 className="w-3 h-3" /> {thread.isSolved ? t("solved") : t("unsolved")}
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.1]">
                            {thread.title}
                        </h1>

                        <div className="flex items-center gap-4 border-y border-white/5 py-6">
                            <div className="w-10 h-10 border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                                {thread.author.avatar ? (
                                    <img src={thread.author.avatar} className="w-full h-full object-cover grayscale opacity-80" alt="" />
                                ) : (
                                    <UserIcon className="w-5 h-5 text-zinc-600" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white uppercase tracking-wider">
                                    {thread.author.name || thread.author.username}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                    Posted {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                            <div className="ml-auto flex items-center gap-6 font-mono text-zinc-500">
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-black text-white">{thread.upvotes.length}</span>
                                    <span className="text-[8px] uppercase tracking-widest font-bold">Votes</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-black text-white">{thread.views}</span>
                                    <span className="text-[8px] uppercase tracking-widest font-bold">Views</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Thread Body */}
                    <div className="bg-[#0a0f1a]/40 border border-white/[0.03] p-8">
                        <div className="text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap text-lg">
                            {thread.body}
                        </div>

                        <div className="mt-12 flex items-center gap-4">
                            <button
                                onClick={handleVoteThread}
                                className={`flex items-center gap-2 px-6 py-2.5 text-[11px] font-mono font-black uppercase tracking-widest transition-all border ${thread.upvotes.includes(user?.id || "")
                                    ? "bg-neon-cyan text-black border-neon-cyan"
                                    : "bg-white/5 text-neon-cyan border-neon-cyan/20 hover:bg-neon-cyan/10"
                                    }`}
                            >
                                <ThumbsUp className="w-4 h-4" />
                                {t("upvotes")}
                            </button>
                        </div>
                    </div>

                    {/* Replies Section */}
                    <div className="pt-12 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-0.5 flex-1 bg-white/5" />
                            <h2 className="text-xs font-mono font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-neon-cyan" /> {thread.replyCount} {t("replies")}
                            </h2>
                            <div className="h-0.5 flex-1 bg-white/5" />
                        </div>

                        {/* Reply Form */}
                        {isAuthenticated ? (
                            <form onSubmit={handleSubmitReply} className="space-y-4">
                                <textarea
                                    required
                                    rows={4}
                                    value={replyBody}
                                    onChange={(e) => setReplyBody(e.target.value)}
                                    placeholder={t("replyPlaceholder")}
                                    className="w-full bg-[#0a0f1a] border border-white/10 px-6 py-4 text-white focus:border-neon-cyan/50 outline-none transition-all font-mono text-sm resize-none"
                                />
                                <div className="flex justify-end">
                                    <button
                                        disabled={isSubmitting || !replyBody.trim()}
                                        className="flex items-center gap-2 px-8 py-3 bg-neon-cyan text-black text-[11px] font-mono font-black uppercase tracking-widest hover:bg-neon-cyan/80 transition-all disabled:opacity-50"
                                    >
                                        <Send className="w-4 h-4" />
                                        {t("postReply")}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="border border-dashed border-white/10 p-10 text-center space-y-4">
                                <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Login required to participate</p>
                                <Link href="/auth" className="inline-block px-8 py-2 bg-white/5 text-white border border-white/10 hover:border-neon-cyan/50 transition-colors uppercase text-[10px] font-black tracking-widest">
                                    Sign In
                                </Link>
                            </div>
                        )}

                        {/* Replies List */}
                        <div className="space-y-6">
                            {nestedReplies.length > 0 ? (
                                nestedReplies.map((reply) => (
                                    <ReplyItem
                                        key={reply._id}
                                        reply={reply}
                                        isThreadAuthor={user?.id === thread.author._id}
                                        onVote={handleVoteReply}
                                        onAccept={thread.type === "question" && !thread.isSolved ? handleAcceptReply : undefined}
                                    />
                                ))
                            ) : (
                                <p className="text-center py-12 text-xs font-mono text-zinc-600 uppercase tracking-widest">No transmissions yet...</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
