"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useWallet } from "@solana/wallet-adapter-react";
import { useXP } from "@/hooks/useXP";
import { STATIC_COURSES } from "@/lib/courses";
import { formatXP } from "@/lib/xp";
import { Zap, Flame, BookOpen, Award, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

function XPProgressRing({ progress }: { progress: number }) {
    const r = 36;
    const circ = 2 * Math.PI * r;
    const offset = circ - (progress / 100) * circ;
    return (
        <svg width="88" height="88" className="-rotate-90">
            <circle cx="44" cy="44" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
                cx="44" cy="44" r={r} fill="none"
                stroke="url(#xpGrad)" strokeWidth="6"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
            <defs>
                <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(263 90% 67%)" />
                    <stop offset="100%" stopColor="hsl(162 100% 47%)" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export default function DashboardPage() {
    const { publicKey, connected } = useWallet();
    const xp = useXP();

    if (!connected) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="flex flex-col items-center justify-center mt-32 gap-4 text-center px-4">
                    <Zap className="w-12 h-12 text-[hsl(var(--primary))]" />
                    <h2 className="font-heading text-2xl font-bold">Connect Your Wallet</h2>
                    <p className="text-[hsl(var(--muted-foreground))] max-w-sm">
                        Connect your Solana wallet to view your XP balance, progress, and achievements.
                    </p>
                </div>
                <Footer />
            </div>
        );
    }

    const inProgressCourses = STATIC_COURSES.filter((c) => c.isActive && !c.startingSoon).slice(0, 2);

    return (
        <div className="min-h-screen">
            <Header />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
                <h1 className="font-heading text-3xl font-bold mb-8">Dashboard</h1>

                {/* XP & Level */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    {/* XP Ring */}
                    <div className="glass rounded-2xl p-6 flex items-center gap-5">
                        <div className="relative">
                            <XPProgressRing progress={xp.loading ? 0 : xp.progress} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="font-heading font-bold text-sm">{xp.level}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wide mb-1">XP Balance</p>
                            <p className="font-heading font-bold text-2xl gradient-text">{xp.loading ? "..." : formatXP(xp.balance)}</p>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">{xp.levelTitle} · Level {xp.level}</p>
                        </div>
                    </div>

                    {/* Streak */}
                    <div className="glass rounded-2xl p-6 flex items-center gap-5">
                        <div className="w-16 h-16 rounded-xl bg-orange-500/15 flex items-center justify-center">
                            <Flame className="w-8 h-8 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wide mb-1">Streak</p>
                            <p className="font-heading font-bold text-2xl">3 <span className="text-base font-normal text-[hsl(var(--muted-foreground))]">days</span></p>
                            <p className="text-sm text-orange-400">Keep it up! 🔥</p>
                        </div>
                    </div>

                    {/* Wallet */}
                    <div className="glass rounded-2xl p-6">
                        <p className="text-xs text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wide mb-3">Wallet</p>
                        <p className="font-mono text-sm text-[hsl(var(--foreground))] break-all">
                            {publicKey?.toBase58().slice(0, 20)}...
                        </p>
                        <Link
                            href={`https://explorer.solana.com/address/${publicKey?.toBase58()}?cluster=devnet`}
                            target="_blank"
                            className="text-xs text-[hsl(var(--primary))] hover:underline flex items-center gap-1 mt-2"
                        >
                            View on Explorer <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Continue Learning */}
                    <div className="lg:col-span-2">
                        <h2 className="font-heading text-xl font-semibold mb-4">Continue Learning</h2>
                        <div className="space-y-4">
                            {inProgressCourses.map((course) => (
                                <Link
                                    key={course.id}
                                    href={`/courses/${course.slug}/lessons/0`}
                                    className="glass rounded-xl p-5 flex items-center gap-4 hover:border-[hsl(var(--primary)/0.4)] transition-colors group"
                                >
                                    <img src={course.thumbnail} alt={course.title} className="w-14 h-14 rounded-lg object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm mb-1 truncate">{course.title}</p>
                                        <div className="h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                                            <div className="h-full w-1/4 bg-gradient-to-r from-purple-500 to-green-400 rounded-full" />
                                        </div>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">2 / {course.lessonCount} lessons</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-[hsl(var(--primary))] group-hover:translate-x-1 transition-transform shrink-0" />
                                </Link>
                            ))}

                            <Link
                                href="/courses"
                                className="block glass rounded-xl p-5 text-center text-sm text-[hsl(var(--primary))] font-semibold hover:border-[hsl(var(--primary)/0.4)] transition-colors"
                            >
                                Browse All Courses →
                            </Link>
                        </div>
                    </div>

                    {/* Stats sidebar */}
                    <div className="space-y-4">
                        <h2 className="font-heading text-xl font-semibold">Your Stats</h2>

                        {[
                            { label: "Lessons Completed", value: "12", icon: BookOpen, color: "text-purple-400 bg-purple-400/10" },
                            { label: "Achievements", value: "3", icon: Award, color: "text-yellow-400 bg-yellow-400/10" },
                            { label: "Rank", value: "#42", icon: TrendingUp, color: "text-green-400 bg-green-400/10" },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="glass rounded-xl p-4 flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-heading font-bold text-xl">{value}</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
                                </div>
                            </div>
                        ))}

                        <Link
                            href={`/profile/${publicKey?.toBase58().slice(0, 8)}`}
                            className="block glass rounded-xl p-4 text-center text-sm text-[hsl(var(--primary))] font-semibold hover:border-[hsl(var(--primary)/0.4)] transition-colors"
                        >
                            View Public Profile →
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
