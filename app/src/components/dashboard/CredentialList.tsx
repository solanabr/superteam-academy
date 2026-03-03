"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Loader2, Medal } from "lucide-react";
import { useUserStore, type Credential } from "@/store/user-store";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";


export function CredentialList({
    walletAddress: propAddress,
    initialData
}: {
    walletAddress?: string;
    initialData?: Credential[];
}) {
    const { user: privyUser } = usePrivy();
    const { wallets } = useWallets();
    const {
        credentials: storeCredentials,
        isCredentialsLoading: storeLoading,
        fetchCredentials,
        hasMoreCredentials: storeHasMore,
        credentialPage
    } = useUserStore();
    const t = useTranslations("components");

    // UI State
    const [filter, setFilter] = useState<string>("all");
    const tracks = ["all", "rust", "anchor", "security", "solana"];

    // Local pagination state for initialData mode
    const PAGE_SIZE = 5;
    const [localCredentials, setLocalCredentials] = useState<Credential[]>(initialData ?? []);
    const [localPage, setLocalPage] = useState(1);
    const [localHasMore, setLocalHasMore] = useState(
        initialData ? initialData.length >= PAGE_SIZE : false
    );
    const [localLoading, setLocalLoading] = useState(false);

    const linkedAddress =
        privyUser?.wallet?.address ?? privyUser?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
    const resolvedAddress = propAddress ?? linkedAddress ?? wallets?.[0]?.address;

    const isInitialDataMode = !!initialData;

    // Effects
    useEffect(() => {
        // Only fetch from store if initialData is NOT provided
        if (resolvedAddress && !isInitialDataMode) {
            fetchCredentials(resolvedAddress, 1, false);
        }
    }, [resolvedAddress, fetchCredentials, isInitialDataMode]);

    // Sync initialData changes (e.g. when profile store refreshes)
    useEffect(() => {
        if (initialData) {
            setLocalCredentials(initialData);
            setLocalHasMore(initialData.length >= PAGE_SIZE);
            setLocalPage(1);
        }
    }, [initialData]);

    const handleLoadMore = async () => {
        if (isInitialDataMode) {
            // Fetch next page directly from the credentials API
            if (!resolvedAddress || localLoading) return;
            setLocalLoading(true);
            const nextPage = localPage + 1;
            try {
                const res = await fetch(
                    `/api/credentials?wallet=${encodeURIComponent(resolvedAddress)}&page=${nextPage}&limit=${PAGE_SIZE}`,
                    { cache: "no-store" }
                );
                if (res.ok) {
                    const data = await res.json();
                    const newCreds = data.credentials || [];
                    setLocalCredentials(prev => [...prev, ...newCreds]);
                    setLocalHasMore(data.pagination?.hasMore ?? newCreds.length === PAGE_SIZE);
                    setLocalPage(nextPage);
                }
            } catch (e) {
                console.error("Load more credentials error:", e);
            } finally {
                setLocalLoading(false);
            }
        } else {
            if (resolvedAddress) {
                fetchCredentials(resolvedAddress, credentialPage + 1, true);
            }
        }
    };

    // Determine which data source to use
    const credentials = isInitialDataMode ? localCredentials : storeCredentials;
    const loading = isInitialDataMode ? localLoading : storeLoading;
    const hasMore = isInitialDataMode ? localHasMore : storeHasMore;

    // Early Returns (must be AFTER all hooks)
    if (loading && credentials.length === 0) {
        return <Loader2 className="h-6 w-6 animate-spin text-solana" />;
    }

    if (!resolvedAddress) return null;

    if (credentials.length === 0) {
        return (
            <div className="glass-panel rounded-lg border p-6 text-center">
                <p className="text-text-secondary">{t("no_credentials")}</p>
            </div>
        );
    }

    const filteredCredentials = filter === "all"
        ? credentials
        : credentials.filter(c => c.trackName?.toLowerCase() === filter.toLowerCase());

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
                    <>
                        {filteredCredentials.map((cred) => (
                            <Link
                                key={cred.id}
                                href={`/certificates/${cred.mintAddress || cred.id}`}
                                prefetch={true}
                                className="glass-panel relative overflow-hidden rounded-lg border p-6 group block transition-transform hover:scale-[1.02] active:scale-[0.98]"
                            >

                                {cred.image ? (
                                    <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity">
                                        <img src={cred.image} alt={cred.trackName} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-void to-transparent" />
                                    </div>
                                ) : null}

                                <div className="relative z-10 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-solana mb-1">
                                        <Medal className="h-4 w-5" />
                                        <span className="font-display font-bold uppercase tracking-wider text-[10px] opacity-70">
                                            {cred.trackName}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-display font-bold text-lg leading-tight group-hover:text-solana transition-colors">
                                        {cred.courseName || cred.trackName}
                                    </h3>
                                    <div className="mt-2 text-[10px] font-mono text-text-secondary opacity-50">
                                        {new Date(cred.earnedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {hasMore && filter === "all" && (
                            <div className="col-span-full flex justify-center mt-6">
                                <Button
                                    variant="outline"
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    className="border-solana/20 text-solana hover:bg-solana/10"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {t("load_more_certificates") || "Load More Certificates"}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
