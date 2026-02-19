"use client";

import { useAuth } from "@/components/providers/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Clock,
    Flame,
    Lock,
    Sparkles,
    Trophy,
    Users,
    Zap,
} from "lucide-react";

const courses = [
    {
        id: "intro-to-solana",
        title: "Intro to Solana",
        description: "Learn the fundamentals of Solana blockchain — accounts, transactions, and the runtime model.",
        xp: 200,
        modules: 8,
        duration: "2 hours",
        difficulty: "Beginner",
        students: "12.4K",
        tags: ["Blockchain", "Fundamentals"],
        emoji: "🚀",
        gradient: "from-emerald-500/20 via-neon-green/10 to-transparent",
        borderGlow: "hover:shadow-[0_0_40px_-10px_rgba(0,255,163,0.3)]",
        accentColor: "text-neon-green",
        barColor: "from-neon-green to-emerald-400",
        unlocked: true,
        progress: 0,
    },
    {
        id: "smart-contracts-101",
        title: "Smart Contracts 101",
        description: "Build your first Anchor program. Deploy, test, and interact with on-chain programs.",
        xp: 500,
        modules: 12,
        duration: "4 hours",
        difficulty: "Intermediate",
        students: "8.2K",
        tags: ["Anchor", "Rust", "Programs"],
        emoji: "⚙️",
        gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
        borderGlow: "hover:shadow-[0_0_40px_-10px_rgba(0,200,255,0.3)]",
        accentColor: "text-neon-cyan",
        barColor: "from-neon-cyan to-blue-400",
        unlocked: true,
        progress: 0,
    },
    {
        id: "defi-on-solana",
        title: "DeFi on Solana",
        description: "Understand SPL tokens, AMMs, liquidity pools, and build a mini swap interface.",
        xp: 750,
        modules: 15,
        duration: "6 hours",
        difficulty: "Intermediate",
        students: "5.7K",
        tags: ["DeFi", "SPL Tokens", "AMM"],
        emoji: "💎",
        gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
        borderGlow: "hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]",
        accentColor: "text-neon-purple",
        barColor: "from-neon-purple to-violet-400",
        unlocked: true,
        progress: 0,
    },
    {
        id: "nft-marketplace",
        title: "NFT Marketplace",
        description: "Create, mint, and trade NFTs. Build a full marketplace with Metaplex and compressed NFTs.",
        xp: 1000,
        modules: 18,
        duration: "8 hours",
        difficulty: "Advanced",
        students: "3.1K",
        tags: ["NFTs", "Metaplex", "cNFTs"],
        emoji: "🎨",
        gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
        borderGlow: "hover:shadow-[0_0_40px_-10px_rgba(251,191,36,0.3)]",
        accentColor: "text-amber-400",
        barColor: "from-amber-400 to-orange-400",
        unlocked: false,
        progress: 0,
    },
    {
        id: "solana-mobile",
        title: "Solana Mobile (SMS)",
        description: "Build mobile-first dApps with Solana Mobile Stack. Integrate wallet adapters for mobile.",
        xp: 800,
        modules: 10,
        duration: "5 hours",
        difficulty: "Advanced",
        students: "1.8K",
        tags: ["Mobile", "dApps", "SMS"],
        emoji: "📱",
        gradient: "from-pink-500/20 via-rose-500/10 to-transparent",
        borderGlow: "hover:shadow-[0_0_40px_-10px_rgba(244,114,182,0.3)]",
        accentColor: "text-pink-400",
        barColor: "from-pink-400 to-rose-400",
        unlocked: false,
        progress: 0,
    },
    {
        id: "blinks-and-actions",
        title: "Blinks & Actions",
        description: "Learn Solana Actions and Blinks — build shareable blockchain interactions for any surface.",
        xp: 600,
        modules: 8,
        duration: "3 hours",
        difficulty: "Intermediate",
        students: "4.5K",
        tags: ["Blinks", "Actions", "Integrations"],
        emoji: "⚡",
        gradient: "from-teal-500/20 via-cyan-500/10 to-transparent",
        borderGlow: "hover:shadow-[0_0_40px_-10px_rgba(45,212,191,0.3)]",
        accentColor: "text-teal-400",
        barColor: "from-teal-400 to-cyan-400",
        unlocked: false,
        progress: 0,
    },
];

