"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useWallet } from "@solana/wallet-adapter-react";
import { contentService } from "@/lib/services/sanity-content.service";
import { xpService } from "@/lib/services/local-xp.service";
import { streakService } from "@/lib/services/streak.service";
import { SectionReveal, StaggerContainer, staggerItem } from "@/components/motion/section-reveal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { LearningPath } from "@/components/learning-path";
import { TutorialRunner } from "@/components/tutorial-runner";
import { motion } from "framer-motion";
import {
    Zap,
    Star,
    Flame,
    Trophy,
    ArrowRight,
    BookOpen,
    Clock,
    Target,
    CheckCircle2,
    Award,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Loader2,
} from "lucide-react";
import type { DashboardData, ActivityItem } from "@/lib/types";
import { useEnrollment } from "@/lib/enrollment-context";

const activityIcons: Record<string, React.ElementType> = {
    lesson_completed: CheckCircle2,
    challenge_solved: Target,
    course_completed: Trophy,
    achievement_earned: Award,
    streak_milestone: Flame,
};

const activityColors: Record<string, string> = {
    lesson_completed: "text-solana-green bg-solana-green/10",
    challenge_solved: "text-solana-purple bg-solana-purple/10",
    course_completed: "text-amber-500 bg-amber-500/10",
    achievement_earned: "text-solana-blue bg-solana-blue/10",
    streak_milestone: "text-orange-500 bg-orange-500/10",
};

function ActivityRow({ item }: { item: ActivityItem }) {
    const Icon = activityIcons[item.type] || CheckCircle2;
    const color = activityColors[item.type] || "text-muted-foreground bg-accent";
    const date = new Date(item.timestamp);
    const relative = getRelativeTime(date);

    return (
        <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <div className="text-right">
                <p className="text-xs font-semibold text-solana-green">+{item.xpEarned} XP</p>
                <p className="text-xs text-muted-foreground">{relative}</p>
            </div>
        </div>
    );
}

function getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

