"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Clock,
    Zap,
    Trophy,
    Code,
    Play,
    CheckCircle2,
    Lock,
    Flame,
    Star,
    Timer,
    ArrowRight,
    Target,
    Medal,
    Users,
    Calendar,
    Sparkles,
    Gift,
    Snowflake,
} from "lucide-react";

/* ── Mock Data ── */
const TODAY_CHALLENGE = {
    id: 42,
    title: "Implement a PDA-based Counter Program",
    description: "Create a Solana program using Anchor that initializes a counter PDA and provides increment/decrement instructions. The counter should track the authority and enforce access control.",
    difficulty: "Intermediate" as const,
    xpReward: 200,
    timeLimit: 30, // minutes
    participants: 127,
    completions: 43,
    tags: ["Anchor", "PDA", "Access Control"],
    starterCode: `use anchor_lang::prelude::*;

declare_id!("YourProgramId");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Initialize the counter account
        // Set count to 0 and authority to the signer
        Ok(())
    }

    pub fn increment(ctx: Context<Update>) -> Result<()> {
        // TODO: Increment the counter
        // Only the authority should be able to increment
        Ok(())
    }

    pub fn decrement(ctx: Context<Update>) -> Result<()> {
        // TODO: Decrement the counter
        // Prevent underflow (count should not go below 0)
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // TODO: Define accounts for initialization
}

#[derive(Accounts)]
pub struct Update<'info> {
    // TODO: Define accounts for update
}

#[account]
pub struct Counter {
    // TODO: Define counter state
}`,
    hints: [
        "Use seeds and bump for PDA derivation with the authority pubkey",
        "The Counter account needs: authority (Pubkey), count (u64), and bump (u8)",
        "Use `require!(ctx.accounts.counter.authority == ctx.accounts.authority.key(), ErrorCode::Unauthorized)` for access control",
    ],
    testCases: [
        "✓ Counter initializes with count = 0",
        "✓ Authority can increment the counter",
        "✓ Authority can decrement the counter",
        "✗ Non-authority cannot modify the counter",
        "✗ Counter cannot go below 0",
    ],
};

const PAST_CHALLENGES = [
    { id: 41, title: "Build a Token Vault with Withdraw Logic", difficulty: "Advanced", xp: 300, completions: 31, solved: true },
    { id: 40, title: "Implement SPL Token Transfer with Memo", difficulty: "Beginner", xp: 100, completions: 89, solved: true },
    { id: 39, title: "Create a Voting Program with Delegated Votes", difficulty: "Advanced", xp: 350, completions: 22, solved: false },
    { id: 38, title: "Build an Escrow for NFT Trading", difficulty: "Intermediate", xp: 250, completions: 45, solved: true },
    { id: 37, title: "Implement On-Chain Timelock for Transactions", difficulty: "Intermediate", xp: 200, completions: 56, solved: false },
    { id: 36, title: "Create a Multisig Wallet Program", difficulty: "Advanced", xp: 400, completions: 18, solved: false },
];

const SPEED_LEADERBOARD = [
    { rank: 1, user: "sol_speedster", time: "04:23", xp: 12400 },
    { rank: 2, user: "anchor_pro", time: "05:01", xp: 11200 },
    { rank: 3, user: "rust_machine", time: "05:34", xp: 10800 },
    { rank: 4, user: "defi_builder", time: "06:12", xp: 9600 },
    { rank: 5, user: "nft_wizard", time: "06:45", xp: 8900 },
    { rank: 6, user: "web3_dev", time: "07:18", xp: 8200 },
    { rank: 7, user: "chain_coder", time: "08:02", xp: 7500 },
    { rank: 8, user: "token_master", time: "08:44", xp: 6800 },
];

