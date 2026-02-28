"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Award,
    BookOpen,
    Calendar,
    CheckCircle2,
    Crown,
    ExternalLink,
    Eye,
    EyeOff,
    Flame,
    Github,
    Globe,
    Shield,
    Star,
    Trophy,
    Twitter,
    User,
    Zap,
    Settings,
} from "lucide-react";
import { profileApi, ProfileData } from "@/lib/profile";
import { useAuth } from "@/components/providers/auth-context";
import { useTranslations } from "next-intl";

/* ── Radar chart (CSS-based) ─────────────────────────── */
function SkillRadar({ skills }: { skills: { name: string; value: number }[] }) {
    const n = skills.length;
    if (n === 0) return null;
    const cx = 100, cy = 100, r = 75;
    const angleStep = (2 * Math.PI) / n;

    const bgPoints = Array.from({ length: n }, (_, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(" ");

    const dataPoints = skills.map((s, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        const sr = (s.value / 100) * r;
        return `${cx + sr * Math.cos(angle)},${cy + sr * Math.sin(angle)}`;
    }).join(" ");

    return (
        <div className="relative w-[200px] h-[200px] mx-auto filter drop-shadow-[0_0_15px_rgba(0,255,163,0.15)]">
            <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Grid circles (Hexagonal/Polygonal look) */}
                {[0.25, 0.5, 0.75, 1].map((scale) => (
                    <polygon
                        key={scale}
                        points={Array.from({ length: n }, (_, i) => {
                            const angle = -Math.PI / 2 + i * angleStep;
                            return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`;
                        }).join(" ")}
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                    />
                ))}
                {/* Axes */}
                {skills.map((_, i) => {
                    const angle = -Math.PI / 2 + i * angleStep;
                    return (
                        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="2 2" />
                    );
                })}
                {/* Data polygon */}
                <polygon points={dataPoints} fill="rgba(0,255,163,0.15)" stroke="#00ffa3" strokeWidth="1.5" />
                {/* Data point glowing dots */}
                {skills.map((s, i) => {
                    const angle = -Math.PI / 2 + i * angleStep;
                    const sr = (s.value / 100) * r;
                    return (
                        <circle key={`dot-${i}`} cx={cx + sr * Math.cos(angle)} cy={cy + sr * Math.sin(angle)} r="2.5" fill="#00ffa3" />
                    );
                })}
                {/* Labels */}
                {skills.map((s, i) => {
                    const angle = -Math.PI / 2 + i * angleStep;
                    const tx = cx + (r + 18) * Math.cos(angle);
                    const ty = cy + (r + 18) * Math.sin(angle);
                    return (
                        <text key={i} x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" className="fill-zinc-400 text-[8px] font-bold font-mono tracking-wider">
                            {s.name}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}

export default function ProfilePage() {
    const t = useTranslations("Profile");
    const { username } = useParams<{ username: string }>();
    const { user: authUser } = useAuth();
    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isMe = authUser?.username === username || username === "me";

    useEffect(() => {
        setLoading(true);
        const fetchProfile = isMe
            ? profileApi.getMe()
            : profileApi.getPublicProfile(username);

        fetchProfile
            .then(res => setData(res.data))
            .catch(err => {
                console.error("Failed to fetch profile:", err);
                setError(err.message || t("failedToLoad"));
            })
            .finally(() => setLoading(false));
    }, [username, isMe, t]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050810] flex items-center justify-center font-mono">
                <div className="space-y-4 text-center">
                    <div className="w-12 h-12 border-2 border-neon-green/20 border-t-neon-green rounded-full animate-spin mx-auto" />
                    <p className="text-zinc-500 text-sm animate-pulse tracking-widest">{t("connecting")}</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#050810] flex items-center justify-center font-mono">
                <div className="p-8 border border-red-500/20 bg-red-500/5 text-center space-y-4 max-w-md">
                    <Shield className="w-12 h-12 text-red-500 mx-auto opacity-50" />
                    <h2 className="text-white font-black uppercase tracking-wider">{t("accessDenied")}</h2>
                    <p className="text-zinc-500 text-xs leading-relaxed">{error || t("profileNotFound")}</p>
                    <Link href="/dashboard" className="inline-block px-4 py-2 border border-white/10 text-xs text-white hover:bg-white/5 transition-colors">
                        {t("returnToDashboard")}
                    </Link>
                </div>
            </div>
        );
    }

    const { profile, xp } = data;
    const nextLevelXP = Math.pow((profile.level + 1), 2) * 100;
    const currentLevelXP = Math.pow(profile.level, 2) * 100;
    const xp_total = xp.total;
    const levelProgress = ((xp_total - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

    // Default skills if none present
    const skills = [
        { name: "Rust", value: 72 },
        { name: "Anchor", value: 58 },
        { name: "Frontend", value: 85 },
        { name: "Security", value: 40 },
        { name: "DeFi", value: 65 },
        { name: "NFTs", value: 50 },
    ];

    const getRankTitle = (level: number) => {
        if (level >= 15) return t("grandmaster");
        if (level >= 12) return t("champion");
        if (level >= 9) return t("veteran");
        if (level >= 6) return t("warrior");
        if (level >= 3) return t("fighter");
        return t("initiate");
    };

    return (
        <div className="min-h-screen bg-[#050810] relative overflow-hidden font-sans">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-green/[0.015] to-transparent" />
            </div>

            {/* Top Bar */}
            <header className="relative z-10 border-b border-white/5 bg-white/[0.02]">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-neon-green transition-colors group font-mono">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        {t("cdDashboard")}
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 border border-white/10 bg-white/5 flex items-center justify-center text-white">
                            <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-white tracking-widest uppercase font-mono">SolLearn</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-6 py-10">

                {/* ── Profile Header Card ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden relative"
                >
                    {/* Character Sheet Background accent */}
                    <div className="absolute right-0 top-0 w-[400px] h-full bg-gradient-to-l from-neon-green/5 to-transparent pointer-events-none" />

                    <div className="flex flex-col md:flex-row gap-6 items-start p-6 md:p-8 relative z-10">
                        {/* Avatar Box */}
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] border border-white/10 flex items-center justify-center shrink-0 relative group">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt="" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500" />
                            ) : (
                                <User className="w-12 h-12 md:w-16 md:h-16 text-zinc-600 group-hover:text-amber-400 transition-colors duration-500" />
                            )}
                            {/* Decorative corner brackets */}
                            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-neon-green/50" />
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-neon-green/50" />
                        </div>

                        <div className="flex-1 space-y-4 font-mono">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">{profile.name || profile.username}</h1>
                                        <span className="px-2 py-0.5 border border-amber-400/30 bg-amber-400/10 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                                            {getRankTitle(profile.level)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-sm text-neon-green bg-neon-green/5 px-2 font-bold select-all">@{profile.username}</span>
                                        {isMe && (
                                            <button
                                                onClick={() => profileApi.updateMe({ isPublic: !profile.isPublic }).then(res => setData(res.data))}
                                                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-white/[0.08] text-[10px] text-zinc-500 hover:text-white hover:border-white/20 transition-all font-bold uppercase tracking-wider"
                                            >
                                                {profile.isPublic ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-red-400" />}
                                                {profile.isPublic ? t("publicProfile") : t("privateProfile")}
                                            </button>
                                        )}
                                        {isMe && (
                                            <Link href="/settings" className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-white/[0.08] text-[10px] text-zinc-500 hover:text-white hover:border-white/20 transition-all font-bold uppercase tracking-wider">
                                                <Settings className="w-3 h-3" />
                                                {t("editProfile")}
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-start sm:items-end gap-1">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t("classBio")}</div>
                                    <p className="text-xs text-zinc-400 max-w-md sm:text-right leading-relaxed border-l-2 sm:border-l-0 sm:border-r-2 border-amber-400/30 pl-3 sm:pl-0 sm:pr-3 py-1">
                                        {profile.bio || t("noBio")}
                                    </p>
                                </div>
                            </div>

                            <div className="h-px w-full bg-gradient-to-r from-white/[0.06] to-transparent my-4" />

                            <div className="flex flex-wrap items-center gap-6 text-zinc-500">
                                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"><Calendar className="w-3.5 h-3.5 text-zinc-600" /> {t("joined")} {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                                {profile.twitter && (
                                    <a href={`https://twitter.com/${profile.twitter}`} target="_blank" className="flex items-center gap-1.5 text-xs hover:text-sky-400 transition-colors font-bold uppercase tracking-wider"><Twitter className="w-3.5 h-3.5" /> @{profile.twitter}</a>
                                )}
                                {profile.github && (
                                    <a href={`https://github.com/${profile.github}`} target="_blank" className="flex items-center gap-1.5 text-xs hover:text-white transition-colors font-bold uppercase tracking-wider"><Github className="w-3.5 h-3.5" /> {profile.github}</a>
                                )}
                                {profile.website && (
                                    <a href={profile.website} target="_blank" className="flex items-center gap-1.5 text-xs hover:text-neon-cyan transition-colors font-bold uppercase tracking-wider"><Globe className="w-3.5 h-3.5" /> {t("website")}</a>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Stats Row ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {[
                        { icon: Zap, label: t("totalXp"), value: xp_total.toLocaleString(), color: "text-neon-green" },
                        { icon: Crown, label: t("level"), value: String(profile.level), color: "text-neon-purple" },
                        { icon: Flame, label: t("streak"), value: t("days", { count: profile.currentStreak }), color: "text-orange-400" },
                    ].map((stat, i) => (
                        <div key={i} className="p-5 border border-white/[0.06] bg-[#0a0f1a]/90 relative overflow-hidden group">
                            {/* Hover accent */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-start justify-between relative z-10">
                                <div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black font-mono mb-1">{stat.label}</div>
                                    <div className={`text-2xl md:text-3xl font-black font-mono ${stat.color} drop-shadow-[0_0_8px_currentColor] opacity-90`}>{stat.value}</div>
                                </div>
                                <div className={`p-2 rounded bg-white/[0.02] border border-white/[0.04] ${stat.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                                    <stat.icon className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>

                <div className="grid lg:grid-cols-[1fr_360px] gap-8 font-mono">
                    <div className="space-y-8">
                        {/* ── Level Progress ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-5 border border-white/[0.06] bg-[#0a0f1a]/90">
                            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-neon-purple/60">// </span>
                                    <span className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        <Crown className="w-4 h-4 text-neon-purple" /> {t("level")} {profile.level}
                                    </span>
                                </div>
                                <span className="text-[10px] text-neon-purple bg-neon-purple/10 border border-neon-purple/20 px-2 py-0.5 font-bold tracking-widest uppercase">
                                    {xp_total.toLocaleString()} / {nextLevelXP.toLocaleString()} {t("xp")}
                                </span>
                            </div>

                            <div className="relative mt-4">
                                {/* XP Track */}
                                <div className="h-4 bg-black border border-white/10 w-full overflow-hidden relative p-[1px]">
                                    {/* Stripes background for classic game feel */}
                                    <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,white_4px,white_8px)]" />

                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${levelProgress}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan relative z-10"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                                    </motion.div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <span>{t("progress", { percent: Math.round(levelProgress) })}</span>
                                <span>{(nextLevelXP - xp_total).toLocaleString()} {t("xpToLevel", { level: profile.level + 1 })}</span>
                            </div>
                        </motion.div>

                        {/* XP Breakdown (Show locked XP if exists) */}
                        {xp.locked && xp.locked > 0 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 border border-amber-400/20 bg-amber-400/5">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-amber-400" />
                                    <div>
                                        <div className="text-xs font-bold text-white uppercase tracking-wider">{xp.locked.toLocaleString()} {t("xpLocked")}</div>
                                        <div className="text-[10px] text-zinc-500 leading-relaxed">
                                            {t("xpLockedDesc")}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="space-y-8">
                        {/* ── Skill Radar ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden">
                            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                                <Shield className="w-4 h-4 text-neon-cyan" />
                                <span className="text-sm font-bold text-white uppercase tracking-wider">{t("skillTree")}</span>
                            </div>
                            <div className="p-6 relative">
                                {/* Grid background */}
                                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.2)1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                                <SkillRadar skills={skills} />

                                <div className="mt-8 space-y-3">
                                    {skills.sort((a, b) => b.value - a.value).slice(0, 3).map((skill, i) => (
                                        <div key={skill.name} className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest">
                                            <span className="text-zinc-400 flex items-center gap-2">
                                                <span className="text-neon-cyan">{i + 1}.</span> {skill.name}
                                            </span>
                                            <span className="text-white">{skill.value} <span className="text-zinc-600">/ 100</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}