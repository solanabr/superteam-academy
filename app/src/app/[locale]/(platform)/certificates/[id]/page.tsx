"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CredentialDetail {
    id: string;
    trackName: string;
    level: number;
    coursesCompleted: number;
    totalXpEarned: number;
    earnedAt: string;
    image?: string;
    owner?: string;
    txHash?: string;
}

export default function CertificatePage() {
    const params = useParams();
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

    const [credential, setCredential] = useState<CredentialDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        // We reuse the credentials API but in a real app would fetch a specific asset via DAS
        // For MVP, if they land here, we'll just mock a fetch to render the UI using the id.
        const timer = setTimeout(() => {
            setCredential({
                id,
                trackName: "Rust Fundamentals",
                level: 2,
                coursesCompleted: 1,
                totalXpEarned: 1540,
                earnedAt: new Date().toISOString(),
                owner: "3B5v...9Tq2",
                txHash: "5N2a...r8xZ"
            });
            setLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [id]);

    const handleShareTwitter = () => {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(`I just earned a Level ${credential?.level} ${credential?.trackName} credential on @SuperteamEarn Academy! 🎓✨`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
    };

    const handleShareLinkedIn = () => {
        const url = encodeURIComponent(window.location.href);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
    };

    return (
        <main className="min-h-screen bg-void pt-4 pb-12">
            <div className="max-w-4xl mx-auto px-6 py-8 md:px-10 md:py-10 flex flex-col gap-10">
                {loading ? (
                    <div className="flex justify-center items-center py-32">
                        <Loader2 className="h-10 w-10 animate-spin text-solana" />
                    </div>
                ) : error || !credential ? (
                    <div className="glass-panel p-10 text-center rounded-xl border border-rust/30">
                        <h2 className="text-2xl font-display font-bold text-rust mb-2">Certificate Not Found</h2>
                        <p className="text-text-muted">The credential you are looking for does not exist or has been burned.</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center space-y-2">
                            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-solana/10 text-solana uppercase tracking-wider border border-solana/20">
                                Verified Credential
                            </span>
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight pt-4">
                                {credential.trackName}
                            </h1>
                            <p className="text-text-muted text-lg">
                                Awarded to <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded">{credential.owner}</span>
                            </p>
                        </div>

                        {/* Certificate Render */}
                        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 relative p-1 group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-solana/20 via-transparent to-transparent opacity-50"></div>
                            <div className="relative bg-void/90 rounded-xl overflow-hidden border border-white/5 p-8 md:p-12 min-h-[400px] flex items-center justify-center bg-[url('/grid.svg')] bg-center backdrop-blur-sm">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-void/80"></div>

                                <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
                                    <div className="w-24 h-24 bg-gradient-to-br from-solana to-emerald-900 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(20,241,149,0.3)]">
                                        <span className="material-symbols-outlined text-5xl text-void">verified</span>
                                    </div>
                                    <h2 className="text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-6 drop-shadow-sm">
                                        Certificate of Completion
                                    </h2>
                                    <p className="text-text-muted mb-8 text-lg">
                                        This certifies that the recipient has successfully completed the <strong className="text-white">{credential.trackName}</strong> track on Superteam Academy, demonstrating practical knowledge and on-chain proficiency.
                                    </p>
                                    <div className="grid grid-cols-2 gap-8 w-full border-t border-white/10 pt-6">
                                        <div>
                                            <p className="text-xs uppercase font-mono text-solana tracking-widest mb-1">Level Reached</p>
                                            <p className="text-2xl font-mono text-white">{credential.level}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase font-mono text-solana tracking-widest mb-1">Date Issued</p>
                                            <p className="text-lg font-mono text-white mt-1">
                                                {new Date(credential.earnedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metadata & Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-panel p-6 rounded-xl space-y-4">
                                <h3 className="font-display font-semibold text-white mb-4">On-Chain Metadata</h3>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-text-muted text-sm">Asset ID</span>
                                    <span className="font-mono text-xs text-white bg-white/5 px-2 py-1 rounded">{credential.id.slice(0, 8)}...{credential.id.slice(-8)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-text-muted text-sm">Standard</span>
                                    <span className="font-mono text-xs text-solana">Metaplex Core</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-text-muted text-sm">Total XP</span>
                                    <span className="font-mono text-xs text-white">{credential.totalXpEarned.toLocaleString()}</span>
                                </div>
                                <div className="pt-2">
                                    <a href={`https://explorer.solana.com/address/${credential.id}?cluster=devnet`} target="_blank" rel="noreferrer" className="text-solana text-sm hover:underline flex items-center gap-1">
                                        View on Solana Explorer <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                    </a>
                                </div>
                            </div>

                            <div className="glass-panel p-6 rounded-xl flex flex-col justify-center gap-4">
                                <h3 className="font-display font-semibold text-white text-center mb-2">Share Your Achievement</h3>
                                <Button
                                    onClick={handleShareTwitter}
                                    variant="outline"
                                    className="w-full py-6 bg-[#1DA1F2]/10 text-[#1DA1F2] border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/20 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all"
                                >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                                    Share on Twitter / X
                                </Button>
                                <Button
                                    onClick={handleShareLinkedIn}
                                    variant="outline"
                                    className="w-full py-6 bg-[#0077b5]/10 text-[#0077b5] border-[#0077b5]/30 hover:bg-[#0077b5]/20 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all"
                                >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                                    Share on LinkedIn
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </main>
    );
}