const SEASONAL_EVENTS = [
    {
        id: "hackathon-sprint",
        title: "Solana Hackathon Sprint",
        description: "Complete 10 challenges in 5 days to earn the Hackathon Hero badge and 2x XP on all submissions.",
        icon: Flame,
        color: "from-orange-500 to-red-600",
        borderColor: "border-orange-500/30",
        textColor: "text-orange-400",
        status: "active" as const,
        startDate: "Feb 28",
        endDate: "Mar 5",
        xpMultiplier: 2,
        totalXP: 5000,
        earnedXP: 2100,
        participants: 342,
        challenges: 10,
        completedChallenges: 4,
        rewards: ["Hackathon Hero Badge", "2x XP Multiplier", "Exclusive NFT"],
    },
    {
        id: "defi-week",
        title: "DeFi Builder Week",
        description: "A full week dedicated to DeFi challenges: build AMMs, lending protocols, and yield aggregators. Top 3 earn SOL prizes.",
        icon: Sparkles,
        color: "from-blue-500 to-cyan-500",
        borderColor: "border-blue-500/30",
        textColor: "text-blue-400",
        status: "upcoming" as const,
        startDate: "Mar 10",
        endDate: "Mar 17",
        xpMultiplier: 1.5,
        totalXP: 7500,
        earnedXP: 0,
        participants: 0,
        challenges: 7,
        completedChallenges: 0,
        rewards: ["DeFi Master Badge", "1.5x XP Multiplier", "SOL Prizes for Top 3"],
    },
    {
        id: "nft-creator",
        title: "NFT Creator Jam",
        description: "Build NFT projects using Metaplex Core. From minting to marketplaces, complete all challenges to unlock the Creator credential.",
        icon: Gift,
        color: "from-purple-500 to-pink-500",
        borderColor: "border-purple-500/30",
        textColor: "text-purple-400",
        status: "upcoming" as const,
        startDate: "Mar 24",
        endDate: "Mar 31",
        xpMultiplier: 1.5,
        totalXP: 6000,
        earnedXP: 0,
        participants: 0,
        challenges: 8,
        completedChallenges: 0,
        rewards: ["NFT Creator Credential", "1.5x XP Multiplier", "Soulbound NFT Trophy"],
    },
];

function CountdownTimer({ minutes }: { minutes: number }) {
    const [timeLeft, setTimeLeft] = useState(minutes * 60);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (!isRunning || timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        return () => clearInterval(timer);
    }, [isRunning, timeLeft]);

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const progress = ((minutes * 60 - timeLeft) / (minutes * 60)) * 100;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Timer className={`h-5 w-5 ${isRunning ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                    <span className={`text-3xl font-mono font-bold tabular-nums ${timeLeft < 300 && isRunning ? "text-red-400" : "text-foreground"}`}>
                        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                    </span>
                </div>
                <Button
                    size="sm"
                    onClick={() => setIsRunning(!isRunning)}
                    className={`rounded-none font-mono text-xs uppercase tracking-wider ${isRunning ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30" : "bg-primary text-black"}`}
                >
                    {isRunning ? "Pause" : "Start"}
                </Button>
            </div>
            <Progress value={progress} className="h-1 bg-secondary/30" />
        </div>
    );
}

function getDifficultyColor(d: string) {
    if (d === "Beginner") return "border-green-500/50 text-green-400";
    if (d === "Intermediate") return "border-yellow-500/50 text-yellow-400";
    return "border-red-500/50 text-red-400";
}

