"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

/* ── stub data ──────────────────────────────────────── */
const profileData = {
    username: "you_sol",
    name: "Alex Rivera",
    bio: "Full-stack Solana builder. Passionate about DeFi and on-chain governance. Learning every day.",
    avatar: "",
    joinDate: "Jan 2025",
    isPublic: true,
    level: 7,
    totalXP: 7340,
    streak: 12,
    rank: 42,
    socialLinks: {
        twitter: "alex_sol",
        github: "alexrivera",
        website: "https://alexrivera.dev",
    },
    skills: [
        { name: "Rust", value: 72 },
        { name: "Anchor", value: 58 },
        { name: "Frontend", value: 85 },
        { name: "Security", value: 40 },
        { name: "DeFi", value: 65 },
        { name: "NFTs", value: 50 },
    ],
    achievements: [
        { id: "a1", name: "First Steps", description: "Complete your first lesson", icon: "🚀", earned: true, date: "Jan 15", rarity: "Common" },
        { id: "a2", name: "Course Completer", description: "Complete an entire course", icon: "🎓", earned: true, date: "Feb 2", rarity: "Uncommon" },
        { id: "a3", name: "Week Warrior", description: "7-day learning streak", icon: "🔥", earned: true, date: "Feb 10", rarity: "Rare" },
        { id: "a4", name: "Rust Rookie", description: "Complete a Rust-based course", icon: "🦀", earned: true, date: "Feb 12", rarity: "Epic" },
        { id: "a5", name: "Speed Runner", description: "Finish a course in under 48h", icon: "⚡", earned: false, date: null, rarity: "Epic" },
        { id: "a6", name: "Perfect Score", description: "100% on all challenges in a course", icon: "💯", earned: false, date: null, rarity: "Legendary" },
        { id: "a7", name: "Monthly Master", description: "30-day learning streak", icon: "👑", earned: false, date: null, rarity: "Mythic" },
        { id: "a8", name: "Full Stack Solana", description: "Complete all available courses", icon: "🏆", earned: false, date: null, rarity: "Legendary" },
    ],
    credentials: [
        { id: "c1", course: "Intro to Solana", mintAddress: "SoL...x7Kp", date: "Feb 2, 2025", level: "Beginner", verified: true },
        { id: "c2", course: "Smart Contracts 101", mintAddress: "AnC...r3Qm", date: "Feb 14, 2025", level: "Intermediate", verified: true },
    ],
    completedCourses: [
        { slug: "intro-to-solana", title: "Intro to Solana", xp: 200, completedDate: "Feb 2, 2025", grade: "A+" },
        { slug: "smart-contracts-101", title: "Smart Contracts 101", xp: 500, completedDate: "Feb 14, 2025", grade: "A" },
    ],
};