const difficultyConfig: Record<string, { label: string; color: string; bg: string }> = {
    Beginner: { label: "Beginner", color: "text-neon-green", bg: "bg-neon-green/10 border-neon-green/20" },
    Intermediate: { label: "Intermediate", color: "text-neon-cyan", bg: "bg-neon-cyan/10 border-neon-cyan/20" },
    Advanced: { label: "Advanced", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
};

export default function CoursesPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

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

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-[#020408] relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-neon-green/[0.03] rounded-full blur-[200px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-purple/[0.03] rounded-full blur-[150px]" />
                <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-neon-cyan/[0.02] rounded-full blur-[180px]" />
            </div>

            {/* Top Bar */}
            <header className="relative z-10 border-b border-white/[0.06]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Dashboard
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-sm font-black text-white tracking-tight">SolLearn</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 mb-12"
                >
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <Sparkles className="w-8 h-8 text-neon-green" />
                        </motion.div>
                        <h1 className="text-3xl md:text-4xl font-black text-white">
                            All Courses
                        </h1>
                    </div>
                    <p className="text-sm text-zinc-400 max-w-lg leading-relaxed">
                        Master Solana development from zero to hero. Earn XP, unlock achievements, and receive soulbound NFT credentials.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                            <BookOpen className="w-3.5 h-3.5 text-neon-green" /> {courses.length} courses
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" /> {courses.reduce((sum, c) => sum + c.xp, 0).toLocaleString()} total XP
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                            <Flame className="w-3.5 h-3.5 text-orange-400" /> {courses.filter(c => c.unlocked).length} unlocked
                        </div>
                    </div>
                </motion.div>

                {/* Course Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course, i) => {
                        const diff = difficultyConfig[course.difficulty];
                        return (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                                whileHover={course.unlocked ? { y: -6, transition: { duration: 0.2 } } : {}}
                                className={`relative rounded-2xl overflow-hidden cursor-pointer group ${course.borderGlow} transition-all duration-300 ${!course.unlocked ? "opacity-50" : ""
                                    }`}
                            >
                                {/* Gradient background glow */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${course.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                {/* Card body */}
                                <div className="relative p-6 bg-white/[0.03] border border-white/[0.08] group-hover:border-white/[0.15] rounded-2xl backdrop-blur-sm transition-all duration-300 h-full flex flex-col">
                                    {/* Lock overlay */}
                                    {!course.unlocked && (
                                        <div className="absolute inset-0 rounded-2xl bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-10">
                                            <motion.div
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: 1 }}
                                                className="flex flex-col items-center gap-3"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <Lock className="w-5 h-5 text-zinc-500" />
                                                </div>
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Complete prerequisites</span>
                                            </motion.div>
                                        </div>
                                    )}

                                    {/* Top row: emoji + difficulty */}
                                    <div className="flex items-start justify-between mb-4">
                                        <motion.div
                                            whileHover={{ scale: 1.15, rotate: 10 }}
                                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] flex items-center justify-center text-2xl"
                                        >
                                            {course.emoji}
                                        </motion.div>
                                        <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider ${diff.bg} ${diff.color}`}>
                                            {diff.label}
                                        </span>
                                    </div>

                                    {/* Title + description */}
                                    <div className="mb-4 flex-1">
                                        <h3 className="text-lg font-black text-white group-hover:text-neon-green transition-colors leading-tight">
                                            {course.title}
                                        </h3>
                                        <p className="text-[12px] text-zinc-500 mt-2 leading-relaxed line-clamp-2">
                                            {course.description}
                                        </p>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {course.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[9px] text-zinc-400 font-bold uppercase tracking-wider group-hover:border-white/[0.12] transition-colors"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Stats row */}
                                    <div className="flex items-center gap-4 mb-4 text-[10px] text-zinc-500 font-bold">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" /> {course.modules} modules
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {course.duration}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" /> {course.students}
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">Progress</span>
                                            <span className="text-[9px] text-zinc-500 font-bold">{course.progress}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${course.progress}%` }}
                                                transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                                                className={`h-full rounded-full bg-gradient-to-r ${course.barColor}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,255,163,0.06)' }}>
                                            <Zap className={`w-3.5 h-3.5 ${course.accentColor}`} />
                                            <span className={`text-xs font-black ${course.accentColor}`}>+{course.xp} XP</span>
                                        </div>

                                        {course.unlocked && (
                                            <motion.button
                                                whileHover={{ scale: 1.05, x: 3 }}
                                                whileTap={{ scale: 0.95 }}
                                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r ${course.barColor} text-black text-[11px] font-black transition-all`}
                                            >
                                                Start
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
