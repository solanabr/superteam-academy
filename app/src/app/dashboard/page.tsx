"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
    Zap,
    Trophy,
    Flame,
    BookOpen,
    ChevronRight,
    Clock,
    Star,
    ArrowRight,
    TrendingUp,
    Calendar,
} from "lucide-react";
import { cn, formatXP, xpProgress } from "@/lib/utils";
import { UserService, AchievementService } from "@/services";
import { MOCK_COURSE_PROGRESS, MOCK_ACTIVITY, MOCK_COURSES } from "@/lib/mock-data";

export default function DashboardPage() {
    const t = useTranslations("dashboard");
    const tCommon = useTranslations("common");
    const user = UserService.getProfile();
    const achievements = AchievementService.getUnlockedAchievements();
    const progress = xpProgress(user.xp);
    const courseProgress = MOCK_COURSE_PROGRESS;
    const activity = MOCK_ACTIVITY;

    // Generate streak calendar
    const today = new Date();
    const calendarDays: { date: string; active: boolean; day: number }[] = [];
    for (let i = 27; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        calendarDays.push({
            date: key,
            active: user.streak.history[key] || false,
            day: d.getDate(),
        });
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-1">
                        {t("welcome")}, <span className="gradient-text">{user.displayName}</span>! 👋
                    </h1>
                    <p className="text-muted-foreground">Keep up the great work. Your learning journey continues.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* XP */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl p-5 card-hover"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-purple-400" />
                            </div>
                            <span className="text-sm text-muted-foreground">{t("xpBalance")}</span>
                        </div>
                        <div className="text-2xl font-bold">{formatXP(user.xp)}</div>
                        <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>{t("level")} {progress.level}</span>
                                <span>{t("level")} {progress.level + 1}</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress.percentage}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Level */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass rounded-2xl p-5 card-hover"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            </div>
                            <span className="text-sm text-muted-foreground">{t("level")}</span>
                        </div>
                        <div className="text-2xl font-bold">{progress.level}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {progress.current} / {progress.needed} XP to next
                        </div>
                    </motion.div>

                    {/* Streak */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-2xl p-5 card-hover"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                <Flame className="w-5 h-5 text-orange-400" />
                            </div>
                            <span className="text-sm text-muted-foreground">{t("currentStreak")}</span>
                        </div>
                        <div className="text-2xl font-bold">{user.streak.current}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {t("longestStreak")}: {user.streak.longest} {t("days")}
                        </div>
                    </motion.div>

                    {/* Achievements */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass rounded-2xl p-5 card-hover"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-amber-400" />
                            </div>
                            <span className="text-sm text-muted-foreground">{t("recentAchievements")}</span>
                        </div>
                        <div className="text-2xl font-bold">{achievements.length}</div>
                        <div className="flex gap-1 mt-2">
                            {achievements.slice(0, 4).map((a) => (
                                <span key={a.id} className="text-lg" title={a.name}>
                                    {a.icon}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column — Courses & Activity */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Current Courses */}
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">{t("currentCourses")}</h2>
                                <Link href="/courses" className="text-sm text-primary flex items-center gap-1">
                                    {tCommon("viewAll")} <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {courseProgress.length === 0 ? (
                                <div className="text-center py-8">
                                    <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground mb-3">{t("noCourses")}</p>
                                    <Link
                                        href="/courses"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground"
                                    >
                                        {t("startExploring")} <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {courseProgress.map((cp) => (
                                        <Link
                                            key={cp.courseId}
                                            href={`/courses/${cp.courseSlug}`}
                                            className="group flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/30 transition-colors"
                                        >
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    background: `linear-gradient(135deg, ${MOCK_COURSES.find((c) => c.courseId === cp.courseId)?.trackColor || "#9945ff"
                                                        }30 0%, transparent 100%)`,
                                                }}
                                            >
                                                <BookOpen
                                                    className="w-6 h-6 opacity-50"
                                                    style={{
                                                        color: MOCK_COURSES.find((c) => c.courseId === cp.courseId)?.trackColor || "#9945ff",
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                                    {cp.courseTitle}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <span>
                                                        {cp.completedLessons}/{cp.totalLessons} lessons
                                                    </span>
                                                    <span>·</span>
                                                    <span>{cp.xpEarned} XP</span>
                                                </div>
                                                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full transition-all"
                                                        style={{ width: `${cp.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 hidden sm:block">
                                                <div className="text-sm font-bold">{Math.round(cp.progress)}%</div>
                                                {cp.nextLessonTitle && (
                                                    <div className="text-xs text-muted-foreground mt-0.5">{t("nextLesson")}: {cp.nextLessonTitle}</div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Activity Feed */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4">{t("recentActivity")}</h2>
                            <div className="space-y-3">
                                {activity.slice(0, 5).map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/20 transition-colors"
                                    >
                                        <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium">{item.title}</div>
                                            <div className="text-xs text-muted-foreground">{item.description}</div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            {item.xpEarned > 0 && (
                                                <span className="text-xs font-medium text-emerald-400">
                                                    +{item.xpEarned} XP
                                                </span>
                                            )}
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column — Streak & Recommendations */}
                    <div className="space-y-6">
                        {/* Streak Calendar */}
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Flame className="w-5 h-5 text-orange-400" />
                                <h2 className="text-lg font-semibold">Streak Calendar</h2>
                            </div>
                            <div className="grid grid-cols-7 gap-1.5">
                                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                                    <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">
                                        {d}
                                    </div>
                                ))}
                                {calendarDays.map((day, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "aspect-square rounded-md flex items-center justify-center text-xs transition-colors",
                                            day.active
                                                ? "bg-emerald-500/20 text-emerald-400 font-medium"
                                                : "bg-secondary/30 text-muted-foreground"
                                        )}
                                        title={day.date}
                                    >
                                        {day.day}
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded bg-emerald-500/20" />
                                    Active
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded bg-secondary/30" />
                                    Inactive
                                </div>
                            </div>
                        </div>

                        {/* Recommended Courses */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4">{t("recommendedCourses")}</h2>
                            <div className="space-y-3">
                                {MOCK_COURSES.filter(
                                    (c) => !user.enrolledCourses.includes(c.courseId) && !user.completedCourses.includes(c.courseId)
                                )
                                    .slice(0, 3)
                                    .map((course) => (
                                        <Link
                                            key={course.id}
                                            href={`/courses/${course.slug}`}
                                            className="group flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-colors"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${course.trackColor}15` }}
                                            >
                                                <Star className="w-5 h-5" style={{ color: course.trackColor }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                                                    {course.title}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                    <span className="capitalize">{course.difficulty}</span>
                                                    <span>·</span>
                                                    <span>+{course.xpReward} XP</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </Link>
                                    ))}
                            </div>
                        </div>

                        {/* Achievements */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4">{t("recentAchievements")}</h2>
                            <div className="grid grid-cols-3 gap-2">
                                {achievements.slice(0, 6).map((a) => (
                                    <div
                                        key={a.id}
                                        className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors"
                                        title={a.name}
                                    >
                                        <span className="text-2xl">{a.icon}</span>
                                        <span className="text-xs text-muted-foreground text-center truncate w-full">
                                            {a.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
