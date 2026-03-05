"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SectionReveal } from "@/components/motion/section-reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Flame, BookOpen, Info, Crown, Medal, Award } from "lucide-react";
import { useEffect } from "react";
import { contentService } from "@/lib/services/sanity-content.service";
import type { LeaderboardEntry, Course } from "@/lib/types";
import { mockLeaderboard } from "@/lib/data";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const rankIcons: Record<number, { icon: React.ElementType; color: string }> = {
    1: { icon: Crown, color: "text-amber-400" },
    2: { icon: Medal, color: "text-zinc-400" },
    3: { icon: Award, color: "text-orange-400" },
};

type Period = "weekly" | "monthly" | "all-time";

export default function LeaderboardPage() {
    const t = useTranslations("Leaderboard");
    const [period, setPeriod] = useState<Period>("all-time");
    const [courseId, setCourseId] = useState<string>("all");
    const [courses, setCourses] = useState<Course[]>([]);

    useEffect(() => {
        contentService.getCourses().then(setCourses).catch(console.error);
    }, []);

    // In a real app, this would fetch based on `period` and `courseId`
    // For MVP, we use the mock data.
    const entries = mockLeaderboard;

    return (
        <div className="min-h-screen">
            <Header />
            <main className="pt-28 pb-16">
                <div className="content-container">
                    {/* Header */}
                    <SectionReveal>
                        <div className="max-w-2xl">
                            <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{t("title")}</h1>
                            <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
                        </div>
                    </SectionReveal>

                    {/* Filters */}
                    <SectionReveal delay={0.1}>
                        <div className="mt-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            {/* Period Tabs */}
                            <div className="flex gap-2">
                                {(["weekly", "monthly", "all-time"] as const).map((p) => (
                                    <Button
                                        key={p}
                                        size="sm"
                                        variant={period === p ? "default" : "outline"}
                                        className={`rounded-full text-xs ${period === p ? "bg-gradient-to-r from-solana-purple to-solana-green text-white border-0" : ""}`}
                                        onClick={() => setPeriod(p)}
                                    >
                                        {t(p === "all-time" ? "allTime" : p)}
                                    </Button>
                                ))}
                            </div>

                            {/* Course Filter */}
                            <Select value={courseId} onValueChange={setCourseId}>
                                <SelectTrigger className="w-[180px] rounded-full text-xs h-9">
                                    <SelectValue placeholder="All Courses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {courses.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </SectionReveal>

                    {/* Leaderboard Table */}
                    <SectionReveal delay={0.15}>
                        <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-2 border-b border-border/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:px-6">
                                <div className="col-span-1">{t("rank")}</div>
                                <div className="col-span-5 md:col-span-4">{t("developer")}</div>
                                <div className="col-span-2 text-right">{t("xp")}</div>
                                <div className="col-span-1 text-right hidden md:block">{t("level")}</div>
                                <div className="col-span-1 text-right hidden md:block">{t("streak")}</div>
                                <div className="col-span-2 text-right hidden md:block">{t("courses")}</div>
                            </div>

                            {/* Rows */}
                            {entries.map((entry) => {
                                const RankIcon = rankIcons[entry.rank]?.icon;
                                const rankColor = rankIcons[entry.rank]?.color;

                                return (
                                    <div
                                        key={entry.rank}
                                        className={`grid grid-cols-12 items-center gap-2 px-4 py-3.5 text-sm transition-colors md:px-6 ${entry.isCurrentUser
                                            ? "bg-solana-purple/5 border-l-2 border-l-solana-purple"
                                            : "hover:bg-accent/30"
                                            } ${entry.rank <= 10 ? "" : "border-t border-dashed border-border/40"}`}
                                    >
                                        {/* Rank */}
                                        <div className="col-span-1 flex items-center">
                                            {RankIcon ? (
                                                <RankIcon className={`h-5 w-5 ${rankColor}`} />
                                            ) : (
                                                <span className="font-mono text-muted-foreground">{entry.rank}</span>
                                            )}
                                        </div>

                                        {/* Developer */}
                                        <div className="col-span-5 md:col-span-4 flex items-center gap-3 min-w-0">
                                            <div className="hidden lg:flex flex-col items-center shrink-0">
                                            </div>
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 ${entry.rank <= 3
                                                ? "bg-gradient-to-br from-solana-purple to-solana-green text-white"
                                                : "bg-accent"
                                                }`}>
                                                {entry.displayName[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">
                                                    {entry.displayName}
                                                    {entry.isCurrentUser && (
                                                        <Badge variant="outline" className="ml-2 text-[10px] text-solana-purple border-solana-purple/30">
                                                            {t("you")}
                                                        </Badge>
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">@{entry.username}</p>
                                            </div>
                                        </div>

                                        {/* XP */}
                                        <div className="col-span-2 text-right">
                                            <span className="font-semibold gradient-text">{entry.xp.toLocaleString()}</span>
                                        </div>

                                        {/* Level */}
                                        <div className="col-span-1 text-right hidden md:flex items-center justify-end gap-1">
                                            <Star className="h-3 w-3 text-amber-400" />
                                            <span>{entry.level}</span>
                                        </div>

                                        {/* Streak */}
                                        <div className="col-span-1 text-right hidden md:flex items-center justify-end gap-1">
                                            <Flame className="h-3 w-3 text-orange-500" />
                                            <span>{entry.streak}d</span>
                                        </div>

                                        {/* Courses */}
                                        <div className="col-span-2 text-right hidden md:flex items-center justify-end gap-1">
                                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                                            <span>{entry.coursesCompleted}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </SectionReveal>

                    {/* How it works */}
                    <SectionReveal delay={0.2}>
                        <div className="mt-8 rounded-xl border border-border/40 bg-card/50 p-5">
                            <div className="flex items-start gap-3">
                                <Info className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                    <h3 className="text-sm font-semibold">{t("howItWorks")}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">{t("howItWorksDesc")}</p>
                                </div>
                            </div>
                        </div>
                    </SectionReveal>
                </div>
            </main>
            <Footer />
        </div>
    );
}
