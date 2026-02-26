"use client";

import { useEffect } from "react";
import { useAppUser } from "@/hooks/useAppUser";
import { useUserStore } from "@/store/user-store";
import { Link } from "@/i18n/routing";
import Image from "next/image";

export default function CertificatesIndexPage() {
    const { user } = useAppUser();
    const credentials = useUserStore((s) => s.credentials);
    const isLoading = useUserStore((s) => s.isCredentialsLoading);
    const fetchCredentials = useUserStore((s) => s.fetchCredentials);

    useEffect(() => {
        if (user?.walletAddress) fetchCredentials(user.walletAddress);
    }, [user?.walletAddress, fetchCredentials]);

    return (
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-display font-bold text-white tracking-tight">
                    My Certificates
                </h1>
                <p className="text-text-muted text-sm mt-1 font-mono">
                    Your on-chain credentials earned from completed courses.
                </p>
            </header>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass-panel rounded-xl h-64 animate-pulse border border-white/5" />
                    ))}
                </div>
            ) : credentials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 glass-panel rounded-xl border border-white/5">
                    <span className="material-symbols-outlined notranslate text-text-muted text-5xl">workspace_premium</span>
                    <p className="text-text-muted font-mono text-sm text-center max-w-xs">
                        No certificates yet. Complete a course to earn your first on-chain credential!
                    </p>
                    <Link
                        href="/courses"
                        className="mt-2 px-4 py-2 bg-solana/10 text-solana border border-solana/20 rounded-lg text-sm font-mono hover:bg-solana/20 transition-colors"
                    >
                        Browse Courses →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {credentials.map((cred) => (
                        <Link key={cred.id} href={`/certificates/${cred.id}`}>
                            <div className="glass-panel group rounded-xl overflow-hidden border border-white/5 hover:border-solana/30 transition-all duration-300 cursor-pointer">
                                {/* Certificate preview */}
                                <div className="h-44 bg-gradient-to-br from-solana/10 to-void flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                        <span className="material-symbols-outlined notranslate text-[120px] text-solana">workspace_premium</span>
                                    </div>
                                    {cred.image ? (
                                        <Image
                                            src={cred.image}
                                            alt={`${cred.trackName} certificate`}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 z-10">
                                            <span className="material-symbols-outlined notranslate text-solana text-5xl">military_tech</span>
                                            <span className="text-xs font-mono text-solana/70 uppercase tracking-widest">
                                                {cred.trackName}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex flex-col gap-2">
                                    <p className="text-sm font-display font-semibold text-white group-hover:text-solana transition-colors">
                                        {cred.trackName} — Level {cred.level}
                                    </p>
                                    <p className="text-xs font-mono text-text-muted">
                                        {cred.coursesCompleted} courses · {cred.totalXpEarned.toLocaleString()} XP
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] font-mono text-text-muted">
                                            {new Date(cred.earnedAt).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                        <span className="text-[10px] font-mono text-solana/70 flex items-center gap-1 uppercase tracking-widest group-hover:text-solana transition-colors">
                                            View
                                            <span className="material-symbols-outlined notranslate text-[12px]">arrow_forward</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
