"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Loader2, Medal } from "lucide-react";
import { useUserStore, type Credential } from "@/store/user-store";
import { Button } from "@/components/ui/button";


export function CredentialList({ walletAddress: propAddress }: { walletAddress?: string }) {
    const { user: privyUser } = usePrivy();
    const { wallets } = useWallets();
    const {
        credentials,
        isCredentialsLoading: loading,
        fetchCredentials
    } = useUserStore();

    const linkedAddress =
        privyUser?.wallet?.address ?? privyUser?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
    const resolvedAddress = propAddress ?? linkedAddress ?? wallets?.[0]?.address;

    const [filter, setFilter] = useState<string>("all");
    const tracks = ["all", "rust", "anchor", "security", "solana"];

    useEffect(() => {
        if (resolvedAddress) {
            fetchCredentials(resolvedAddress);
        }
    }, [resolvedAddress, fetchCredentials]);

    if (loading && credentials.length === 0) {
        return <Loader2 className="h-6 w-6 animate-spin text-solana" />;
    }

    if (!resolvedAddress) return null;

    if (credentials.length === 0) {
        return (
            <div className="glass-panel rounded-lg border p-6 text-center">
                <p className="text-text-secondary">No credentials yet. Complete courses to earn them!</p>
            </div>
        );
    }

    const sortedCredentials = [...credentials].sort((a, b) => {
        const trackCompare = (a.trackName || "").localeCompare(b.trackName || "");
        if (trackCompare !== 0) return trackCompare;
        const dateA = new Date(a.earnedAt).getTime();
        const dateB = new Date(b.earnedAt).getTime();
        return dateB - dateA;
    });

    const filteredCredentials = filter === "all"
        ? sortedCredentials
        : sortedCredentials.filter(c => c.trackName?.toLowerCase() === filter.toLowerCase());

    return (
        <div className="flex flex-col gap-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 overflow-x-auto pb-2 no-scrollbar">
                {tracks.map((track) => (
                    <Button
                        key={track}
                        variant={filter === track ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter(track)}
                        className="uppercase tracking-wider text-[11px] font-mono h-8"
                    >
                        {track}
                    </Button>
                ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCredentials.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-text-secondary">
                        No certificates found for {filter.toUpperCase()}.
                    </div>
                ) : (
                    filteredCredentials.map((cred) => (
                        <Link
                            key={cred.id}
                            href={`/certificates/${cred.id}`}
                            className="glass-panel relative overflow-hidden rounded-lg border p-6 group block transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-solana/10 blur-2xl group-hover:bg-solana/20 transition-all" />

                            {cred.image ? (
                                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <img src={cred.image} alt={cred.trackName} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-void to-transparent" />
                                </div>
                            ) : null}

                            <div className="relative z-10 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-solana mb-4">
                                    <Medal className="h-6 w-6" />
                                    <span className="font-display font-bold uppercase tracking-wider text-sm">
                                        {cred.trackName}
                                    </span>
                                </div>
                                <div className="mt-2 text-xs text-text-secondary opacity-50">
                                    {new Date(cred.earnedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
