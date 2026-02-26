"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import {
    User,
    Sparkles,
    BookOpen,
    Award,
    Copy,
    ExternalLink,
    Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/app";
import { useXpBalance, useCredentials } from "@/hooks";
import { levelFromXp } from "@/lib/level";
import { toast } from "sonner";
import Link from "next/link";

function truncateWallet(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ProfilePage() {
    const { publicKey } = useWallet();
    const { data: xp } = useXpBalance();
    const { data: credentials } = useCredentials();
    const walletAddress = publicKey?.toBase58() ?? "";

    const handleCopy = () => {
        navigator.clipboard.writeText(walletAddress);
        toast.success("Wallet address copied");
    };

    const xpValue = xp ?? 0;
    const level = levelFromXp(xpValue);

    return (
        <div className="p-10 md:px-20">
            <h2 className="text-4xl mb-4 font-game">Profile</h2>

            {/* Profile card */}
            <div className="p-4 border-4 rounded-2xl">
                <div className="flex gap-3 items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-black">
                        <User className="h-8 w-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-game text-2xl">
                                {truncateWallet(walletAddress)}
                            </p>
                            <button
                                onClick={handleCopy}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <Copy className="h-4 w-4" />
                            </button>
                            <a
                                href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                        <p className="font-game text-xl text-gray-500">Level {level}</p>
                    </div>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-5 mt-6">
                <div className="p-4 border-4 rounded-2xl text-center">
                    <BookOpen className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
                    <h2 className="font-game text-3xl">0</h2>
                    <h2 className="font-game text-xl text-gray-500">Courses Completed</h2>
                </div>
                <div className="p-4 border-4 rounded-2xl text-center">
                    <Award className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
                    <h2 className="font-game text-3xl">{credentials?.length ?? 0}</h2>
                    <h2 className="font-game text-xl text-gray-500">Credentials</h2>
                </div>
                <div className="p-4 border-4 rounded-2xl text-center">
                    <Sparkles className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
                    <h2 className="font-game text-3xl">{xpValue.toLocaleString()}</h2>
                    <h2 className="font-game text-xl text-gray-500">Total XP</h2>
                </div>
            </div>

            {/* Credentials */}
            <div className="mt-8">
                <h2 className="text-4xl mb-2 font-game">Credentials</h2>
                {credentials && credentials.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {credentials.map((cred) => (
                            <Link key={cred.asset} href={`/certificates/${cred.asset}`}>
                                <div className="p-4 border-4 rounded-2xl hover:bg-zinc-800/50 transition-colors h-full">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award className="h-6 w-6 text-yellow-400" />
                                        <span className="font-game text-lg">Track {cred.trackId}</span>
                                    </div>
                                    <p className="font-game text-gray-400 text-sm">
                                        Level {cred.level} · {cred.coursesCompleted} courses · {cred.totalXp.toLocaleString()} XP
                                    </p>
                                    <p className="font-game text-xs text-gray-500 mt-1 truncate" title={cred.asset}>
                                        {cred.asset.slice(0, 8)}...
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 p-7 border rounded-2xl bg-zinc-900">
                        <Award className="w-12 h-12 text-gray-500" />
                        <h2 className="font-game text-2xl">No credentials yet</h2>
                        <p className="font-game text-gray-400">Complete courses to earn on-chain credential NFTs.</p>
                        <Button variant="pixel" className="font-game text-lg">
                            <a href="/courses">Browse Courses</a>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