/* ── Radar chart (CSS-based) ─────────────────────────── */
function SkillRadar({ skills }: { skills: typeof profileData.skills }) {
    const n = skills.length;
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
    const { username } = useParams<{ username: string }>();
    const profile = profileData; // stubbed
    const [isPublic, setIsPublic] = useState(profile.isPublic);

    const nextLevelXP = Math.pow((profile.level + 1), 2) * 100;
    const currentLevelXP = Math.pow(profile.level, 2) * 100;
    const levelProgress = ((profile.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

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
                        cd ../dashboard
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
                                        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">{profile.name}</h1>
                                        <span className="px-2 py-0.5 border border-amber-400/30 bg-amber-400/10 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                                            Initiate
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-neon-green bg-neon-green/5 px-2 font-bold select-all">@{username}</span>
                                        <button
                                            onClick={() => setIsPublic(!isPublic)}
                                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-white/[0.08] text-[10px] text-zinc-500 hover:text-white hover:border-white/20 transition-all font-bold uppercase tracking-wider"
                                        >
                                            {isPublic ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-red-400" />}
                                            {isPublic ? "Public Profile" : "Private Profile"}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col items-start sm:items-end gap-1">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Class / Bio</div>
                                    <p className="text-xs text-zinc-400 max-w-md sm:text-right leading-relaxed border-l-2 sm:border-l-0 sm:border-r-2 border-amber-400/30 pl-3 sm:pl-0 sm:pr-3 py-1">
                                        {profile.bio}
                                    </p>
                                </div>
                            </div>

                            <div className="h-px w-full bg-gradient-to-r from-white/[0.06] to-transparent my-4" />

                            <div className="flex flex-wrap items-center gap-6 text-zinc-500">
                                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"><Calendar className="w-3.5 h-3.5 text-zinc-600" /> Joined {profile.joinDate}</span>
                                {profile.socialLinks.twitter && (
                                    <a href="#" className="flex items-center gap-1.5 text-xs hover:text-sky-400 transition-colors font-bold uppercase tracking-wider"><Twitter className="w-3.5 h-3.5" /> @{profile.socialLinks.twitter}</a>
                                )}
                                {profile.socialLinks.github && (
                                    <a href="#" className="flex items-center gap-1.5 text-xs hover:text-white transition-colors font-bold uppercase tracking-wider"><Github className="w-3.5 h-3.5" /> {profile.socialLinks.github}</a>
                                )}
                                {profile.socialLinks.website && (
                                    <a href="#" className="flex items-center gap-1.5 text-xs hover:text-neon-cyan transition-colors font-bold uppercase tracking-wider"><Globe className="w-3.5 h-3.5" /> Website</a>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Stats Row ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: Zap, label: "Total XP", value: profile.totalXP.toLocaleString(), color: "text-neon-green" },
                        { icon: Crown, label: "Level", value: String(profile.level), color: "text-neon-purple" },
                        { icon: Flame, label: "Streak", value: `${profile.streak} days`, color: "text-orange-400" },
                        { icon: Trophy, label: "Arena Rank", value: `#${profile.rank}`, color: "text-amber-400" },
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
                                        <Crown className="w-4 h-4 text-neon-purple" /> Level {profile.level}
                                    </span>
                                </div>
                                <span className="text-[10px] text-neon-purple bg-neon-purple/10 border border-neon-purple/20 px-2 py-0.5 font-bold tracking-widest uppercase">
                                    {profile.totalXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
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
                                <span>Progress: {Math.round(levelProgress)}%</span>
                                <span>{(nextLevelXP - profile.totalXP).toLocaleString()} XP to Level {profile.level + 1}</span>
                            </div>
                        </motion.div>

                        {/* ── Achievements ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden">
                            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Award className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm font-bold text-white uppercase tracking-wider">Loot & Achievements</span>
                                </div>
                                <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 border border-amber-400/20">{profile.achievements.filter(a => a.earned).length}/{profile.achievements.length} Unlocked</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.03]">
                                {profile.achievements.map((ach) => (
                                    <div
                                        key={ach.id}
                                        className={`p-4 text-center space-y-2 relative group bg-[#0a0f1a] transition-all duration-300 ${ach.earned ? "hover:bg-white/[0.02]" : "opacity-50 grayscale hover:grayscale-0 hover:opacity-100"}`}
                                    >
                                        {/* Corner flair on acquired */}
                                        {ach.earned && (
                                            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                                        )}

                                        <div className={`text-3xl mb-2 inline-block ${ach.earned ? "drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" : "opacity-40"}`}>
                                            {ach.icon}
                                        </div>
                                        <div className={`text-[10px] font-black uppercase tracking-wider leading-tight ${ach.earned ? "text-white" : "text-zinc-500"}`}>{ach.name}</div>

                                        {!ach.earned && (
                                            <div className="text-[8px] text-zinc-600 font-bold">{ach.description}</div>
                                        )}

                                        {ach.earned && (
                                            <div className={`text-[8px] font-bold uppercase tracking-widest mt-2 ${ach.rarity === 'Legendary' ? 'text-orange-400' :
                                                    ach.rarity === 'Epic' ? 'text-neon-purple' :
                                                        ach.rarity === 'Rare' ? 'text-amber-400' :
                                                            ach.rarity === 'Uncommon' ? 'text-neon-cyan' :
                                                                'text-zinc-400'
                                                }`}>
                                                {ach.rarity}
                                            </div>
                                        )}

                                        {/* Hover Tooltip (Basic implementation via group-hover) */}
                                        <div className="absolute inset-0 bg-black/90 p-4 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex flex-col items-center justify-center pointer-events-none text-center backdrop-blur-sm">
                                            <div className="text-[10px] text-white font-bold mb-1">{ach.name}</div>
                                            <div className="text-[8px] text-zinc-400 leading-relaxed mb-2">{ach.description}</div>
                                            {ach.earned ? (
                                                <div className="text-[8px] text-amber-400">Unlocked: {ach.date}</div>
                                            ) : (
                                                <div className="text-[8px] text-zinc-600 flex items-center justify-center gap-1"><Shield className="w-2.5 h-2.5" /> Locked</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* ── Completed Courses ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden">
                            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-neon-green" />
                                <span className="text-sm font-bold text-white uppercase tracking-wider">Quest History</span>
                            </div>

                            <div className="divide-y divide-white/[0.03]">
                                {profile.completedCourses.map((c) => (
                                    <Link
                                        key={c.slug}
                                        href={`/courses/${c.slug}`}
                                        className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-white/[0.02] hover:pl-6 transition-all group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-8 h-8 rounded bg-neon-green/10 border border-neon-green/20 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-4 h-4 text-neon-green" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-white group-hover:text-neon-green transition-colors truncate">{c.title}</div>
                                                <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">Completed {c.completedDate}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 sm:ml-auto shrink-0 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0 mt-3 sm:mt-0">
                                            <div className="text-right">
                                                <span className="text-[12px] font-black text-amber-400 flex items-center gap-1"><Zap className="w-3 h-3" /> +{c.xp} XP</span>
                                            </div>
                                            <div className="h-6 w-px bg-white/10 hidden sm:block" />
                                            <span className="px-2.5 py-1 bg-white/[0.03] border border-white/10 text-white text-[10px] font-black uppercase">
                                                Rank: <span className="text-amber-400">{c.grade}</span>
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    <div className="space-y-8">
                        {/* ── Skill Radar ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden">
                            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                                <Shield className="w-4 h-4 text-neon-cyan" />
                                <span className="text-sm font-bold text-white uppercase tracking-wider">Skill Tree</span>
                            </div>
                            <div className="p-6 relative">
                                {/* Grid background */}
                                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.2)1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                                <SkillRadar skills={profile.skills} />

                                <div className="mt-8 space-y-3">
                                    {profile.skills.sort((a, b) => b.value - a.value).slice(0, 3).map((skill, i) => (
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

                        {/* ── Credentials ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden">
                            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-bold text-white uppercase tracking-wider">On-Chain Data</span>
                            </div>

                            <div className="p-5 space-y-4">
                                {profile.credentials.map((cred) => (
                                    <div key={cred.id} className="border border-white/[0.06] bg-[#050810] p-4 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-neon-green/10 to-transparent pointer-events-none" />

                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-none border border-neon-green/30 bg-neon-green/5 flex items-center justify-center">
                                                <Shield className="w-4 h-4 text-neon-green" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-white uppercase tracking-wider">{cred.course}</div>
                                                <div className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase">{cred.date}</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-4 bg-white/[0.01] p-2 border border-white/[0.04]">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Mint</span>
                                                <span className="text-[9px] text-zinc-300 font-bold bg-white/5 px-1 py-0.5">{cred.mintAddress}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Level</span>
                                                <span className="text-[9px] text-zinc-300 font-bold">{cred.level}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Status</span>
                                                <span className="flex items-center gap-1 text-[9px] text-neon-green font-bold uppercase tracking-wider">
                                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                                </span>
                                            </div>
                                        </div>
                                        <a href="#" className="flex items-center justify-center gap-1.5 w-full py-2 bg-white/[0.03] border border-white/[0.06] text-[9px] text-zinc-400 font-bold uppercase tracking-widest hover:text-white hover:bg-white/[0.05] transition-all">
                                            <ExternalLink className="w-3 h-3" /> View Explorer
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
