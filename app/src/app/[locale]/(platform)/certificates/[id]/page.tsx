"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { toPng } from "html-to-image";

import { Loader2, Download, ExternalLink, Share2, Award, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface CredentialDetail {
    id: string;
    trackName: string;
    level: number;
    coursesCompleted: number;
    totalXpEarned: number;
    earnedAt: string;
    image?: string;
    walletAddress?: string;
    owner?: string;
    mintAddress?: string;
}

export default function CertificatePage() {
    const params = useParams();
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const t = useTranslations("certificates");
    const certificateRef = useRef<HTMLDivElement>(null);

    const [credential, setCredential] = useState<CredentialDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        fetch(`/api/credentials/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Credential not found");
                return res.json();
            })
            .then(data => {
                setCredential({
                    ...data,
                    owner: data.walletAddress || data.userId, // Fallback for various sources
                });
            })
            .catch(err => {
                console.error("Failed to fetch credential:", err);
                setError(err.message);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleShareX = () => {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(`I just earned a Level ${credential?.level} ${credential?.trackName} credential on @SuperteamEarn Academy! 🎓✨ #Solana #SuperteamBrazil`);
        window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, "_blank");
    };

    const handleShareLinkedIn = () => {
        const url = encodeURIComponent(window.location.href);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
    };

    const handleDownload = async () => {
        if (!certificateRef.current) return;
        setDownloading(true);

        try {
            // High DPI capture using html-to-image
            // We've removed external stylesheets that were causing SecurityError/TypeError
            const dataUrl = await toPng(certificateRef.current, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: "#0A0A0B",
            });

            const link = document.createElement("a");
            link.download = `superteam-academy-${credential?.trackName?.toLowerCase()}-certificate.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Failed to download certificate:", err);
            alert("Failed to generate download. Please try again or take a screenshot.");
        } finally {
            setDownloading(false);
        }
    };

    const explorerAddress = credential?.mintAddress || credential?.id;
    const isValidExplorerLink = !!explorerAddress && explorerAddress.length > 20;

    return (
        <main className="pt-4 pb-12">
            <div className="max-w-4xl mx-auto px-6 py-8 md:px-10 md:py-10 flex flex-col gap-10">
                {loading ? (
                    <div className="flex justify-center items-center py-32">
                        <Loader2 className="h-10 w-10 animate-spin text-solana" />
                    </div>
                ) : error || !credential ? (
                    <div className="glass-panel p-10 text-center rounded-xl border border-rust/30">
                        <h2 className="text-2xl font-display font-bold text-rust mb-2">{t("not_found_title")}</h2>
                        <p className="text-text-muted">{t("not_found_desc")}</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center space-y-2">
                            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-solana/10 text-solana uppercase tracking-wider border border-solana/20">
                                {t("verified")}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight pt-4">
                                {credential.trackName}
                            </h1>
                            <p className="text-text-muted text-lg">
                                Awarded to <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded">{credential.owner?.slice(0, 4)}...{credential.owner?.slice(-4)}</span>
                            </p>
                        </div>

                        {/* Certificate Render Area (Captured for PNG) */}
                        <div ref={certificateRef} className="glass-panel rounded-2xl overflow-hidden border border-white/10 relative p-1 group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-solana/20 via-transparent to-transparent opacity-50"></div>
                            <div className="relative bg-void rounded-xl overflow-hidden border border-white/5 p-8 md:p-12 min-h-[500px] flex flex-col items-center justify-between bg-[url('/grid.svg')] bg-center backdrop-blur-sm">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-void/90"></div>

                                {/* Top Badge & Branding */}
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-solana to-emerald-900 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(20,241,149,0.4)]">
                                        <Award size={48} strokeWidth={1.5} className="text-void" />
                                    </div>
                                    <h2 className="text-5xl font-display text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-6 drop-shadow-sm leading-tight uppercase font-bold tracking-tighter">
                                        Certificate of Completion
                                    </h2>
                                    <div className="max-w-md mx-auto h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>

                                    <p className="text-text-muted mb-8 text-lg px-4 italic leading-relaxed">
                                        This certifies that the recipient has successfully completed the <strong className="text-white font-semibold">{credential.trackName}</strong> track on Superteam Academy, demonstrating practical knowledge and on-chain proficiency.
                                    </p>
                                </div>

                                {/* Metadata inside the render (for the download) */}
                                <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/10">
                                    <div className="flex flex-col items-center md:items-start">
                                        <p className="text-[10px] uppercase font-mono text-solana/60 tracking-[0.2em] mb-1">Recipient</p>
                                        <p className="text-sm font-mono text-white tracking-tighter">
                                            {credential.owner ? `${credential.owner.slice(0, 8)}...${credential.owner.slice(-8)}` : "Learner"}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <p className="text-[10px] uppercase font-mono text-solana/60 tracking-[0.2em] mb-1">Date Issued</p>
                                        <p className="text-sm font-mono text-white">
                                            {new Date(credential.earnedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-center md:items-end">
                                        <p className="text-[10px] uppercase font-mono text-solana/60 tracking-[0.2em] mb-1">Asset ID</p>
                                        <p className="text-sm font-mono text-white tracking-tighter">
                                            {credential.id.slice(0, 8)}...{credential.id.slice(-8)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Public Metadata & Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-panel p-6 rounded-xl space-y-4">
                                <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-solana" />
                                    On-Chain Metadata
                                </h3>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-text-muted text-sm">Asset ID</span>
                                    <span className="font-mono text-xs text-white bg-white/5 px-2 py-1 rounded truncate ml-4" title={credential.id}>
                                        {credential.id}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-text-muted text-sm">Standard</span>
                                    <span className="font-mono text-xs text-solana">Metaplex Core</span>
                                </div>
                                <div className="pt-2">
                                    {isValidExplorerLink ? (
                                        <a href={`https://explorer.solana.com/address/${explorerAddress}?cluster=devnet`} target="_blank" rel="noreferrer" className="text-solana text-sm hover:underline flex items-center gap-1 group">
                                            View on Solana Explorer <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </a>
                                    ) : (
                                        <span className="text-text-muted text-xs italic">Syncing with blockchain...</span>
                                    )}
                                </div>
                            </div>

                            <div className="glass-panel p-6 rounded-xl flex flex-col justify-center gap-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-display font-semibold text-white">Actions</h3>
                                    <Button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        variant="ghost"
                                        size="sm"
                                        className="text-solana hover:text-solana hover:bg-solana/10 gap-2 font-mono h-8"
                                    >
                                        {downloading ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Download size={14} />
                                        )}
                                        {downloading ? "Generating PNG..." : "Download Original"}
                                    </Button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Button
                                        onClick={handleShareX}
                                        variant="outline"
                                        className="w-full h-12 bg-white/5 border-white/10 hover:border-[#1DA1F2]/30 text-white rounded-lg flex items-center justify-center gap-3 font-semibold transition-all group"
                                    >
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                        Share on X
                                    </Button>
                                    <Button
                                        onClick={handleShareLinkedIn}
                                        variant="outline"
                                        className="w-full h-12 bg-white/5 border-white/10 hover:border-blue-500/30 text-white rounded-lg flex items-center justify-center gap-3 font-semibold transition-all group"
                                    >
                                        <Share2 size={18} className="text-[#0077b5]" />
                                        Share on LinkedIn
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
