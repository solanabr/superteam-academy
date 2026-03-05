"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SectionReveal, StaggerContainer, staggerItem } from "@/components/motion/section-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
    Users,
    UserPlus,
    Bell,
    Gamepad2,
    Clock,
    Zap,
    Flame,
    Trophy,
    Copy,
    Check,
    Search,
    MessageCircle,
    BookOpen,
} from "lucide-react";

// Mock friends data
const mockFriends = [
    {
        id: "f1",
        username: "sol_queen",
        displayName: "Maria Gonzalez",
        avatar: "",
        isOnline: true,
        lastActive: "Now",
        streak: 45,
        level: 28,
        xp: 8420,
        activeCourse: "Token Engineering on Solana",
        courseProgress: 65,
        coursesCompleted: 8,
    },
    {
        id: "f2",
        username: "chain_dev",
        displayName: "James Park",
        avatar: "",
        isOnline: true,
        lastActive: "5 min ago",
        streak: 32,
        level: 26,
        xp: 7890,
        activeCourse: "Anchor Framework Mastery",
        courseProgress: 80,
        coursesCompleted: 7,
    },
    {
        id: "f3",
        username: "rust_wizard",
        displayName: "Elena Petrova",
        avatar: "",
        isOnline: false,
        lastActive: "2 hours ago",
        streak: 28,
        level: 24,
        xp: 7210,
        activeCourse: "Solana Program Security",
        courseProgress: 40,
        coursesCompleted: 7,
    },
    {
        id: "f4",
        username: "defi_builder",
        displayName: "Raj Patel",
        avatar: "",
        isOnline: false,
        lastActive: "1 day ago",
        streak: 0,
        level: 23,
        xp: 6750,
        activeCourse: "Solana Fundamentals",
        courseProgress: 90,
        coursesCompleted: 6,
    },
    {
        id: "f5",
        username: "anchor_pro",
        displayName: "Lisa Wang",
        avatar: "",
        isOnline: false,
        lastActive: "3 days ago",
        streak: 0,
        level: 22,
        xp: 6340,
        activeCourse: "NFT Development with Metaplex",
        courseProgress: 55,
        coursesCompleted: 6,
    },
];

