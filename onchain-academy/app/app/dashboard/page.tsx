"use client";

import { useAuth } from "@/components/providers/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    Flame,
    Trophy,
    Zap,
    BookOpen,
    Crown,
    LogOut,
    Settings,
    User,
} from "lucide-react";

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const { disconnect, connected } = useWallet();

    const handleSignOut = useCallback(async () => {
        // 1. Clear backend JWT
        logout();
        // 2. Sign out of next-auth (Google session)
        await signOut({ redirect: false });
        // 3. Disconnect wallet if connected
        if (connected) {
            try { await disconnect(); } catch { /* wallet may already be disconnected */ }
        }
        // 4. Redirect to auth page
        router.push("/auth");
    }, [logout, connected, disconnect, router]);

    // Redirect unauthenticated users to auth page
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/auth");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#020408] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated || !user) return null;

    return (
        <div className="min-h-screen bg-[#020408] relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-neon-green/[0.03] rounded-full blur-[200px]" />
                <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-neon-purple/[0.03] rounded-full blur-[150px]" />
            </div>

            {/* Top Bar */}
            <header className="relative z-10 border-b border-white/[0.06]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-sm font-black text-white tracking-tight">SolLearn</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <Settings className="w-4 h-4 text-zinc-500" />
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-zinc-500 hover:text-white"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-xs font-bold">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
                {/* Welcome */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 mb-10"
                >
                    <h1 className="text-3xl font-black text-white">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-cyan">{user.name || user.username || "Builder"}</span>
                    </h1>
                    <p className="text-sm text-zinc-500">Continue your learning journey on Solana.</p>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
                >
                    {[
                        { icon: Zap, label: "Total XP", value: user.totalXP.toLocaleString(), color: "text-neon-green", bg: "from-neon-green/10 to-neon-green/5" },
                        { icon: Crown, label: "Level", value: String(user.level), color: "text-neon-purple", bg: "from-neon-purple/10 to-neon-purple/5" },
                        { icon: Flame, label: "Streak", value: "0 days", color: "text-orange-400", bg: "from-orange-400/10 to-orange-400/5" },
                        { icon: Trophy, label: "NFTs Earned", value: "0", color: "text-amber-400", bg: "from-amber-400/10 to-amber-400/5" },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className={`p-5 rounded-xl bg-gradient-to-br ${stat.bg} border border-white/[0.06] space-y-3`}
                        >
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            <div>
                                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                                <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mt-1">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-neon-cyan" />
                            Continue Learning
                        </h2>
                        <Link
                            href="/courses"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-bold hover:bg-neon-green/20 transition-all"
                        >
                            Browse All Courses
                            <BookOpen className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { title: "Intro to Solana", desc: "Learn the fundamentals of Solana blockchain", xp: 200, progress: 0 },
                            { title: "Smart Contracts 101", desc: "Build your first Anchor program", xp: 500, progress: 0 },
                            { title: "DeFi on Solana", desc: "Understand SPL tokens and AMMs", xp: 750, progress: 0 },
                        ].map((course, i) => (
                            <div
                                key={i}
                                className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group space-y-3"
                            >
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-white group-hover:text-neon-green transition-colors">{course.title}</h3>
                                    <p className="text-[11px] text-zinc-500">{course.desc}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-neon-green flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> +{course.xp} XP
                                    </span>
                                    <span className="text-[10px] text-zinc-600 font-bold">Start →</span>
                                </div>
                                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-cyan transition-all"
                                        style={{ width: `${course.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-10 p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] max-w-sm"
                >
                    <div className="flex items-center gap-4">
                        {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-purple/20 border border-white/10 flex items-center justify-center">
                                <User className="w-6 h-6 text-zinc-500" />
                            </div>
                        )}
                        <div>
                            <div className="text-sm font-bold text-white">{user.name || user.username || "Builder"}</div>
                            <div className="text-[10px] text-zinc-500">{user.email || `@${user.username}`}</div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
