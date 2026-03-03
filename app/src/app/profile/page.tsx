"use client";

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
    Globe,
    Github,
    MessageCircle,
} from "lucide-react";
import { cn, formatXP, xpProgress } from "@/lib/utils";
import { UserService, AchievementService, CredentialService } from "@/services";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

export default function ProfilePage() {
    const t = useTranslations("profile");
    const user = UserService.getProfile();
    const achievements = AchievementService.getAllAchievements();
    const credentials = CredentialService.getCredentials("");
    const progress = xpProgress(user.xp);

    const radarData = user.skills.map((skill) => ({
        subject: skill.name,
        value: (skill.level / skill.maxLevel) * 100,
        fullMark: 100,
    }));

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold">{user.displayName}</h1>
                                    <p className="text-muted-foreground text-sm">@{user.username}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {user.socialLinks.twitter && (
                                        <a href={`https://twitter.com/${user.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                        </a>
                                    )}
                                    {user.socialLinks.github && (
                                        <a href={`https://github.com/${user.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all">
                                            <Github className="w-4 h-4" />
                                        </a>
                                    )}
                                    {user.socialLinks.discord && (
                                        <a href="#" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all">
                                            <MessageCircle className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 max-w-lg">{user.bio}</p>
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {t("joined")} {new Date(user.joinedAt).toLocaleDateString()}</span>
                                {user.walletAddress && <span className="flex items-center gap-1 font-mono">{user.walletAddress}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Skills Radar */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-400" />
                                {t("skills")}
                            </h2>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
                                        <PolarGrid stroke="rgb(var(--border))" />
                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{ fill: "rgb(var(--muted-foreground))", fontSize: 12 }}
                                        />
                                        <Radar
                                            name="Skills"
                                            dataKey="value"
                                            stroke="#9333ea"
                                            fill="#9333ea"
                                            fillOpacity={0.2}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
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
                                            className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-emerald-500 flex items-center justify-center text-white">
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-sm">{cred.name}</h3>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {cred.trackName} · Level {cred.level} · {cred.totalXP} XP
                                                </div>
                                            </div>
                                            <a
                                                href={`https://explorer.solana.com/address/${cred.mintAddress}?cluster=devnet`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                                            >
                                                {t("verifyOnChain")}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column — Achievements */}
                    <div className="space-y-6">
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-400" />
                                {t("achievements")}
                            </h2>
                            <div className="space-y-2">
                                {achievements.map((a) => (
                                    <div
                                        key={a.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl transition-colors",
                                            a.isUnlocked
                                                ? "bg-secondary/20"
                                                : "bg-secondary/5 opacity-50"
                                        )}
                                    >
                                        <span className="text-xl flex-shrink-0">{a.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium">{a.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">{a.description}</div>
                                        </div>
                                        {a.isUnlocked && (
                                            <span className="text-xs text-emerald-400 flex-shrink-0">
                                                +{a.xpReward} XP
                                            </span>
                                        )}
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
