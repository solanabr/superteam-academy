"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import {
    Sparkles,
    BookOpen,
    Award,
    Copy,
    ExternalLink,
    Share2,
    Trophy,
    Shuffle,
    Settings,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PixelAvatar, setAvatarVersion } from "@/components/app/PixelAvatar";
import { CredentialImage } from "@/components/app/CredentialImage";
import { useXpBalanceFor, useCredentialsFor, useTrackImageMap } from "@/hooks";
import { levelFromXp, xpProgressInLevel } from "@/lib/level";
import { getDisplayName, setDisplayName, onDisplayNameChanged } from "@/lib/display-name";
import { getMockLeaderboard } from "@/lib/services/mock-leaderboard";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

function truncateWallet(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export interface ProfileContentProps {
    /** Wallet address to show profile for */
    walletAddress: string;
    /** If true, show edit/shuffle/settings. If undefined, derived from useWallet. */
    isOwner?: boolean;
}

export function ProfileContent({ walletAddress, isOwner: isOwnerProp }: ProfileContentProps) {
    const { publicKey } = useWallet();
    const isOwner = isOwnerProp ?? (publicKey?.toBase58() === walletAddress);

    const { data: xp, isLoading: xpLoading } = useXpBalanceFor(walletAddress);
    const { data: credentials, isLoading: credsLoading } = useCredentialsFor(walletAddress);
    const trackImageMap = useTrackImageMap();
    const t = useTranslations("profile");
    const tCommon = useTranslations("common");

    const [displayName, setDisplayNameState] = useState<string | null>(null);
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [avatarKey, setAvatarKey] = useState("");

    useEffect(() => {
        setDisplayNameState(walletAddress ? getDisplayName(walletAddress) : null);
    }, [walletAddress]);

    useEffect(() => {
        if (!walletAddress) return;
        const unsubscribe = onDisplayNameChanged(() => {
            setDisplayNameState(getDisplayName(walletAddress));
        });
        return unsubscribe;
    }, [walletAddress]);

    const displayLabel = displayName?.trim() || truncateWallet(walletAddress);
    const xpValue = xp ?? 0;
    const level = levelFromXp(xpValue);
    const progress = xpProgressInLevel(xpValue);

    const leaderboardRank = useMemo(() => {
        const entries = getMockLeaderboard("all-time");
        const entry = entries.find((e) => e.wallet === walletAddress);
        return entry?.rank ?? null;
    }, [walletAddress]);

    const handleCopy = () => {
        navigator.clipboard.writeText(walletAddress);
        toast.success(t("walletCopied"));
    };

    const handleShareLink = () => {
        const url = `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${walletAddress}`;
        navigator.clipboard.writeText(url);
        toast.success(t("linkCopied"));
    };

    const handleShareTwitter = () => {
        const url = `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${walletAddress}`;
        const text = `Check out my Superteam Academy profile! Level ${level} with ${xpValue.toLocaleString()} XP 🚀`;
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            "_blank"
        );
    };

    const handleSaveName = () => {
        setDisplayName(walletAddress, nameInput);
        setEditingName(false);
        toast.success(t("nameSaved"));
    };

    const handleShuffleAvatar = () => {
        const newVersion = String(Date.now());
        setAvatarVersion(walletAddress, newVersion);
        setAvatarKey(newVersion);
        toast.success(t("avatarShuffled"));
    };

    const isLoading = xpLoading || credsLoading;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            {/* Profile Header */}
            <div className="p-5 sm:p-8 border-4 rounded-2xl bg-card">
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                    <div className="relative shrink-0">
                        <PixelAvatar
                            wallet={walletAddress}
                            size="xl"
                            className="border-4 border-border h-24 w-24 sm:h-28 sm:w-28"
                            version={avatarKey || undefined}
                        />
                        {isOwner && (
                            <button
                                onClick={handleShuffleAvatar}
                                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-background border-2 border-border hover:bg-accent transition-colors"
                                title={t("shuffleAvatar")}
                            >
                                <Shuffle className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="min-w-0 w-full text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                            {editingName && isOwner ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={nameInput}
                                        onChange={(e) => setNameInput(e.target.value)}
                                        placeholder={t("enterDisplayName")}
                                        className="font-game text-xl w-48"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSaveName();
                                            if (e.key === "Escape") setEditingName(false);
                                        }}
                                    />
                                    <Button size="sm" variant="pixel" onClick={handleSaveName} className="font-game">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (!isOwner) return;
                                        setNameInput(displayName ?? "");
                                        setEditingName(true);
                                    }}
                                    className={cn(
                                        "font-game text-2xl sm:text-3xl truncate max-w-full",
                                        isOwner && "hover:text-yellow-400 transition-colors cursor-pointer"
                                    )}
                                    title={isOwner ? t("editName") : undefined}
                                >
                                    {displayLabel}
                                </button>
                            )}
                            <button
                                onClick={handleCopy}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title={t("copyWallet")}
                            >
                                <Copy className="h-4 w-4" />
                            </button>
                            <a
                                href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title={tCommon("viewOnExplorer")}
                            >
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                        <p className="font-game text-lg sm:text-xl text-muted-foreground mt-1">
                            {t("level")} {level}
                        </p>

                        {/* XP progress bar */}
                        <div className="mt-3 max-w-xs mx-auto sm:mx-0">
                            <div className="flex justify-between font-game text-sm text-muted-foreground mb-1">
                                <span>Lv.{level}</span>
                                <span>Lv.{level + 1}</span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden border border-border">
                                <div
                                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${progress.xpForNextLevel > 0 ? (progress.xpInLevel / progress.xpForNextLevel) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                            <p className="font-game text-xs text-muted-foreground mt-1 text-center sm:text-left">
                                {progress.xpInLevel} / {progress.xpForNextLevel} XP
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-4 flex-wrap">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleShareLink}
                                className="font-game text-base"
                            >
                                <Share2 className="h-4 w-4 mr-1" />
                                {t("shareProfile")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleShareTwitter}
                                className="font-game text-base"
                            >
                                𝕏 {t("shareTwitter")}
                            </Button>
                            {isOwner && (
                                <Link href="/settings">
                                    <Button variant="outline" size="sm" className="font-game text-base">
                                        <Settings className="h-4 w-4 mr-1" />
                                        {tCommon("settings")}
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
                <div className="p-4 border-4 rounded-2xl text-center bg-card">
                    <Sparkles className="mx-auto mb-2 h-7 w-7 text-yellow-400" />
                    <h2 className="font-game text-2xl sm:text-3xl">
                        {isLoading ? "–" : xpValue.toLocaleString()}
                    </h2>
                    <p className="font-game text-sm sm:text-base text-muted-foreground">{t("totalXp")}</p>
                </div>
                <div className="p-4 border-4 rounded-2xl text-center bg-card">
                    <BookOpen className="mx-auto mb-2 h-7 w-7 text-yellow-400" />
                    <h2 className="font-game text-2xl sm:text-3xl">
                        {isLoading ? "–" : "0"}
                    </h2>
                    <p className="font-game text-sm sm:text-base text-muted-foreground">{t("coursesCompleted")}</p>
                </div>
                <div className="p-4 border-4 rounded-2xl text-center bg-card">
                    <Award className="mx-auto mb-2 h-7 w-7 text-yellow-400" />
                    <h2 className="font-game text-2xl sm:text-3xl">
                        {isLoading ? "–" : credentials?.length ?? 0}
                    </h2>
                    <p className="font-game text-sm sm:text-base text-muted-foreground">{t("credentialsEarned")}</p>
                </div>
                <div className="p-4 border-4 rounded-2xl text-center bg-card">
                    <Trophy className="mx-auto mb-2 h-7 w-7 text-yellow-400" />
                    <h2 className="font-game text-2xl sm:text-3xl">
                        {leaderboardRank ? `#${leaderboardRank}` : "–"}
                    </h2>
                    <p className="font-game text-sm sm:text-base text-muted-foreground">{t("leaderboardRank")}</p>
                </div>
            </div>

            {/* Credentials Gallery */}
            <div className="mt-8">
                <h2 className="font-game text-3xl sm:text-4xl mb-4">{t("credentials")}</h2>
                {credentials && credentials.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {credentials.map((cred) => (
                            <Link key={cred.asset} href={`/certificates/${cred.asset}`}>
                                <div className="p-5 border-4 rounded-2xl hover:border-yellow-400/50 transition-all bg-card group h-full">
                                    <div className="flex items-center gap-3 mb-3">
                                        <CredentialImage
                                            imageUrl={cred.imageUrl}
                                            metadataUri={cred.metadataUri}
                                            fallbackImageUrl={trackImageMap[cred.trackId]}
                                            size="sm"
                                        />
                                        <span className="font-game text-xl">{cred.name ?? `Track ${cred.trackId}`}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-game text-muted-foreground">
                                            Level {cred.level} · {cred.coursesCompleted} {t("courses")} · {cred.totalXp.toLocaleString()} XP
                                        </p>
                                        <p className="font-game text-xs text-muted-foreground truncate" title={cred.asset}>
                                            {truncateWallet(cred.asset)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 mt-3 text-muted-foreground group-hover:text-yellow-400 transition-colors">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        <span className="font-game text-sm">{tCommon("viewOnExplorer")}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 p-8 border-4 border-dashed border-border rounded-2xl bg-card/50">
                        <Award className="w-12 h-12 text-muted-foreground" />
                        <h2 className="font-game text-2xl">{tCommon("noCredentials")}</h2>
                        <p className="font-game text-muted-foreground text-center max-w-sm">
                            {isOwner ? tCommon("noCredentialsHint") : t("noCredentialsOther")}
                        </p>
                        {isOwner && (
                            <Link href="/courses">
                                <Button variant="pixel" className="font-game text-lg mt-1">
                                    {tCommon("browseCourses")}
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
