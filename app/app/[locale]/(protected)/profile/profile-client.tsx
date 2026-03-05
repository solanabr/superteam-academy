"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SectionReveal, StaggerContainer, staggerItem } from "@/components/motion/section-reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
    Zap,
    Star,
    Flame,
    Trophy,
    Target,
    Calendar,
    Github,
    Twitter,
    ExternalLink,
    Settings,
    BadgeCheck,
    BookOpen,
    Wallet,
    MessageCircle,
    Shield,
} from "lucide-react";
import type { UserProfile } from "@/lib/types";
import { TutorialRunner } from "@/components/tutorial-runner";

const rarityColors: Record<string, string> = {
    common: "border-zinc-400/30 bg-zinc-500/5",
    rare: "border-blue-400/30 bg-blue-400/5",
    epic: "border-solana-purple/30 bg-solana-purple/5",
    legendary: "border-amber-400/30 bg-amber-400/5 shadow-amber-400/5",
};

const rarityGlows: Record<string, string> = {
    common: "",
    rare: "hover:shadow-blue-400/10",
    epic: "hover:shadow-solana-purple/10",
    legendary: "hover:shadow-amber-400/15",
};

/**
 * SVG Radar Chart for skills visualization
 */
function SkillRadar({ skills }: { skills: { name: string; level: number }[] }) {
    const n = skills.length;
    const cx = 120;
    const cy = 120;
    const maxR = 90;
    const levels = [25, 50, 75, 100];

    // Angle for each skill (evenly distributed)
    const angleStep = (2 * Math.PI) / n;

    // Generate polygon path for a given radius multiplier
    const polygonPoints = (radiusFraction: number) =>
        skills
            .map((_, i) => {
                const angle = -Math.PI / 2 + i * angleStep;
                const r = maxR * radiusFraction;
                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            })
            .join(" ");

    // Data polygon
    const dataPoints = skills
        .map((skill, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            const r = maxR * (skill.level / 100);
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        })
        .join(" ");

    return (
        <div className="flex flex-col items-center">
            <svg width="240" height="240" viewBox="0 0 240 240" className="drop-shadow-sm">
                {/* Background rings */}
                {levels.map((level) => (
                    <polygon
                        key={level}
                        points={polygonPoints(level / 100)}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-border/40"
                    />
                ))}

                {/* Axis lines */}
                {skills.map((_, i) => {
                    const angle = -Math.PI / 2 + i * angleStep;
                    const x2 = cx + maxR * Math.cos(angle);
                    const y2 = cy + maxR * Math.sin(angle);
                    return (
                        <line
                            key={i}
                            x1={cx}
                            y1={cy}
                            x2={x2}
                            y2={y2}
                            stroke="currentColor"
                            strokeWidth="0.5"
                            className="text-border/30"
                        />
                    );
                })}

                {/* Data polygon */}
                <motion.polygon
                    points={dataPoints}
                    fill="url(#radarGradient)"
                    stroke="url(#radarStroke)"
                    strokeWidth="2"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    viewport={{ once: true }}
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                />

                {/* Data points */}
                {skills.map((skill, i) => {
                    const angle = -Math.PI / 2 + i * angleStep;
                    const r = maxR * (skill.level / 100);
                    return (
                        <motion.circle
                            key={i}
                            cx={cx + r * Math.cos(angle)}
                            cy={cy + r * Math.sin(angle)}
                            r="3.5"
                            fill="var(--solana-purple)"
                            stroke="var(--background)"
                            strokeWidth="2"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.4 + i * 0.05 }}
                            viewport={{ once: true }}
                        />
                    );
                })}

                {/* Skill labels */}
                {skills.map((skill, i) => {
                    const angle = -Math.PI / 2 + i * angleStep;
                    const labelR = maxR + 18;
                    const lx = cx + labelR * Math.cos(angle);
                    const ly = cy + labelR * Math.sin(angle);
                    return (
                        <text
                            key={skill.name}
                            x={lx}
                            y={ly}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[9px] font-medium fill-muted-foreground"
                        >
                            {skill.name}
                        </text>
                    );
                })}

                {/* Gradient defs */}
                <defs>
                    <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--solana-purple)" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="var(--solana-green)" stopOpacity="0.15" />
                    </linearGradient>
                    <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--solana-purple)" />
                        <stop offset="100%" stopColor="var(--solana-green)" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}

