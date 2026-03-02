"use client";

import { useEffect, useState, useCallback } from "react";
import { communityApi, Thread, ThreadType, CommunityFilters } from "@/lib/community";
import { ThreadCard } from "@/components/community/ThreadCard";
import { ThreadForm } from "@/components/community/ThreadForm";
import { useAuth } from "@/components/providers/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Plus,
    Filter,
    MessageSquare,
    HelpCircle,
    User as UserIcon,
    ChevronRight,
    Zap,
    BookOpen,
    BarChart3,
    Settings,
    LogOut,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function CommunityPage() {
    const t = useTranslations("Community");
    const dt = useTranslations("Dashboard");
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<CommunityFilters>({
        page: 1,
        limit: 20,
        sort: "latest"
    });
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchThreads = useCallback(async () => {
        setLoading(true);
        try {
            const res = await communityApi.getThreads(filters);
            if (res.success) {
                setThreads(res.data);
                setPagination(res.pagination);
            }
        } catch (err) {
            console.error("Failed to fetch threads:", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchThreads();
    }, [fetchThreads]);

    const handleCreateThread = async (data: any) => {
        if (!isAuthenticated) {
            router.push("/auth");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await communityApi.createThread(data);
            if (res.success) {
                setShowForm(false);
                fetchThreads(); // Refresh list
            }
        } catch (err) {
            console.error("Failed to create thread:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFilterChange = (key: keyof CommunityFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Backend doesn't have a direct search param yet, but we can filter by tag or just title if we added it.
        // For now, let's just refresh with current filters.
        fetchThreads();
    };

    return (
        <div className="min-h-screen bg-[#050810] relative overflow-hidden flex flex-col font-sans">
            {/* Top Bar (Consistent with Dashboard) */}
            <header className="relative z-20 border-b border-white/5 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 text-white group-hover:border-neon-cyan/50 transition-colors">
                            <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-white tracking-widest uppercase font-mono group-hover:text-neon-cyan transition-colors">Osmos</span>
                    </Link>
                    <nav className="flex items-center gap-2">
                        <Link href="/courses" className="flex items-center gap-1.5 px-3 py-2 text-[10px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-mono font-bold">
                            <BookOpen className="w-3.5 h-3.5" /> {dt("courses")}
                        </Link>
                        <Link href="/leaderboard" className="flex items-center gap-1.5 px-3 py-2 text-[10px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-mono font-bold">
                            <BarChart3 className="w-3.5 h-3.5" /> {dt("leaderboard")}
                        </Link>
                        <Link href="/community" className="flex items-center gap-1.5 px-3 py-2 text-[10px] text-neon-cyan hover:text-neon-cyan transition-colors uppercase tracking-widest font-mono font-bold">
                            <MessageSquare className="w-3.5 h-3.5" /> {t("title")}
                        </Link>
                        <Link href="/profile" className="flex items-center gap-1.5 px-3 py-2 text-[10px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-mono font-bold">
                            <UserIcon className="w-3.5 h-3.5" /> {dt("profile")}
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 px-4 py-8 md:py-12">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="text-neon-cyan font-mono text-sm">{">"}</span>
                                <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                                    community_hub
                                </span>
                                <div className="w-24 h-px bg-white/[0.06]" />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                                {t("title")}
                            </h1>
                            <p className="text-sm text-zinc-400 font-mono leading-relaxed max-w-xl">
                                <span className="text-neon-cyan/60">// </span>
                                {t("subtitle")}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-3 px-8 py-3 bg-neon-cyan text-black text-[11px] font-mono font-black uppercase tracking-widest hover:bg-neon-cyan/80 transition-all hover:-translate-y-0.5"
                        >
                            <Plus className="w-4 h-4" />
                            {t("newPost")}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Sidebar Filters */}
                        <aside className="lg:col-span-3 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Filter className="w-3 h-3" /> Navigation
                                </h3>
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => handleFilterChange("type", undefined)}
                                        className={`w-full text-left px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors border ${!filters.type ? "bg-white/5 text-neon-cyan border-neon-cyan/30" : "text-zinc-500 hover:text-white border-transparent"
                                            }`}
                                    >
                                        {t("allThreads")}
                                    </button>
                                    <button
                                        onClick={() => handleFilterChange("type", "discussion")}
                                        className={`w-full text-left px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors border ${filters.type === "discussion" ? "bg-white/5 text-neon-cyan border-neon-cyan/30" : "text-zinc-500 hover:text-white border-transparent"
                                            }`}
                                    >
                                        {t("discussions")}
                                    </button>
                                    <button
                                        onClick={() => handleFilterChange("type", "question")}
                                        className={`w-full text-left px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors border ${filters.type === "question" ? "bg-white/5 text-amber-400 border-amber-400/30" : "text-zinc-500 hover:text-white border-transparent"
                                            }`}
                                    >
                                        {t("questions")}
                                    </button>
                                    {isAuthenticated && (
                                        <button
                                            className="w-full text-left px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors border border-transparent"
                                        >
                                            {t("myPosts")}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    Sort By
                                </h3>
                                <select
                                    value={filters.sort}
                                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                                    className="w-full bg-[#0a0f1a] border border-white/10 text-xs font-mono font-bold text-zinc-400 px-3 py-2 outline-none focus:border-neon-cyan/50"
                                >
                                    <option value="latest">Latest Activity</option>
                                    <option value="top">Most Popular</option>
                                </select>
                            </div>
                        </aside>

                        {/* Thread Feed */}
                        <div className="lg:col-span-9 space-y-6">
                            {/* Search Bar */}
                            <form onSubmit={handleSearch} className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-neon-cyan transition-colors" />
                                <input
                                    type="text"
                                    placeholder={t("searchPlaceholder")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#0a0f1a] border border-white/5 group-hover:border-white/10 focus:border-neon-cyan/50 px-12 py-3 text-sm font-mono text-white outline-none transition-all"
                                />
                            </form>

                            {/* List */}
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                                        <Loader2 className="w-8 h-8 text-neon-cyan animate-spin mb-4" />
                                        <p className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">Accessing records...</p>
                                    </div>
                                ) : threads.length > 0 ? (
                                    threads.map((thread) => (
                                        <ThreadCard key={thread._id} thread={thread} />
                                    ))
                                ) : (
                                    <div className="border border-dashed border-white/10 p-20 text-center flex flex-col items-center gap-4">
                                        <MessageSquare className="w-12 h-12 text-zinc-800" />
                                        <p className="text-sm font-mono text-zinc-500">{t("noThreads")}</p>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center gap-2 pt-6">
                                    {Array.from({ length: pagination.totalPages }, (_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => handleFilterChange("page", i + 1)}
                                            className={`w-8 h-8 flex items-center justify-center font-mono text-xs font-black border transition-all ${filters.page === i + 1
                                                ? "bg-neon-cyan text-black border-neon-cyan"
                                                : "bg-white/5 text-zinc-500 border-white/10 hover:border-white/20"
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal for New Post */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowForm(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <div className="w-full max-w-2xl relative z-10">
                            <ThreadForm
                                onSubmit={handleCreateThread}
                                onCancel={() => setShowForm(false)}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
