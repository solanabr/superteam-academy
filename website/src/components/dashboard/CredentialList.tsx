"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Loader2, Medal } from "lucide-react";

type Credential = {
    id: string;
    trackName: string;
    level: number;
    coursesCompleted: number;
    totalXpEarned: number;
    earnedAt: string;
};

export function CredentialList() {
    const { authenticated, user } = usePrivy();
    const { wallets } = useWallets();

    const linkedAddress =
        user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
    const walletAddress = linkedAddress ?? wallets?.[0]?.address;

    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!authenticated || !walletAddress) return;

        setLoading(true);
        fetch(`/api/credentials?wallet=${encodeURIComponent(walletAddress)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.credentials) {
                    setCredentials(data.credentials);
                }
            })
            .catch((err) => console.error("Failed to fetch credentials", err))
            .finally(() => setLoading(false));
    }, [authenticated, walletAddress]);

    if (!authenticated) return null;

    if (loading) {
        return <Loader2 className="h-6 w-6 animate-spin text-solana" />;
    }

    if (credentials.length === 0) {
        return (
            <div className="glass-panel rounded-lg border p-6 text-center">
                <p className="text-text-secondary">No credentials yet. Complete courses to earn them!</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {credentials.map((cred) => (
                <div key={cred.id} className="glass-panel relative overflow-hidden rounded-lg border p-6">
                    <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-solana/10 blur-2xl" />
                    <div className="relative z-10 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-solana">
                            <Medal className="h-6 w-6" />
                            <span className="font-display font-bold uppercase tracking-wider text-sm">
                                {cred.trackName}
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-white">Level {cred.level}</div>
                        <div className="text-text-secondary text-sm">
                            <p>{cred.coursesCompleted} courses completed</p>
                            <p>{cred.totalXpEarned} XP earned</p>
                        </div>
                        <div className="mt-2 text-xs text-text-secondary opacity-50">
                            {new Date(cred.earnedAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