export default function ChallengesPage() {
    const [showHints, setShowHints] = useState<boolean[]>([false, false, false]);
    const [activeSection, setActiveSection] = useState<"today" | "past" | "leaderboard" | "events">("today");

    const revealHint = (idx: number) => {
        setShowHints((prev) => {
            const next = [...prev];
            next[idx] = true;
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-background noise-bg">
            {/* Hero */}
            <section className="border-b border-border bg-background relative overflow-hidden">
                <div className="absolute left-[5%] top-[30%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full mix-blend-screen opacity-15 blur-[80px] bg-primary pointer-events-none" />
                <div className="mx-auto max-w-6xl px-6 py-16">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="inline-flex items-center gap-2 border border-border bg-black/50 px-3 py-1 text-xs font-mono uppercase tracking-widest text-primary mb-4 rounded-none">
                            <Flame className="h-3 w-3" />
                            Daily Challenges
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-extrabold uppercase tracking-tighter text-foreground">
                            Code <span className="text-primary">Challenges</span>
                        </h1>
                        <p className="mt-4 text-muted-foreground font-mono text-sm max-w-xl">
                            {"> "}Sharpen your Solana skills with daily coding challenges. Race against the clock, earn XP, and climb the speed leaderboard.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-6 py-8">
                {/* Section Tabs */}
                <div className="flex gap-2 mb-8 border-b border-border pb-4">
                    {([
                        { key: "today" as const, label: "Today's Challenge", icon: Target },
                        { key: "past" as const, label: "Past Challenges", icon: Clock },
                        { key: "leaderboard" as const, label: "Speed Board", icon: Trophy },
                        { key: "events" as const, label: "Seasonal Events", icon: Calendar },
                    ]).map(({ key, label, icon: Icon }) => (
                        <Button
                            key={key}
                            variant={activeSection === key ? "default" : "outline"}
                            size="sm"
                            className={`rounded-none font-mono text-xs uppercase tracking-wider ${activeSection === key ? "bg-primary text-black" : "border-border bg-black/40"}`}
                            onClick={() => setActiveSection(key)}
                        >
                            <Icon className="h-3 w-3 mr-1" />
                            {label}
                        </Button>
                    ))}
                </div>

                {/* ── TODAY'S CHALLENGE ── */}
                {activeSection === "today" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Challenge Info */}
                            <div className="lg:col-span-2 space-y-4">
                                <Card className="border-border bg-card/5 rounded-none">
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="outline" className="rounded-none border-primary/50 text-primary text-[10px] font-mono uppercase">
                                                Challenge #{TODAY_CHALLENGE.id}
                                            </Badge>
                                            <Badge variant="outline" className={`rounded-none text-[10px] font-mono uppercase ${getDifficultyColor(TODAY_CHALLENGE.difficulty)}`}>
                                                {TODAY_CHALLENGE.difficulty}
                                            </Badge>
                                        </div>
                                        <CardTitle className="font-display text-2xl text-foreground">
                                            {TODAY_CHALLENGE.title}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground font-space mt-2">
                                            {TODAY_CHALLENGE.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {TODAY_CHALLENGE.tags.map((tag) => (
                                                <span key={tag} className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-border text-muted-foreground">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Starter Code */}
                                        <div className="bg-black border border-border p-4 overflow-x-auto">
                                            <pre className="text-xs font-mono text-green-400/80 whitespace-pre leading-relaxed">
                                                {TODAY_CHALLENGE.starterCode}
                                            </pre>
                                        </div>

                                        {/* Test Cases */}
                                        <div className="mt-4 space-y-1">
                                            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Test Cases</p>
                                            {TODAY_CHALLENGE.testCases.map((tc, i) => (
                                                <div key={i} className={`flex items-center gap-2 text-xs font-mono ${tc.startsWith("✓") ? "text-green-400" : "text-red-400/60"}`}>
                                                    {tc}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Hints */}
                                        <div className="mt-6 space-y-2">
                                            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Progressive Hints</p>
                                            {TODAY_CHALLENGE.hints.map((hint, idx) => (
                                                <div key={idx}>
                                                    {showHints[idx] ? (
                                                        <div className="flex items-start gap-2 p-3 border border-primary/20 bg-primary/5 text-sm font-space text-foreground">
                                                            <Star className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                                            {hint}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => revealHint(idx)}
                                                            className="flex items-center gap-2 p-3 border border-border bg-black/30 text-xs font-mono text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all w-full text-left"
                                                        >
                                                            <Lock className="h-3 w-3" />
                                                            Reveal Hint {idx + 1} (-{(idx + 1) * 25} XP penalty)
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-4">
                                {/* Timer */}
                                <Card className="border-border bg-card/5 rounded-none">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Time Remaining</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CountdownTimer minutes={TODAY_CHALLENGE.timeLimit} />
                                    </CardContent>
                                </Card>

                                {/* Reward */}
                                <Card className="border-border bg-card/5 rounded-none">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <Zap className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xl font-display font-bold text-foreground">{TODAY_CHALLENGE.xpReward} XP</p>
                                                <p className="text-[10px] font-mono text-muted-foreground uppercase">Reward</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground border-t border-border pt-3">
                                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {TODAY_CHALLENGE.participants} attempts</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {TODAY_CHALLENGE.completions} solved</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Submit Button */}
                                <Button className="w-full rounded-none bg-primary text-black font-bold uppercase tracking-widest text-sm py-6">
                                    <Play className="h-4 w-4 mr-2" />
                                    Submit Solution
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── PAST CHALLENGES ── */}
                {activeSection === "past" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                        {PAST_CHALLENGES.map((ch, i) => (
                            <motion.div
                                key={ch.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="border-border bg-card/5 rounded-none hover:border-primary/30 transition-all group">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-mono text-muted-foreground w-8">#{ch.id}</span>
                                            <div>
                                                <h3 className="font-space font-medium text-foreground group-hover:text-primary transition-colors">{ch.title}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <Badge variant="outline" className={`rounded-none text-[10px] font-mono uppercase ${getDifficultyColor(ch.difficulty)}`}>
                                                        {ch.difficulty}
                                                    </Badge>
                                                    <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                                        <Zap className="h-3 w-3" /> {ch.xp} XP
                                                    </span>
                                                    <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> {ch.completions} solved
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {ch.solved ? (
                                                <Badge variant="outline" className="rounded-none border-green-500/50 text-green-400 text-[10px] font-mono uppercase">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Solved
                                                </Badge>
                                            ) : (
                                                <Button size="sm" variant="outline" className="rounded-none border-border text-xs font-mono uppercase">
                                                    <ArrowRight className="h-3 w-3 mr-1" />
                                                    Try
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* ── SPEED LEADERBOARD ── */}
                {activeSection === "leaderboard" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Card className="border-border bg-card/5 rounded-none overflow-hidden">
                            <CardHeader>
                                <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-yellow-400" />
                                    Speed Leaderboard — Challenge #{TODAY_CHALLENGE.id}
                                </CardTitle>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-black/30">
                                            {["Rank", "Builder", "Solve Time", "Total XP"].map((h) => (
                                                <th key={h} className="px-6 py-3 text-left text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SPEED_LEADERBOARD.map((entry) => (
                                            <tr key={entry.rank} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className={`text-lg font-display font-bold ${entry.rank <= 3 ? "text-yellow-400" : "text-muted-foreground"}`}>
                                                        {entry.rank <= 3 ? (
                                                            <Medal className={`h-5 w-5 inline ${entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-gray-300" : "text-orange-400"}`} />
                                                        ) : (
                                                            `#${entry.rank}`
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-xs font-mono font-bold text-foreground">
                                                            {entry.user.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="font-space font-medium text-foreground">{entry.user}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-primary">{entry.time}</span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-muted-foreground">
                                                    {entry.xp.toLocaleString("en-US")} XP
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* ── SEASONAL EVENTS ── */}
                {activeSection === "events" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {SEASONAL_EVENTS.map((event, i) => {
                            const EventIcon = event.icon;
                            const progressPct = event.totalXP > 0 ? (event.earnedXP / event.totalXP) * 100 : 0;
                            return (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <Card className={`border-border bg-card/5 rounded-none overflow-hidden ${event.borderColor} border-l-4`}>
                                        <CardContent className="p-0">
                                            <div className="flex flex-col lg:flex-row">
                                                {/* Event Info */}
                                                <div className="flex-1 p-6">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className={`w-10 h-10 rounded flex items-center justify-center bg-gradient-to-br ${event.color}`}>
                                                            <EventIcon className="h-5 w-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-display font-bold text-xl text-foreground">{event.title}</h3>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <Badge variant="outline" className={`rounded-none text-[10px] font-mono uppercase ${event.status === "active" ? "border-green-500/50 text-green-400" : "border-yellow-500/50 text-yellow-400"}`}>
                                                                    {event.status === "active" ? "● Live Now" : "Upcoming"}
                                                                </Badge>
                                                                <span className="text-[10px] font-mono text-muted-foreground">
                                                                    {event.startDate} → {event.endDate}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground font-space mb-4">{event.description}</p>

                                                    {/* Progress */}
                                                    {event.status === "active" && (
                                                        <div className="mb-4">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-[10px] font-mono text-muted-foreground uppercase">Progress</span>
                                                                <span className="text-[10px] font-mono text-foreground">{event.completedChallenges}/{event.challenges} challenges</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-secondary/30 overflow-hidden">
                                                                <motion.div
                                                                    className={`h-full bg-gradient-to-r ${event.color}`}
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${progressPct}%` }}
                                                                    transition={{ duration: 1 }}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <span className="text-[10px] font-mono text-muted-foreground">{event.earnedXP.toLocaleString()} XP earned</span>
                                                                <span className="text-[10px] font-mono text-muted-foreground">{event.totalXP.toLocaleString()} XP total</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Rewards */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {event.rewards.map((reward) => (
                                                            <span key={reward} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${event.borderColor} ${event.textColor}`}>
                                                                <Gift className="h-3 w-3" />
                                                                {reward}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Stats Sidebar */}
                                                <div className="lg:w-48 border-t lg:border-t-0 lg:border-l border-border p-4 flex lg:flex-col items-center lg:items-stretch justify-around gap-4 bg-black/20">
                                                    <div className="text-center">
                                                        <p className="text-2xl font-display font-bold text-foreground">{event.xpMultiplier}x</p>
                                                        <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">XP Multiplier</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-2xl font-display font-bold text-foreground">{event.challenges}</p>
                                                        <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Challenges</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-2xl font-display font-bold text-foreground">{event.participants || "—"}</p>
                                                        <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Participants</p>
                                                    </div>
                                                    {event.status === "active" ? (
                                                        <Button size="sm" className={`rounded-none bg-gradient-to-r ${event.color} text-white font-mono text-xs uppercase font-bold`}>
                                                            Continue
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="outline" className="rounded-none border-border font-mono text-xs uppercase">
                                                            Notify Me
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
