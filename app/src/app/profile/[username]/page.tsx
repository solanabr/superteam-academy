"use client";

import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Award, BookOpen, Zap, Star, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useXP } from "@/hooks/useXP";
import { formatXP } from "@/lib/xp";

const SKILL_DATA = [
    { skill: "Anchor", value: 85 },
    { skill: "DeFi", value: 60 },
    { skill: "NFTs", value: 45 },
    { skill: "Security", value: 70 },
    { skill: "Tokens", value: 80 },
    { skill: "Testing", value: 55 },
];

export default function ProfilePage() {
    const params = useParams();
    const username = params?.username as string;
    const { publicKey } = useWallet();
    const xp = useXP();
    const isOwn = publicKey?.toBase58().startsWith(username);
    const t = useTranslations("profile");

    const BADGES = [
        { name: t("badge_first_lesson"), emoji: "🎓", desc: t("badge_first_lesson_desc") },
        { name: t("badge_anchor"), emoji: "⚓", desc: t("badge_anchor_desc") },
        { name: t("badge_streak"), emoji: "🔥", desc: t("badge_streak_desc") },
    ];

    return (
        <div className="min-h-screen">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
                {/* Profile header */}
                <div className="glass rounded-2xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-green-400/5" />
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-green-400 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                            {username?.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="font-heading text-2xl font-bold">{username}</h1>
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300">Level {isOwn ? xp.level : 4}</span>
                            </div>
                            <p className="text-[hsl(var(--muted-foreground))] mt-1">
                                {t("bio")}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-green-400" /> {isOwn ? formatXP(xp.balance) : "2,450"} XP</span>
                                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-purple-400" /> 2 {t("courses")}</span>
                                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-yellow-400" /> 3 {t("badges_count")}</span>
                            </div>
                        </div>

                        {isOwn && (
                            <Link
                                href="/settings"
                                className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-sm font-medium hover:border-[hsl(var(--primary)/0.5)] transition-colors"
                            >
                                {t("edit_profile")}
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Skills radar */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 text-purple-400" /> {t("skills_radar")}
                        </h2>
                        <ResponsiveContainer width="100%" height={220}>
                            <RadarChart data={SKILL_DATA}>
                                <PolarGrid stroke="hsl(var(--border))" />
                                <PolarAngleAxis dataKey="skill" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                                <Radar
                                    name="Skills"
                                    dataKey="value"
                                    stroke="hsl(263 90% 67%)"
                                    fill="hsl(263 90% 67%)"
                                    fillOpacity={0.25}
                                />
                                <Tooltip
                                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Credentials / NFTs */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-400" /> {t("credentials")}
                        </h2>
                        <div className="space-y-3">
                            <div className="glass rounded-xl p-4 flex items-center gap-3 group hover:border-purple-500/40 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-2xl">
                                    ⚓
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">Anchor Developer</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Beginner Track · 800 XP</p>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors" />
                            </div>
                            <p className="text-xs text-center text-[hsl(var(--muted-foreground))] py-4">
                                {t("complete_more")}
                            </p>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-green-400" /> {t("badges")}
                        </h2>
                        <div className="grid grid-cols-3 gap-3">
                            {BADGES.map((badge) => (
                                <div key={badge.name} className="text-center group">
                                    <div className="w-14 h-14 mx-auto rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                                        {badge.emoji}
                                    </div>
                                    <p className="text-xs font-medium">{badge.name}</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{badge.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}