export function ProfileClient({
    profile,
    isOwnProfile,
}: {
    profile: UserProfile;
    isOwnProfile: boolean;
}) {
    const t = useTranslations("Profile");

    return (
        <div className="min-h-screen">
            <Header />
            <TutorialRunner pageKey="profile" />
            <main className="pt-28 pb-16">
                <div className="content-container">
                    {/* === PROFILE HEADER === */}
                    <SectionReveal>
                        <div className="relative rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8 backdrop-blur-sm overflow-hidden" data-tutorial="profile-header">
                            {/* Background gradient accent */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-solana-purple to-solana-green" />

                            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-5">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-solana-purple to-solana-green text-2xl font-bold text-white shadow-xl shadow-solana-purple/20">
                                            {profile.displayName[0]}
                                        </div>
                                        {/* Level badge */}
                                        <div className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-lg border-2 border-card">
                                            {profile.level}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h1 className="font-display text-2xl font-bold md:text-3xl">{profile.displayName}</h1>
                                            {profile.isPublic && (
                                                <Badge variant="outline" className="text-[10px] gap-1">
                                                    <BadgeCheck className="h-3 w-3 text-solana-green" />
                                                    Verified
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">@{profile.username}</p>
                                        {profile.bio && (
                                            <p className="mt-2 max-w-lg text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                                        )}
                                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {t("joined")} {new Date(profile.joinDate).toLocaleDateString("en", { month: "short", year: "numeric" })}
                                            </span>
                                            {profile.walletAddress && (
                                                <span className="flex items-center gap-1 font-mono">
                                                    <Wallet className="h-3 w-3" />
                                                    {profile.walletAddress}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Social + Settings */}
                                <div className="flex items-center gap-2">
                                    {profile.socialLinks.github && (
                                        <a
                                            href={profile.socialLinks.github}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all"
                                        >
                                            <Github className="h-4 w-4" />
                                        </a>
                                    )}
                                    {profile.socialLinks.twitter && (
                                        <a
                                            href={profile.socialLinks.twitter}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30 transition-all"
                                        >
                                            <Twitter className="h-4 w-4" />
                                        </a>
                                    )}
                                    {isOwnProfile ? (
                                        <Link href="/settings">
                                            <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                                                <Settings className="h-3.5 w-3.5" />{t("editProfile")}
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Link href={`/messenger?userId=${profile.username}`}>
                                            <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                                                <MessageCircle className="h-3.5 w-3.5" /> Message
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </SectionReveal>

                    {/* === STATS === */}
                    <SectionReveal delay={0.1}>
                        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                            {[
                                { label: t("xp"), value: profile.xp.toLocaleString(), icon: Zap, color: "text-solana-purple" },
                                { label: t("level"), value: String(profile.level), icon: Star, color: "text-amber-500" },
                                { label: t("rank"), value: `#${profile.rank}`, icon: Trophy, color: "text-solana-green" },
                                { label: t("streak"), value: `${profile.streak}d`, icon: Flame, color: "text-orange-500" },
                                { label: t("longestStreak"), value: `${profile.longestStreak}d`, icon: Flame, color: "text-red-500" },
                                { label: t("challengesSolved"), value: String(profile.challengesSolved), icon: Target, color: "text-blue-500" },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-xl border border-border/60 bg-card/80 p-4 text-center backdrop-blur-sm">
                                    <stat.icon className={`mx-auto h-4 w-4 ${stat.color}`} />
                                    <p className="mt-2 font-display text-xl font-bold">{stat.value}</p>
                                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </SectionReveal>

                    <div className="mt-10 grid gap-8 lg:grid-cols-3">
                        {/* Left — Skills Radar + Achievements */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Skills Radar */}
                            <SectionReveal delay={0.15}>
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm">
                                    <h2 className="font-display text-xl font-bold flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-solana-purple" />
                                        {t("skills")}
                                    </h2>
                                    <div className="mt-4 grid gap-6 sm:grid-cols-[240px_1fr] items-center">
                                        {/* Radar chart */}
                                        <SkillRadar skills={profile.skills} />
                                        {/* Skill bars (detail) */}
                                        <div className="space-y-3">
                                            {profile.skills.map((skill) => (
                                                <div key={skill.name} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium">{skill.name}</span>
                                                        <span className="text-muted-foreground text-xs">{skill.level}%</span>
                                                    </div>
                                                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                                                        <motion.div
                                                            className="h-full rounded-full bg-gradient-to-r from-solana-purple to-solana-green"
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: `${skill.level}%` }}
                                                            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                                                            viewport={{ once: true }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </SectionReveal>

                            {/* Achievements */}
                            <SectionReveal delay={0.2}>
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm">
                                    <h2 className="font-display text-xl font-bold flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-amber-500" />
                                        {t("achievements")}
                                    </h2>
                                    <StaggerContainer className="mt-4 grid gap-3 sm:grid-cols-2">
                                        {profile.achievements.map((ach) => (
                                            <motion.div
                                                key={ach.id}
                                                variants={staggerItem}
                                                className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${ach.earnedDate
                                                    ? `${rarityColors[ach.rarity]} ${rarityGlows[ach.rarity]} hover:shadow-md`
                                                    : "border-border/20 opacity-30 grayscale"
                                                    }`}
                                            >
                                                <span className="text-2xl shrink-0">{ach.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate">{ach.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{ach.description}</p>
                                                    {ach.earnedDate && (
                                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                            {t("earned")} {new Date(ach.earnedDate).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] capitalize shrink-0 ${ach.rarity === "legendary" ? "border-amber-400/40 text-amber-600" :
                                                        ach.rarity === "epic" ? "border-solana-purple/40 text-solana-purple" :
                                                            ach.rarity === "rare" ? "border-blue-400/40 text-blue-500" : ""
                                                        }`}
                                                >
                                                    {ach.rarity}
                                                </Badge>
                                            </motion.div>
                                        ))}
                                    </StaggerContainer>
                                </div>
                            </SectionReveal>
                        </div>

                        {/* Right — Courses + Credentials */}
                        <div className="space-y-6">
                            {/* Completed Courses */}
                            <SectionReveal direction="right" delay={0.15}>
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-sm">
                                    <h2 className="font-display text-lg font-bold flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-solana-purple" />
                                        {t("completedCourses")}
                                    </h2>
                                    <div className="mt-4 space-y-3">
                                        {profile.completedCourses.map((cc) => (
                                            <div key={cc.courseId} className="rounded-xl border border-border/40 bg-card/50 p-4">
                                                <p className="text-sm font-semibold">{cc.courseTitle}</p>
                                                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(cc.completedDate).toLocaleDateString()}
                                                    </span>
                                                    <span className="font-semibold text-solana-green flex items-center gap-0.5">
                                                        <Zap className="h-3 w-3" />
                                                        +{cc.xpEarned}
                                                    </span>
                                                </div>
                                                <Badge variant="outline" className="mt-2 text-[10px]">
                                                    Grade: {cc.grade}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </SectionReveal>

                            {/* On-Chain Credentials */}
                            {profile.credentials.length > 0 && (
                                <SectionReveal direction="right" delay={0.2}>
                                    <div className="rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-sm" data-tutorial="credentials-section">
                                        <h2 className="font-display text-lg font-bold flex items-center gap-2">
                                            <BadgeCheck className="h-4 w-4 text-solana-green" />
                                            {t("credentials")}
                                        </h2>
                                        <div className="mt-4 space-y-3">
                                            {profile.credentials.map((cred) => (
                                                <Link
                                                    key={cred.id}
                                                    href={`/certificates/${cred.id}`}
                                                    className="group flex items-center gap-3 rounded-xl border border-solana-purple/20 bg-gradient-to-r from-solana-purple/5 to-solana-green/5 p-4 transition-all hover:border-solana-purple/40 hover:shadow-md hover:shadow-solana-purple/5"
                                                >
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-solana-purple to-solana-green text-white shrink-0 shadow-lg shadow-solana-purple/15">
                                                        <Trophy className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold truncate">{cred.courseTitle}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                                            Issued {new Date(cred.issueDate).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-1 text-[10px] text-solana-green font-medium">
                                                            <BadgeCheck className="h-3 w-3" />
                                                            On-Chain Verified
                                                        </div>
                                                    </div>
                                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </SectionReveal>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
