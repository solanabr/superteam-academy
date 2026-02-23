"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAppUser } from "@/hooks/useAppUser";
import { Loader2, Coins, CalendarDays, ExternalLink, ShieldCheck, Trophy, Github, Twitter, Globe, LinkIcon } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { ACHIEVEMENTS } from "@/lib/achievements";

type ProfileData = {
    user: {
        id: string;
        walletAddress: string;
        createdAt: string;
        profile: any;
    };
    xp: number;
    level: number;
    achievementFlags: number[];
    credentials: { id: string; trackId: string; trackName: string; mintAddress: string | null; earnedAt: string }[];
};

export default function ProfilePage() {
    const { user } = useAppUser();
    const params = useParams();
    const wallet = params.wallet as string;

    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!wallet) return;

        setLoading(true);
        fetch(`/api/user/${wallet}`)
            .then(res => {
                if (!res.ok) throw new Error("User not found");
                return res.json();
            })
            .then(resData => {
                setData(resData);
            })
            .catch(err => {
                setError(err.message);
            })
            .finally(() => setLoading(false));
    }, [wallet]);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="text-solana h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <ShieldCheck className="mx-auto h-12 w-12 text-white/10 mb-4" />
                <h1 className="text-2xl font-display font-semibold text-text-primary mb-2">Profile Not Found</h1>
                <p className="text-text-secondary">We couldn't find a user with this wallet address.</p>
                <Link href="/leaderboard" className="mt-6 inline-block">
                    <Button variant="outline" size="sm">
                        Back to Leaderboard
                    </Button>
                </Link>
            </div>
        );
    }

    const P = data.user.profile || {};
    const displayName = P.displayName || `User ${data.user.walletAddress.substring(0, 4)}...${data.user.walletAddress.substring(data.user.walletAddress.length - 4)}`;

    const achievements = ACHIEVEMENTS.map((def) => {
        return {
            ...def,
            claimed: data.achievementFlags?.includes(def.bitIndex) || false,
        };
    }).filter(a => a.claimed);

    const credentials = data.credentials;

    return (
        <main className="min-h-screen bg-void pt-8 pb-16">
            <div className="mx-auto max-w-4xl px-4 space-y-8">
                {user?.walletAddress === data.user.walletAddress && data.xp === 0 && (
                    <div className="border border-solana/20 bg-solana/5 rounded-lg p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-solana" />
                            <p className="text-sm text-text-secondary">
                                Ready to start your journey? Enroll in a course to earn XP and climb the leaderboard!
                            </p>
                        </div>
                        <Link href="/courses" className="text-xs font-bold uppercase tracking-wider text-solana hover:underline whitespace-nowrap">
                            Explore Courses
                        </Link>
                    </div>
                )}

                {/* ── Header ──────────────────────────────────────── */}
                <div className="glass-panel p-8 rounded-lg border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-solana/20 via-blue-500/10 to-transparent opacity-50"></div>

                    <div className="relative flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                        <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-xl overflow-hidden bg-black/50 border-2 border-solana/30 shadow-xl flex-shrink-0">
                            <img
                                src={`https://api.dicebear.com/9.x/bottts/svg?seed=${data.user.walletAddress}&backgroundColor=0a0a0b&baseColor=14f195&radius=50`}
                                alt={displayName}
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <div className="flex-1 space-y-3">
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">{displayName}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="font-mono text-sm text-text-muted bg-white/5 px-2 py-0.5 rounded cursor-copy hover:text-white transition-colors">
                                        {data.user.walletAddress.slice(0, 6)}...{data.user.walletAddress.slice(-4)}
                                    </span>
                                    <span className="text-xs text-text-muted flex items-center gap-1">
                                        <CalendarDays className="h-3 w-3" />
                                        Joined {new Date(data.user.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {P.bio && (
                                <p className="text-text-secondary text-sm leading-relaxed max-w-2xl">{P.bio}</p>
                            )}

                            {/* Social Links */}
                            <div className="flex items-center gap-3 pt-2">
                                {P.twitter && (
                                    <a href={P.twitter.startsWith('http') ? P.twitter : `https://${P.twitter}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-[#1DA1F2] transition-colors p-1.5 bg-white/5 hover:bg-white/10 rounded-full">
                                        <Twitter className="h-4 w-4" />
                                    </a>
                                )}

                                {P.website && (
                                    <a href={P.website.startsWith('http') ? P.website : `https://${P.website}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-solana transition-colors p-1.5 bg-white/5 hover:bg-white/10 rounded-full">
                                        <Globe className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Stats Box */}
                        <div className="flex bg-black/40 border border-white/10 rounded-lg overflow-hidden sm:ml-auto self-stretch sm:self-auto min-w-[200px]">
                            <div className="flex-1 p-4 border-r border-white/10 flex flex-col justify-center items-center">
                                <span className="text-xs text-text-muted font-mono uppercase tracking-widest mb-1">Level</span>
                                <span className="text-2xl font-bold font-mono text-white">{data.level}</span>
                            </div>
                            <div className="flex-1 p-4 flex flex-col justify-center items-center">
                                <span className="text-xs text-text-muted font-mono uppercase tracking-widest mb-1 flex items-center gap-1">XP <Coins className="h-3 w-3 text-solana" /></span>
                                <span className="text-2xl font-bold font-mono text-solana">{data.xp.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>



                {/* Course Credentials */}
                <section className="space-y-4">
                    <h2 className="text-lg font-display font-semibold text-text-primary flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-solana" />
                        Certificates & Credentials
                    </h2>

                    {credentials.length === 0 ? (
                        <div className="glass-panel p-8 text-center rounded-lg border border-white/5">
                            <p className="text-text-muted text-sm border border-dashed border-white/10 rounded-lg p-6">No certificates earned yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {credentials.map(cred => (
                                <div key={cred.id} className="glass-panel p-4 rounded-lg border border-white/5 flex items-center gap-4 hover:border-solana/30 hover:bg-white/[0.03] transition-all duration-300 group">
                                    <div className="h-10 w-10 rounded-md bg-solana/10 flex flex-col items-center justify-center text-solana flex-shrink-0">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-white capitalize">{cred.trackName.replace(/-/g, " ")}</h3>
                                        <p className="text-xs text-text-muted font-mono mt-0.5">{new Date(cred.earnedAt).toLocaleDateString()}</p>
                                    </div>
                                    {cred.mintAddress && (
                                        <a
                                            href={`https://explorer.solana.com/address/${cred.mintAddress}?cluster=devnet`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-mono text-white/40 hover:text-solana flex items-center gap-1 transition-colors px-2 py-1 bg-white/5 rounded opacity-0 group-hover:opacity-100"
                                        >
                                            <LinkIcon className="h-3 w-3" />
                                            View On-Chain
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

