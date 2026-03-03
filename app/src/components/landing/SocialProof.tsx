"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, Award, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export function SocialProof() {
    const [stats, setStats] = useState<{ totalUsers: number, totalXp: number, totalGraduates: number } | null>(null);

    useEffect(() => {
        fetch("/api/stats")
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(() => { });
    }, []);

    const partners = [
        { name: "Superteam Brazil", logo: "/logo/st-brazil-horizontal.svg" },
        { name: "Solana Foundation", logo: "/logo/solana-foundation.svg" },
    ];

    return (
        <section className="w-full max-w-7xl mx-auto px-6 py-24 space-y-24">
            {/* Stats Grid */}
            <div className="space-y-12">
                <h2 className="text-xs font-mono uppercase tracking-[0.4em] text-text-muted text-center opacity-60">superteam academy stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <StatCard
                        icon={<Users className="h-6 w-6 text-solana" />}
                        label="Active Builders"
                        value={stats?.totalUsers ? stats.totalUsers.toLocaleString() : "..."}
                    />
                    <StatCard
                        icon={<Award className="h-6 w-6 text-amber-400" />}
                        label="Total XP Minted"
                        value={stats?.totalXp ? stats.totalXp.toLocaleString() : "..."}
                    />
                    <StatCard
                        icon={<CheckCircle2 className="h-6 w-6 text-blue-400" />}
                        label="Graduates"
                        value={stats?.totalGraduates ? stats.totalGraduates.toLocaleString() : "..."}
                    />
                </div>
            </div>

            {/* Partners Row */}
            <div className="text-center space-y-14 pb-16">
                <p className="text-sm font-mono uppercase tracking-[0.4em] text-white/90">Empowered by the best in the ecosystem</p>
                <div className="flex flex-wrap items-center justify-center gap-24 opacity-70 grayscale hover:grayscale-0 transition-all duration-700">
                    {partners.map(p => (
                        <div key={p.name} className="relative h-12 md:h-16 w-48">
                            <Image
                                src={p.logo}
                                alt={p.name}
                                fill
                                className="object-contain"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <TestimonialCard
                    quote="The most immersive way to learn Solana. The IDE integration is a game-changer."
                    author="Lucas M."
                    role="Solana Developer"
                />
                <TestimonialCard
                    quote="I went from zero to deploying my first Anchor program in two weeks. Highly recommended."
                    author="Ana S."
                    role="Fullstack Engineer"
                />
                <TestimonialCard
                    quote="The localized content in Portuguese made all the difference for my learning curve."
                    author="Gabriel R."
                    role="Student"
                />
            </div>
        </section>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="glass-panel p-8 border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted">{label}</span>
            </div>
            <p className="text-3xl font-display font-bold text-white tracking-tight">{value}</p>
        </div>
    );
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
    return (
        <div className="glass-panel p-6 border border-white/10 rounded-xl bg-white/5 space-y-4">
            <p className="text-text-secondary italic text-sm leading-relaxed">"{quote}"</p>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-solana/20 border border-solana/20" />
                <div>
                    <p className="text-xs font-bold text-white">{author}</p>
                    <p className="text-[10px] text-text-muted">{role}</p>
                </div>
            </div>
        </div>
    );
}
