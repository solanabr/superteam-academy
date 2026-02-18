"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Copy, Users, Loader2 } from "lucide-react";
import clsx from "clsx";

type UserData = {
    referralCode: string;
    referralsCount: number;
};

export function ReferralCard() {
    const { authenticated, user } = usePrivy();
    const { wallets } = useWallets();
    const linkedAddress =
        user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
    const walletAddress = linkedAddress ?? wallets?.[0]?.address;

    const [data, setData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!authenticated || !walletAddress) return;

        setLoading(true);
        fetch(`/api/user?wallet=${encodeURIComponent(walletAddress)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data.referralCode) {
                    setData({
                        referralCode: data.referralCode,
                        referralsCount: data.referralsCount || 0,
                    });
                }
            })
            .catch((err) => console.error("Failed to fetch user data", err))
            .finally(() => setLoading(false));
    }, [authenticated, walletAddress]);

    const copyToClipboard = () => {
        if (!data?.referralCode) return;
        // In a real app, we'd construct a full URL like: https://academy.superteam.fun?ref=CODE
        // For now, just the code.
        const url = `${window.location.origin}?ref=${data.referralCode}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!authenticated) return null;

    if (loading) {
        return (
            <div className="glass-panel h-full flex items-center justify-center p-6 rounded-lg border">
                <Loader2 className="h-6 w-6 animate-spin text-solana" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="glass-panel flex flex-col gap-4 rounded-lg border p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 translate-y--12 rounded-full bg-solana/10 blur-3xl" />

            <div className="relative z-10">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-solana" />
                    Referrals
                </h3>
                <p className="text-text-secondary text-sm mt-1">
                    Invite friends and earn XP together.
                </p>
            </div>

            <div className="relative z-10 mt-2">
                <div className="text-3xl font-bold text-white">{data.referralsCount}</div>
                <div className="text-text-secondary text-xs uppercase tracking-wider font-medium">Referred Users</div>
            </div>

            <div className="relative z-10 mt-auto pt-4">
                <label className="text-xs text-text-secondary block mb-1">Your Referral Link</label>
                <div className="flex gap-2">
                    <code className="bg-black/30 rounded px-3 py-2 text-sm text-solana flex-1 truncate border border-white/10">
                        {data.referralCode}
                    </code>
                    <button
                        onClick={copyToClipboard}
                        className={clsx(
                            "p-2 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors",
                            copied ? "text-green-400" : "text-text-secondary"
                        )}
                    >
                        <Copy className="h-4 w-4" />
                    </button>
                </div>
                {copied && <span className="text-green-400 text-xs mt-1 block">Copied to clipboard!</span>}
            </div>
        </div>
    );
}
