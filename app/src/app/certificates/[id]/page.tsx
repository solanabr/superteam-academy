"use client";

import { useParams } from "next/navigation";
import { ExternalLink, Share2, Award, Zap, BookOpen, Shield } from "lucide-react";
import { toast } from "sonner";

// Demo credential data (in production: fetched from Helius DAS by asset ID)
const DEMO_CREDENTIAL = {
    id: "AnchorDev_credential_001",
    name: "Anchor Developer — Beginner",
    track: "Anchor Development",
    level: "Beginner",
    issuedTo: "Dev1234...5678",
    coursesCompleted: 1,
    totalXP: 1200,
    issuedAt: "March 2026",
    assetAddress: "CredAss1...example",
    collection: "ACADanchor...collection",
    emoji: "⚓",
    color: "from-purple-600 to-purple-900",
};

export default function CertificatePage() {
    const params = useParams();
    const id = params?.id as string;

    const cred = DEMO_CREDENTIAL; // In production: fetch by id via Helius DAS

    function handleShare() {
        const url = `${window.location.origin}/certificates/${id}`;
        navigator.clipboard.writeText(url);
        toast.success("Certificate link copied to clipboard!");
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
                <div className="text-center mb-8">
                    <h1 className="font-heading text-3xl font-bold mb-2">Verifiable Certificate</h1>
                    <p className="text-[hsl(var(--muted-foreground))]">Issued onchain as a Metaplex Core soulbound NFT</p>
                </div>

                {/* Certificate card */}
                <div className={`relative rounded-3xl bg-gradient-to-br ${cred.color} p-1 mb-6 shadow-2xl`}>
                    <div className="bg-[hsl(225_20%_7%)] rounded-3xl p-8 sm:p-12">
                        {/* Background pattern */}
                        <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-10">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_hsl(263_90%_67%),_transparent_60%)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,_hsl(162_100%_47%),_transparent_60%)]" />
                        </div>

                        <div className="relative">
                            {/* Logo & header */}
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <p className="text-xs font-semibold text-purple-300 uppercase tracking-widest mb-1">Superteam Brazil</p>
                                    <p className="font-heading font-bold text-lg gradient-text">Academy</p>
                                </div>
                                <Shield className="w-10 h-10 text-purple-400 opacity-60" />
                            </div>

                            {/* Main content */}
                            <div className="text-center mb-10">
                                <div className="text-7xl mb-4">{cred.emoji}</div>
                                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">This certifies that</p>
                                <p className="font-heading font-bold text-2xl sm:text-3xl mb-1">{cred.issuedTo}</p>
                                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">has successfully completed</p>
                                <p className="font-heading font-bold text-3xl sm:text-4xl gradient-text mb-2">{cred.name}</p>
                                <p className="text-[hsl(var(--muted-foreground))]">{cred.track} Track</p>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {[
                                    { label: "Level", value: cred.level, icon: Award },
                                    { label: "XP Earned", value: `${cred.totalXP.toLocaleString()}`, icon: Zap },
                                    { label: "Courses", value: cred.coursesCompleted.toString(), icon: BookOpen },
                                ].map(({ label, value, icon: Icon }) => (
                                    <div key={label} className="text-center">
                                        <Icon className="w-4 h-4 mx-auto mb-1 text-purple-300" />
                                        <p className="font-heading font-bold text-lg">{value}</p>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-[hsl(var(--border))] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                                <p>Issued {cred.issuedAt} · Solana Devnet</p>
                                <p className="font-mono">Asset: {cred.assetAddress}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 bg-[hsl(var(--primary))] text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all hover:shadow-[var(--glow-purple)]"
                    >
                        <Share2 className="w-4 h-4" /> Share Certificate
                    </button>

                    <a
                        href={`https://explorer.solana.com/address/${cred.assetAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] font-semibold px-6 py-3 rounded-xl hover:border-[hsl(var(--primary)/0.5)] transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" /> Verify Onchain
                    </a>
                </div>

                {/* Verification info */}
                <div className="glass rounded-xl p-5 mt-6">
                    <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-400" /> Onchain Verification
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {[
                            { label: "Program", value: "ACADBR...3ucf" },
                            { label: "Standard", value: "Metaplex Core NFT" },
                            { label: "Type", value: "Soulbound (Non-transferable)" },
                            { label: "Collection", value: cred.collection },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
                                <p className="font-mono text-xs font-medium mt-0.5">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
