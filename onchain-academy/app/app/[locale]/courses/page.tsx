"use client";

import { useAuth } from "@/components/providers/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    BookOpen,
    Flame,
    Trophy,
    Zap,
} from "lucide-react";
import { paths, QuestCard } from "@/components/landing/learning-paths";
import { coursesApi, Course } from "@/lib/courses";

export default function CoursesPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/auth");
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            coursesApi.getCourses().then((res) => {
                // Merge backend data with static visual data from paths based on slug
                const merged = res.data.map(c => {
                    const staticData = paths.find(p => p.slug === c.slug) as any || {};
                    return { ...staticData, ...c, xp: staticData.xp || 1000, duration: staticData.duration || "4 weeks" } as Course;
                });
                setCourses(merged);
                setLoadingCourses(false);
            }).catch(console.error);
        }
    }, [isLoading, isAuthenticated]);

    if (isLoading || loadingCourses) {
        return (
            <div className="min-h-screen bg-[#020408] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-neon-green/30 border-t-neon-green animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    // Use courses if available, otherwise fallback to paths for layout stats
    const displayPaths = courses.length > 0 ? courses : paths;

    return (
        <div className="min-h-screen bg-[#020408] relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-neon-green/[0.03] blur-[200px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-purple/[0.03] blur-[150px]" />
                <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-neon-cyan/[0.02] blur-[180px]" />
                {/* Scanlines */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,163,0.08) 2px, rgba(0,255,163,0.08) 4px)",
                }} />
            </div>

            {/* Top Bar */}
            <header className="relative z-10 border-b border-white/[0.06]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-neon-green transition-colors group font-mono"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            cd ../dashboard
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 border border-neon-green/30 bg-[#080c14] flex items-center justify-center">
                            <Zap className="w-4 h-4 text-neon-green" />
                        </div>
                        <span className="text-sm font-black text-white tracking-tight font-mono">SolLearn</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 mb-12"
                >
                    {/* Terminal heading */}
                    <div className="flex items-center gap-3">
                        <span className="text-neon-green font-mono text-sm">{">"}</span>
                        <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                            quest_lines
                        </span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-white font-mono">
                        Choose Your <span className="text-neon-cyan">Quest</span>
                    </h1>

                    <p className="text-sm text-zinc-400 max-w-xl leading-relaxed font-mono">
                        <span className="text-neon-green/60">// </span>
                        Each quest line is an RPG campaign. Defeat bosses, earn soulbound loot, and prove your mastery on-chain.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] text-[10px] text-zinc-400 uppercase tracking-widest font-bold font-mono">
                            <BookOpen className="w-3.5 h-3.5 text-neon-green" /> {displayPaths.length} Quests
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] text-[10px] text-zinc-400 uppercase tracking-widest font-bold font-mono">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" /> {displayPaths.reduce((sum, p) => sum + ((p as any).xp || 0), 0).toLocaleString()} Total XP
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] text-[10px] text-zinc-400 uppercase tracking-widest font-bold font-mono">
                            <Flame className="w-3.5 h-3.5 text-orange-400" /> {displayPaths.filter(p => !('locked' in p && (p as any).locked)).length} Unlocked
                        </div>
                    </div>
                </motion.div>

                {/* Quest Cards Grid — exact same component from landing page */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {displayPaths.map((path, index) => (
                        <QuestCard key={(path as any)._id || index} path={path as any} index={index} />
                    ))}
                </div>
            </main>
        </div>
    );
}
