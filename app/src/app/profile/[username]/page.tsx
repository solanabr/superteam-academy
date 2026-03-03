"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
    Zap,
    Trophy,
    Award,
    BookOpen,
    Calendar,
    ExternalLink,
    Shield,
    Lock,
} from "lucide-react";
import { cn, formatXP, xpProgress } from "@/lib/utils";
import { UserService, AchievementService, CredentialService, CourseService } from "@/services";

export default function PublicProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = use(params);
    const t = useTranslations("profile");

    // In production, fetch by username. For now, use mock user.
    const user = UserService.getProfile();
    const achievements = AchievementService.getAllAchievements().filter((a) => a.isUnlocked);
    const credentials = CredentialService.getCredentials("");
    const completedCourses = user.completedCourses.map((id) =>
        CourseService.getCourseBySlug(id)
    ).filter(Boolean);
    const progress = xpProgress(user.xp);

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-6 sm:p-8 mb-6"
                >
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                            {user.displayName.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold">{user.displayName}</h1>
                            <p className="text-muted-foreground text-sm">@{username}</p>
                            <p className="text-sm text-muted-foreground mt-2 max-w-lg">{user.bio}</p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {t("joined")} {new Date(user.joinedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{formatXP(user.xp)}</div>
                            <div className="text-xs text-muted-foreground">{t("totalXP")}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{progress.level}</div>
                            <div className="text-xs text-muted-foreground">Level</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">#{user.rank}</div>
                            <div className="text-xs text-muted-foreground">{t("rank")}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{user.completedCourses.length}</div>
                            <div className="text-xs text-muted-foreground">{t("completedCourses")}</div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Achievements */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-400" />
                            {t("achievements")} ({achievements.length})
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {achievements.map((a) => (
                                <div
                                    key={a.id}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/20"
                                    title={a.description}
                                >
                                    <span className="text-lg">{a.icon}</span>
                                    <span className="text-sm font-medium">{a.name}</span>
                                </div>
                            ))}
                            {achievements.length === 0 && (
                                <p className="text-sm text-muted-foreground">No achievements yet</p>
                            )}
                        </div>
                    </div>

                    {/* Credentials */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-emerald-400" />
                            {t("credentials")}
                        </h2>
                        {credentials.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t("noCredentials")}</p>
                        ) : (
                            <div className="space-y-3">
                                {credentials.map((cred) => (
                                    <div
                                        key={cred.id}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-emerald-500 flex items-center justify-center text-white">
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-sm">{cred.name}</h3>
                                            <div className="text-xs text-muted-foreground">
                                                Level {cred.level} · {cred.totalXP} XP
                                            </div>
                                        </div>
                                        <a
                                            href={`https://explorer.solana.com/address/${cred.mintAddress}?cluster=devnet`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Completed Courses */}
                    <div className="glass rounded-2xl p-6 lg:col-span-2">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-purple-400" />
                            {t("completedCourses")}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {completedCourses.length === 0 && (
                                <p className="text-sm text-muted-foreground">No courses completed yet</p>
                            )}
                            {completedCourses.map((course) =>
                                course ? (
                                    <div
                                        key={course.slug}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                            style={{ background: course.trackColor }}
                                        >
                                            {course.track.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{course.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {course.difficulty} · {course.xpReward} XP
                                            </div>
                                        </div>
                                        <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    </div>
                                ) : null
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