export default function FriendsPage() {
    const t = useTranslations("Friends");
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [copied, setCopied] = useState(false);
    const [sentReminders, setSentReminders] = useState<Set<string>>(new Set());

    const inviteLink = "https://academy.superteam.fun/invite/alex_sol";

    const filteredFriends = mockFriends.filter(
        (f) =>
            f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onlineFriends = filteredFriends.filter((f) => f.isOnline);
    const offlineFriends = filteredFriends.filter((f) => !f.isOnline);
    const inactiveFriends = filteredFriends.filter((f) => f.streak === 0);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReminder = (id: string) => {
        setSentReminders((prev) => new Set(prev).add(id));
    };

    const handleMessage = (friendId: string) => {
        router.push(`/messenger?userId=${friendId}`);
    };

    const handlePlay = (friendId: string) => {
        router.push(`/games?partner=${friendId}`);
    };

    return (
        <div className="min-h-screen">
            <Header />
            <main className="pt-28 pb-16">
                <div className="content-container">
                    {/* Hero */}
                    <SectionReveal>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="font-display text-3xl font-bold tracking-tight">
                                    {t("title")}
                                </h1>
                                <p className="mt-1 text-muted-foreground">
                                    {t("subtitle")}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span><strong className="text-foreground">{mockFriends.length}</strong> {t("friendsCount", { count: mockFriends.length }).replace(String(mockFriends.length), "").trim()}</span>
                                <span className="text-border">·</span>
                                <span className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    {t("onlineCount", { count: onlineFriends.length })}
                                </span>
                            </div>
                        </div>
                    </SectionReveal>

                    {/* Invite + Search Row */}
                    <SectionReveal delay={0.05}>
                        <div className="mt-8 grid gap-4 sm:grid-cols-2">
                            {/* Invite Card */}
                            <div className="rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <UserPlus className="h-4 w-4 text-solana-purple" />
                                    <h3 className="font-semibold text-sm">{t("inviteTitle")}</h3>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                    {t("inviteDesc")}
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        value={inviteLink}
                                        readOnly
                                        className="text-xs h-9 font-mono bg-muted/50"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="shrink-0 gap-1.5 h-9"
                                        onClick={handleCopy}
                                    >
                                        {copied ? (
                                            <><Check className="h-3 w-3 text-solana-green" /> {t("copied")}</>
                                        ) : (
                                            <><Copy className="h-3 w-3" /> {t("copy")}</>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Search className="h-4 w-4 text-solana-purple" />
                                    <h3 className="font-semibold text-sm">{t("findTitle")}</h3>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                    {t("findDesc")}
                                </p>
                                <Input
                                    placeholder={t("searchPlaceholder")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>
                    </SectionReveal>

                    {/* Nudge Inactive Banner */}
                    {inactiveFriends.length > 0 && (
                        <SectionReveal delay={0.1}>
                            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
                                <Bell className="h-5 w-5 text-amber-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                        {inactiveFriends.length > 1
                                            ? t("streakLostPlural", { count: inactiveFriends.length })
                                            : t("streakLost", { count: inactiveFriends.length })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {t("nudgeDesc")}
                                    </p>
                                </div>
                            </div>
                        </SectionReveal>
                    )}

                    {/* Friend List */}
                    <div className="mt-8 space-y-6">
                        {/* Online Friends */}
                        {onlineFriends.length > 0 && (
                            <SectionReveal delay={0.15}>
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <h2 className="font-display text-lg font-bold">{t("onlineNow")}</h2>
                                        <Badge variant="outline" className="text-[10px]">{onlineFriends.length}</Badge>
                                    </div>
                                    <StaggerContainer className="grid gap-3">
                                        {onlineFriends.map((friend) => (
                                            <FriendCard
                                                key={friend.id}
                                                friend={friend}
                                                reminderSent={sentReminders.has(friend.id)}
                                                onReminder={() => handleReminder(friend.id)}
                                                onMessage={() => handleMessage(friend.id)}
                                                onPlay={() => handlePlay(friend.username)}
                                                t={t}
                                            />
                                        ))}
                                    </StaggerContainer>
                                </div>
                            </SectionReveal>
                        )}

                        {/* Offline Friends */}
                        {offlineFriends.length > 0 && (
                            <SectionReveal delay={0.2}>
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                        <h2 className="font-display text-lg font-bold">{t("offline")}</h2>
                                        <Badge variant="outline" className="text-[10px]">{offlineFriends.length}</Badge>
                                    </div>
                                    <StaggerContainer className="grid gap-3">
                                        {offlineFriends.map((friend) => (
                                            <FriendCard
                                                key={friend.id}
                                                friend={friend}
                                                reminderSent={sentReminders.has(friend.id)}
                                                onReminder={() => handleReminder(friend.id)}
                                                onMessage={() => handleMessage(friend.id)}
                                                onPlay={() => handlePlay(friend.id)}
                                                t={t}
                                            />
                                        ))}
                                    </StaggerContainer>
                                </div>
                            </SectionReveal>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function FriendCard({
    friend,
    reminderSent,
    onReminder,
    onMessage,
    onPlay,
    t,
}: {
    friend: (typeof mockFriends)[0];
    reminderSent: boolean;
    onReminder: () => void;
    onMessage: () => void;
    onPlay: () => void;
    t: ReturnType<typeof useTranslations>;
}) {
    const needsNudge = friend.streak === 0;

    return (
        <motion.div
            variants={staggerItem}
            className="group rounded-xl border border-border/60 bg-card/80 p-4 backdrop-blur-sm transition-all hover:border-border hover:shadow-sm"
        >
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-solana-purple/15 to-solana-green/15 text-lg font-bold text-solana-purple">
                        {friend.displayName[0]}
                    </div>
                    {/* Online indicator */}
                    <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${friend.isOnline ? "bg-emerald-500" : "bg-muted-foreground/30"
                            }`}
                    />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{friend.displayName}</h3>
                        <span className="text-xs text-muted-foreground">@{friend.username}</span>
                    </div>

                    {/* Status row */}
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {friend.lastActive}
                        </span>
                        <span className="flex items-center gap-1">
                            <Flame className={`h-3 w-3 ${friend.streak > 0 ? "text-orange-500" : "text-muted-foreground/30"}`} />
                            {friend.streak > 0 ? t("streak", { count: friend.streak }) : t("noStreak")}
                        </span>
                        <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-amber-500" />
                            Lv.{friend.level}
                        </span>
                        <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-solana-green" />
                            {friend.xp.toLocaleString()}
                        </span>
                    </div>

                    {/* Current course progress */}
                    <div className="mt-2.5 flex items-center gap-2">
                        <BookOpen className="h-3 w-3 text-solana-purple shrink-0" />
                        <span className="text-xs truncate">{friend.activeCourse}</span>
                        <Progress value={friend.courseProgress} className="h-1 w-16 shrink-0" />
                        <span className="text-[10px] text-muted-foreground shrink-0">{friend.courseProgress}%</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {/* Play Together */}
                    {friend.isOnline && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 rounded-full text-xs"
                            onClick={onPlay}
                        >
                            <Gamepad2 className="h-3 w-3" />
                            <span className="hidden sm:inline">{t("play")}</span>
                        </Button>
                    )}

                    {/* Send Reminder / Nudge */}
                    {needsNudge && (
                        <Button
                            size="sm"
                            variant={reminderSent ? "ghost" : "default"}
                            className={`h-8 gap-1 rounded-full text-xs ${!reminderSent
                                ? "bg-gradient-to-r from-solana-purple to-solana-green text-white hover:brightness-110"
                                : ""
                                }`}
                            onClick={onReminder}
                            disabled={reminderSent}
                        >
                            {reminderSent ? (
                                <><Check className="h-3 w-3 text-solana-green" /> {t("sent")}</>
                            ) : (
                                <><Bell className="h-3 w-3" /> <span className="hidden sm:inline">{t("nudge")}</span></>
                            )}
                        </Button>
                    )}

                    {/* Message — navigates to /messenger?userId=<id> */}
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={onMessage}
                        title={t("message")}
                    >
                        <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
