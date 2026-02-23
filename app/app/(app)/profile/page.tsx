"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import {
    User,
    Sparkles,
    BookOpen,
    Award,
    Copy,
    ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/app";
import { useXpBalance } from "@/hooks";
import { toast } from "sonner";

function truncateWallet(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ProfilePage() {
    const { publicKey } = useWallet();
    const { data: xp } = useXpBalance();
    const walletAddress = publicKey?.toBase58() ?? "";

    const handleCopy = () => {
        navigator.clipboard.writeText(walletAddress);
        toast.success("Wallet address copied");
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Profile" subtitle="Your academy profile and stats" />

            {/* Profile card */}
            <Card className="p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                        <div className="flex items-center justify-center gap-2 sm:justify-start">
                            <p className="font-mono text-sm font-medium">
                                {truncateWallet(walletAddress)}
                            </p>
                            <button
                                onClick={handleCopy}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </button>
                            <a
                                href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>
                        <div className="flex items-center justify-center gap-4 sm:justify-start">
                            <Badge variant="outline" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                {(xp ?? 0).toLocaleString()} XP
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                                Level {Math.floor((xp ?? 0) / 500) + 1}
                            </Badge>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Stats grid */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="p-4 text-center">
                    <BookOpen className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Courses Completed</p>
                </Card>
                <Card className="p-4 text-center">
                    <Award className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Credentials</p>
                </Card>
                <Card className="p-4 text-center">
                    <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                    <p className="text-2xl font-bold">{(xp ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total XP</p>
                </Card>
            </div>

            {/* Credentials */}
            <div className="space-y-3">
                <h3 className="font-semibold">Credentials</h3>
                <EmptyState
                    icon={Award}
                    title="No credentials yet"
                    description="Complete courses to earn on-chain credential NFTs."
                    action={
                        <Button asChild variant="outline" size="sm">
                            <a href="/courses">Browse Courses</a>
                        </Button>
                    }
                />
            </div>
        </div>
    );
}
