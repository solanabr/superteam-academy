"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    Sparkles,
    BookOpen,
    Award,
    Copy,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState, PixelAvatar } from "@/components/app";
import { useXpBalance, useCredentials } from "@/hooks";
import { levelFromXp } from "@/lib/level";
import { getDisplayName, onDisplayNameChanged } from "@/lib/display-name";
import { toast } from "sonner";
import Link from "next/link";
import { useTranslations } from "next-intl";

function truncateWallet(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ProfilePage() {
    const { publicKey } = useWallet();
    const { data: xp } = useXpBalance();
    const { data: credentials } = useCredentials();
    const walletAddress = publicKey?.toBase58() ?? "";
    const [displayName, setDisplayName] = useState<string | null>(null);
    const t = useTranslations("profile");
    const tCommon = useTranslations("common");

    useEffect(() => {
        setDisplayName(walletAddress ? getDisplayName(walletAddress) : null);
    }, [walletAddress]);

    useEffect(() => {
        if (!walletAddress) return;
        const unsubscribe = onDisplayNameChanged(() => {
            setDisplayName(getDisplayName(walletAddress));
        });
        return unsubscribe;
    }, [walletAddress]);

    const displayLabel = displayName?.trim() || (walletAddress ? truncateWallet(walletAddress) : "");

    const handleCopy = () => {
        navigator.clipboard.writeText(walletAddress);
        toast.success(t("walletCopied"));
    };

    const xpValue = xp ?? 0;
    const level = levelFromXp(xpValue);

    return (
        <div className="p-4 sm:p-6 md:p-10 md:px-12 lg:px-20">
            <h2 className="font-game text-3xl sm:text-4xl mb-4">{t("title")}</h2>

            {/* Profile card */}
            <div className="p-4 border-4 rounded-2xl border-border">
                <div className="flex flex-col sm:flex-row gap-3 items-center sm:items-start">
                    <PixelAvatar
                        wallet={walletAddress}
                        size="xl"
                        className="border-4 border-border shrink-0"
                    />
                    <div className="min-w-0 w-full text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                            <p className="font-game text-xl sm:text-2xl truncate max-w-full">
                                {displayLabel}
                            </p>
                            <button
                                onClick={handleCopy}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Copy className="h-4 w-4" />
                            </button>
                            <a
                                href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                        <p className="font-game text-lg sm:text-xl text-muted-foreground mt-1">{t("level")} {level}</p>
                    </div>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-6">
                <div className="p-4 border-4 rounded-2xl text-center">
                    <BookOpen className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
                    <h2 className="font-game text-3xl">0</h2>
                    <h2 className="font-game text-xl text-muted-foreground">{t("coursesCompleted")}</h2>
                </div>
                <div className="p-4 border-4 rounded-2xl text-center">
                    <Award className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
                    <h2 className="font-game text-3xl">{credentials?.length ?? 0}</h2>
                    <h2 className="font-game text-xl text-muted-foreground">{t("credentials")}</h2>
                </div>
                <div className="p-4 border-4 rounded-2xl text-center">
                    <Sparkles className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
                    <h2 className="font-game text-3xl">{xpValue.toLocaleString()}</h2>
                    <h2 className="font-game text-xl text-muted-foreground">{t("totalXp")}</h2>
                </div>
            </div>

            {/* Credentials */}
            <div className="mt-6 sm:mt-8">
                <h2 className="font-game text-3xl sm:text-4xl mb-2">{t("credentials")}</h2>
                {credentials && credentials.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {credentials.map((cred) => (
                            <Link key={cred.asset} href={`/certificates/${cred.asset}`}>
                                <div className="p-4 border-4 rounded-2xl hover:bg-accent/50 transition-colors h-full">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award className="h-6 w-6 text-yellow-400" />
                                        <span className="font-game text-lg">Track {cred.trackId}</span>
                                    </div>
                                    <p className="font-game text-muted-foreground text-sm">
                                        Level {cred.level} · {cred.coursesCompleted} courses · {cred.totalXp.toLocaleString()} XP
                                    </p>
                                    <p className="font-game text-xs text-muted-foreground mt-1 truncate" title={cred.asset}>
                                        {cred.asset.slice(0, 8)}...
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 p-7 border border-border rounded-2xl bg-card">
                        <Award className="w-12 h-12 text-muted-foreground" />
                        <h2 className="font-game text-2xl">{tCommon("noCredentials")}</h2>
                        <p className="font-game text-muted-foreground">{tCommon("noCredentialsHint")}</p>
                        <Button variant="pixel" className="font-game text-lg">
                            <a href="/courses">{tCommon("browseCourses")}</a>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
