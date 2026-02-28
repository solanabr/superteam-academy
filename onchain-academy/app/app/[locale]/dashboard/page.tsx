"use client";

import { useAuth } from "@/components/providers/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    Award,
    BarChart3,
    BookOpen,
    ChevronRight,
    Crown,
    Flame,
    LogOut,
    Settings,
    Trophy,
    User,
    Zap,
    Target,
    Activity,
    Shield
} from "lucide-react";
import { dashboardApi, DashboardData } from "@/lib/dashboard";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
    const t = useTranslations("Dashboard");
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
    const router = useRouter();
    const { disconnect, connected } = useWallet();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleSignOut = useCallback(async () => {
        logout();
        await signOut({ redirect: false });
        if (connected) {
            try { await disconnect(); } catch { }
        }
        router.push("/auth");
    }, [logout, connected, disconnect, router]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/auth");
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            setLoading(true);
            dashboardApi.getDashboardData()
                .then(res => setDashboardData(res.data))
                .catch(err => {
                    console.error("Dashboard error:", err);
                    setError(t("failedToLoad"));
                })
                .finally(() => setLoading(false));
        }
    }, [isAuthenticated, t]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#050810] flex items-center justify-center font-mono">
                <div className="space-y-4 text-center">
                    <div className="w-12 h-12 border-2 border-neon-green/20 border-t-neon-green rounded-full animate-spin mx-auto" />
                    <p className="text-zinc-500 text-sm animate-pulse tracking-widest">{t("connecting")}</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) return null;

    return (
        <div className="min-h-screen bg-[#050810] relative overflow-hidden flex flex-col font-sans">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.015] to-transparent" />
            </div>

            {/* Top Bar */}
            <header className="relative z-10 border-b border-white/5 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 text-white">
                            <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-white tracking-widest uppercase font-mono">SolLearn</span>
                    </div>
                    <nav className="flex items-center gap-2">
                        <Link href="/courses" className="flex items-center gap-1.5 px-3 py-2 text-[10px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-mono font-bold">
                            <BookOpen className="w-3.5 h-3.5" /> {t("courses")}
                        </Link>
                        <Link href="/leaderboard" className="flex items-center gap-1.5 px-3 py-2 text-[10px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-mono font-bold">
                            <BarChart3 className="w-3.5 h-3.5" /> {t("leaderboard")}
                        </Link>
                        <Link href="/profile" className="flex items-center gap-1.5 px-3 py-2 text-[10px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-mono font-bold">
                            <User className="w-3.5 h-3.5" /> {t("profile")}
                        </Link>
                        <div className="w-px h-5 bg-white/[0.06] mx-2" />
                        <Link href="/settings" className="p-2 text-zinc-500 hover:text-white transition-colors">
                            <Settings className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-3 py-1.5 text-zinc-600 hover:text-red-400 transition-colors uppercase text-[10px] tracking-widest font-black font-mono"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            {t("signOut")}
                        </button>
                    </nav>
                </div>
            </header>

            {/* Content */}
            <main className="relative z-10 flex-1 px-4 py-12 md:py-16 lg:py-20">
                <div className="max-w-6xl mx-auto">

                    {/* Welcome Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 md:mb-12 space-y-4"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-neon-cyan font-mono text-sm">{">"}</span>
                            <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                                {t("playerDashboard")}
                            </span>
                            <div className="w-24 h-px bg-white/[0.06]" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                            {t("welcomeToArena")}{" "}
                            <span className="text-amber-400">{user.name || user.username || t("builder")}</span>
                        </h1>
                        <p className="text-sm text-zinc-400 font-mono mt-4 leading-relaxed max-w-xl">
                            <span className="text-neon-cyan/60">// </span>
                            {t("reviewStats")}
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Left Column (Main Stats & Profile) */}
                        <div className="lg:col-span-4 space-y-5">
                            {/* Profile / Stats Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden"
                            >
                                <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between font-mono">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">{t("playerCard")}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse" /> {t("live")}</span>
                                </div>

                                <div className="p-5 space-y-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 border border-white/10 bg-white/5 flex items-center justify-center text-2xl relative">
                                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover grayscale opacity-80" alt="" /> : "🧑‍💻"}
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-neon-purple/20 border border-neon-purple/40 flex items-center justify-center text-[10px] font-mono font-black text-neon-purple">
                                                {dashboardData?.xp.level || user.level || 1}
                                            </div>
                                        </div>
                                        <div className="font-mono">
                                            <div className="text-white font-bold flex items-center gap-2">
                                                {user.username || t("initiate")}
                                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20">{t("active")}</span>
                                            </div>
                                            <div className="text-[10px] text-zinc-500 mt-1">{user.email || t("noEmail")}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 font-mono">
                                        <div className="p-3 bg-white/[0.02] border border-white/5 text-center space-y-1">
                                            <div className="text-xl font-black text-neon-green flex justify-center items-center gap-1">
                                                {(dashboardData?.xp.total || user.totalXP || 0).toLocaleString()}
                                            </div>
                                            <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">{t("totalXp")}</div>
                                        </div>
                                        <div className="p-3 bg-white/[0.02] border border-white/5 text-center space-y-1">
                                            <div className="text-xl font-black text-orange-400">
                                                {dashboardData?.streak.current || 0}
                                            </div>
                                            <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">{t("dayStreak")}</div>
                                        </div>
                                    </div>

                                    <Link href="/profile" className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-mono font-bold text-neon-cyan uppercase tracking-widest hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-colors">
                                        {t("viewFullProfile")} <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </motion.div>

                            {/* Recent Achievements */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden"
                            >
                                <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between font-mono">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">{t("trophies")}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-bold">0 {t("unlocked")}</span>
                                </div>
                                <div className="p-5 flex flex-col items-center justify-center text-center space-y-3 min-h-[150px]">
                                    <Trophy className="w-8 h-8 text-zinc-700 mx-auto" />
                                    <div className="text-xs text-zinc-600 font-mono uppercase tracking-widest font-black">{t("noLootYet")}</div>
                                    <div className="text-[10px] text-zinc-500 font-mono">{t("completeQuests")}</div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column (Quests / Actions) */}
                        <div className="lg:col-span-8 space-y-5">
                            {/* Current Active Quests */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden"
                            >
                                <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between font-mono">
                                    <div className="flex items-center gap-2">
                                        <Target className="w-4 h-4 text-neon-cyan" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">{t("activeQuests")}</span>
                                    </div>
                                    <Link href="/courses" className="text-[10px] text-neon-cyan hover:text-neon-cyan/80 font-bold uppercase tracking-wider flex items-center gap-0.5">
                                        {t("browseQuests")} <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>

                                <div className="p-5 space-y-4">
                                    {dashboardData?.activeCourses && dashboardData.activeCourses.length > 0 ? (
                                        dashboardData.activeCourses.map((course, i) => (
                                            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10 transition-all font-mono group">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-12 h-12 flex items-center justify-center text-xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
                                                        {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover grayscale" /> : "📜"}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-white text-sm truncate">{course.title}</span>
                                                            <span className="text-[8px] px-1.5 py-0.5 uppercase tracking-widest font-black bg-white/5 text-zinc-400 border border-white/10">
                                                                {course.difficulty}
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 bg-white/5 overflow-hidden mt-2">
                                                            <div className="h-full bg-neon-cyan transition-all duration-500" style={{ width: `${course.progress.percent}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end gap-4 min-w-[140px]">
                                                    <div className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1">
                                                        <Zap className="w-3 h-3" /> +{course.totalXP} {t("xp")}
                                                    </div>
                                                    <Link href={`/courses/${course.slug}`}>
                                                        <button className="text-[10px] text-neon-cyan font-bold uppercase tracking-widest hover:text-neon-cyan/80 flex items-center gap-1">
                                                            {course.progress.percent > 0 ? t("continue") : t("start")} <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 border border-dashed border-white/10">
                                            <BookOpen className="w-8 h-8 text-zinc-700" />
                                            <div className="space-y-1">
                                                <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{t("noActiveQuests")}</div>
                                                <p className="text-[10px] text-zinc-600">{t("noEnrolledCourses")}</p>
                                            </div>
                                            <Link href="/courses" className="px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[10px] font-black uppercase tracking-widest hover:bg-neon-cyan/20 transition-colors">
                                                {t("startFirstQuest")}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Recommended Quests */}
                            {dashboardData?.recommendedCourses && dashboardData.recommendedCourses.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden"
                                >
                                    <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between font-mono">
                                        <div className="flex items-center gap-2">
                                            <Crown className="w-4 h-4 text-amber-400" />
                                            <span className="text-sm font-bold text-white uppercase tracking-wider">{t("recommendedQuests")}</span>
                                        </div>
                                    </div>
                                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {dashboardData.recommendedCourses.map((course, i) => (
                                            <Link key={i} href={`/courses/${course.slug}`} className="group p-3 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all font-mono block">
                                                <div className="aspect-video w-full bg-white/5 mb-3 overflow-hidden">
                                                    {course.thumbnail ? (
                                                        <img src={course.thumbnail} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-700">📜</div>
                                                    )}
                                                </div>
                                                <div className="text-[10px] font-black text-white truncate group-hover:text-neon-cyan transition-colors">{course.title}</div>
                                                <div className="flex items-center justify-between mt-2 text-[8px] font-bold">
                                                    <span className="text-zinc-500 uppercase">{course.difficulty}</span>
                                                    <span className="text-amber-400">+{course.totalXP} {t("xp")}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}