export function DashboardClient() {
    const t = useTranslations("Dashboard");
    const { publicKey } = useWallet();
    const { activeCourseId, setActiveCourse, enrolledCourseIds } = useEnrollment();
    const [data, setData] = useState<DashboardData | null>(null);
    const [pathExpanded, setPathExpanded] = useState(false);

    useEffect(() => {
        const walletId = publicKey ? publicKey.toString() : "guest";

        Promise.all([
            contentService.getCourses(),
            xpService.getXpBalance(walletId),
        ]).then(([allCourses, xp]) => {
            const level = xpService.getLevel(xp);
            const activeCourses = allCourses.filter(c => enrolledCourseIds.includes(c.id));
            const recommendations = allCourses.filter(c => !enrolledCourseIds.includes(c.id));

            // Get streak data from the streak service
            const currentStreak = streakService.getCurrentStreak(walletId);
            const longestStreak = streakService.getLongestStreak(walletId);
            const recentActivityItems = streakService.getRecentActivity(walletId, 10);

            setData({
                profile: {
                    username: publicKey?.toString().slice(0, 8) ?? "learner",
                    displayName: publicKey ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}` : "Learner",
                    avatar: "",
                    bio: "",
                    joinDate: new Date().toISOString(),
                    xp,
                    level,
                    streak: currentStreak,
                    longestStreak,
                    coursesCompleted: 0,
                    challengesSolved: 0,
                    rank: 0,
                    skills: [],
                    achievements: [],
                    completedCourses: [],
                    credentials: [],
                    socialLinks: {},
                    isPublic: true,
                    walletAddress: publicKey?.toString(),
                },
                activeCourses,
                recommendations,
                recentActivity: recentActivityItems.map(a => ({
                    type: a.type,
                    title: a.title,
                    description: a.description,
                    xpEarned: a.xpEarned,
                    timestamp: a.timestamp,
                })),
            });
        }).catch(console.error);
    }, [publicKey, enrolledCourseIds]);

    const walletId = publicKey ? publicKey.toString() : "guest";
    const activeDays = streakService.getActiveDays(walletId);

    const isDayActive = (date: Date) => {
        return activeDays.some(
            (d) =>
                d.getDate() === date.getDate() &&
                d.getMonth() === date.getMonth() &&
                d.getFullYear() === date.getFullYear()
        );
    };
    const hasPrevDay = (date: Date) => {
        const prev = new Date(date);
        prev.setDate(date.getDate() - 1);
        return isDayActive(prev);
    };
    const hasNextDay = (date: Date) => {
        const next = new Date(date);
        next.setDate(date.getDate() + 1);
        return isDayActive(next);
    };

    const streakModifiers = {
        range_middle: (date: Date) => isDayActive(date) && hasPrevDay(date) && hasNextDay(date),
        range_start: (date: Date) => isDayActive(date) && !hasPrevDay(date) && hasNextDay(date),
        range_end: (date: Date) => isDayActive(date) && hasPrevDay(date) && !hasNextDay(date),
    };

    if (!data) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8 bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-solana-purple" />
            </div>
        );
    }

    const { profile, activeCourses, recentActivity, recommendations } = data;

    // Filter active courses based on selected course in header
    const displayedCourses = activeCourseId
        ? activeCourses.filter((c) => c.id === activeCourseId)
        : activeCourses;

    const levelProgress = xpService.getLevelProgress(profile.xp);

    // Active days from streak service (no more mock data)

    return (
        <div className="min-h-screen">
            <Header />
            <TutorialRunner pageKey="dashboard" />
            <main className="pt-28 pb-16">
                <div className="content-container">
                    {/* Welcome */}
                    <SectionReveal>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-muted-foreground">{t("welcome")}</p>
                                <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                                    {profile.displayName}
                                </h1>
                            </div>
                            <Link href="/courses">
                                <Button className="rounded-full bg-gradient-to-r from-solana-purple to-solana-green text-white hover:brightness-110">
                                    <BookOpen className="mr-2 h-4 w-4" />{t("viewAll")}
                                </Button>
                            </Link>
                        </div>
                    </SectionReveal>


                    {/* Stats Row */}
                    <StaggerContainer className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4" data-tutorial="stats-row">
                        {[
                            { label: t("xp"), value: profile.xp.toLocaleString(), icon: Zap, color: "text-solana-purple" },
                            { label: t("level"), value: String(profile.level), icon: Star, color: "text-amber-500" },
                            { label: t("streak"), value: String(profile.streak), icon: Flame, color: "text-orange-500" },
                            { label: t("completed"), value: String(profile.coursesCompleted), icon: Trophy, color: "text-solana-green" },
                        ].map((stat) => (
                            <motion.div
                                key={stat.label}
                                variants={staggerItem}
                                className="rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                                </div>
                                <p className="mt-2 font-display text-3xl font-bold">{stat.value}</p>
                            </motion.div>
                        ))}
                    </StaggerContainer>

                    {/* Level Progress Banner */}
                    <SectionReveal delay={0.1}>
                        <div className="mt-8 rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm relative overflow-hidden" data-tutorial="level-progress">
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-solana-purple/5 to-transparent border-none pointer-events-none" />
                            <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 relative z-10 gap-2">
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{t("levelProgress", { defaultValue: "Level Progress" })}</h3>
                                    <p className="font-display text-2xl font-bold mt-1">Level {profile.level}</p>
                                </div>
                                <div className="text-left md:text-right">
                                    <span className="text-sm font-semibold">{levelProgress.currentLevelXp} XP</span>
                                    <span className="text-sm mx-1.5 text-muted-foreground/30">/</span>
                                    <span className="text-sm font-semibold text-solana-purple">{levelProgress.nextLevelXp} XP</span>
                                </div>
                            </div>
                            <Progress value={levelProgress.progressPercent} className="h-3 md:h-4 bg-muted/50 w-full relative z-10" />
                            <p className="mt-3 text-xs md:text-sm text-left md:text-right text-muted-foreground relative z-10">
                                {Math.round(levelProgress.nextLevelXp - profile.xp)} XP to Level {profile.level + 1}
                            </p>
                        </div>
                    </SectionReveal>

                    <div className="mt-10 grid gap-8 lg:grid-cols-3">
                        {/* Left Column — Active Courses + Recommendations */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Learning Path — Duolingo-style winding road */}
                            <SectionReveal delay={0.1}>
                                <div data-tutorial="active-courses">
                                    <h2 className="font-display text-xl font-bold">{t("activeCourses")}</h2>
                                    {displayedCourses.length > 0 ? (
                                        <div className="mt-4">
                                            {displayedCourses.map((course) => (
                                                <div key={course.id}>
                                                    {/* Course header with progress */}
                                                    <div className="mb-2 flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-solana-purple/10 to-solana-green/10 shrink-0">
                                                            <BookOpen className="h-4 w-4 text-solana-purple" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                                                            <div className="mt-1 flex items-center gap-2">
                                                                <Progress value={course.progress} className="h-1.5 flex-1" />
                                                                <span className="text-xs text-muted-foreground shrink-0">{course.progress}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* The winding path — truncated with fade */}
                                                    <div className="relative">
                                                        <div
                                                            className={`overflow-hidden transition-all duration-500 ${!pathExpanded ? "max-h-[500px]" : "max-h-none"}`}
                                                        >
                                                            <LearningPath course={course} />
                                                        </div>
                                                        {/* Gradient fade overlay */}
                                                        {!pathExpanded && (
                                                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end justify-center pb-4">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setPathExpanded(true)}
                                                                    className="rounded-full gap-1.5 shadow-lg"
                                                                >
                                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                                    Show more
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {pathExpanded && (
                                                            <div className="flex justify-center pt-2 pb-4">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setPathExpanded(false)}
                                                                    className="rounded-full gap-1.5 text-muted-foreground"
                                                                >
                                                                    <ChevronUp className="h-3.5 w-3.5" />
                                                                    Show less
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-6 rounded-2xl border border-dashed border-border/60 p-8 text-center">
                                            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
                                            <p className="mt-3 text-sm text-muted-foreground">No courses selected. Add a course to start your learning journey!</p>
                                        </div>
                                    )}
                                </div>
                            </SectionReveal>

                            {/* Recommendations */}
                            <SectionReveal delay={0.2}>
                                <div>
                                    <h2 className="font-display text-xl font-bold">{t("recommendations")}</h2>
                                    {recommendations.length > 0 ? (
                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                            {recommendations.slice(0, 4).map((course) => (
                                                <Link
                                                    key={course.id}
                                                    href={`/courses/${course.slug}`}
                                                    className="group rounded-xl border border-border/60 bg-card/80 p-4 transition-all hover:border-border hover:shadow-md"
                                                >
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-solana-purple">{course.track}</span>
                                                    <h3 className="mt-1 font-semibold text-sm group-hover:gradient-text transition-all">{course.title}</h3>
                                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{course.shortDescription}</p>
                                                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>
                                                        <span className="flex items-center gap-1 text-solana-green"><Zap className="h-3 w-3" />+{course.xpReward}</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-4 rounded-2xl border border-dashed border-border/60 p-8 text-center">
                                            <Trophy className="mx-auto h-8 w-8 text-amber-500/40" />
                                            <p className="mt-3 text-sm font-medium">You&apos;re enrolled in everything!</p>
                                            <p className="mt-1 text-xs text-muted-foreground">New courses are added regularly — check back soon.</p>
                                        </div>
                                    )}
                                </div>
                            </SectionReveal>
                        </div>

                        {/* Right Column — Activity Feed (sticky) */}
                        <div className="lg:sticky lg:top-24 lg:self-start">
                            <div className="rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-sm mb-6 flex flex-col items-center" data-tutorial="streak-calendar">
                                <h2 className="font-display text-lg font-bold w-full mb-4">{t("learningStreak", { defaultValue: "Learning Streak" })}</h2>
                                <Calendar
                                    mode="multiple"
                                    selected={mockActiveDays}
                                    modifiers={streakModifiers}
                                    className="rounded-md border-none pointer-events-none shadow-none"
                                />
                                <div className="mt-4 flex items-center justify-center w-full gap-2 text-sm bg-orange-500/10 text-orange-500 py-2.5 rounded-xl border border-orange-500/20">
                                    <Flame className="h-4 w-4" />
                                    <span className="font-semibold">{profile.streak} Day Streak</span>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-sm">
                                <h2 className="font-display text-lg font-bold">{t("recentActivity")}</h2>
                                <div className="mt-4 space-y-1 max-h-[60vh] overflow-y-auto pr-2">
                                    {recentActivity.map((item) => (
                                        <ActivityRow key={item.id} item={item} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
