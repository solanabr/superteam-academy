"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Award,
    CheckCircle2,
    Copy,
    Download,
    ExternalLink,
    Share2,
    Shield,
    Zap,
} from "lucide-react";

/* ── stub data ──────────────────────────────────────── */
const certificateData = {
    id: "cert-001",
    course: "Intro to Solana",
    recipient: "Alex Rivera",
    completedDate: "February 2, 2025",
    grade: "A+",
    xpEarned: 200,
    mintAddress: "SoLx7KpbR9qmNfT4wE3vYhJ8dZ2cA5gL6nK9pR3qMvW",
    metadataUri: "https://arweave.net/abc123...",
    ownerWallet: "8xK3mNpQ7rW5tY2vB4cF6jH9kL1nP3sR7uV0wX9yZa",
    collection: "Superteam Academy Credentials",
    standard: "Metaplex Core (Soulbound)",
    explorerUrl: "https://explorer.solana.com/address/SoLx7KpbR9qmNfT4wE3vYhJ8dZ2cA5gL6nK9pR3qMvW",
};

export default function CertificatePage() {
    const { id } = useParams<{ id: string }>();
    const cert = certificateData;

    return (
        <div className="min-h-screen bg-[#020408] relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-neon-green/[0.03] rounded-full blur-[200px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-purple/[0.03] rounded-full blur-[150px]" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-neon-cyan/[0.02] rounded-full blur-[180px]" />
            </div>

            {/* Top Bar */}
            <header className="relative z-10 border-b border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Dashboard
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-sm font-black text-white tracking-tight">SolLearn</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-4xl mx-auto px-6 py-10">
                {/* ── Visual Certificate Card ── */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 80, damping: 20 }}
                    className="relative max-w-2xl mx-auto mb-10"
                >
                    {/* Animated border glow */}
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple opacity-50 blur-sm" />
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple opacity-20" />

                    <div className="relative rounded-2xl bg-[#0a0f1a] border border-white/[0.08] overflow-hidden">
                        {/* Certificate header pattern */}
                        <div className="relative h-32 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-neon-green/20 via-neon-cyan/10 to-neon-purple/20" />
                            <div className="absolute inset-0" style={{
                                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(0,255,163,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(153,69,255,0.1) 0%, transparent 50%)`,
                            }} />
                            {/* Floating orbs */}
                            <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-4 right-8 w-16 h-16 rounded-full bg-neon-green/10 blur-lg" />
                            <motion.div animate={{ y: [5, -5, 5] }} transition={{ duration: 5, repeat: Infinity }} className="absolute bottom-4 left-12 w-12 h-12 rounded-full bg-neon-purple/10 blur-lg" />

                            {/* Logo */}
                            <div className="absolute top-6 left-6 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-black" />
                                </div>
                                <span className="text-sm font-black text-white tracking-tight">Superteam Academy</span>
                            </div>

                            {/* Badge */}
                            <div className="absolute top-6 right-6">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-400/5 border border-amber-400/30 flex items-center justify-center">
                                    <Award className="w-7 h-7 text-amber-400" />
                                </div>
                            </div>
                        </div>

                        {/* Certificate body */}
                        <div className="p-8 text-center space-y-5">
                            <div>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold mb-2"
                                >
                                    Certificate of Completion
                                </motion.div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple"
                                >
                                    {cert.course}
                                </motion.h1>
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="space-y-1"
                            >
                                <div className="text-[10px] text-zinc-600 uppercase tracking-wider">Awarded to</div>
                                <div className="text-xl font-black text-white">{cert.recipient}</div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="flex items-center justify-center gap-6 text-[10px] text-zinc-500 font-bold"
                            >
                                <span>{cert.completedDate}</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                <span className="flex items-center gap-1 text-neon-green"><Zap className="w-3 h-3" /> +{cert.xpEarned} XP</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-400">Grade: {cert.grade}</span>
                            </motion.div>

                            {/* Verified badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.7, type: "spring" }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-green/10 border border-neon-green/20"
                            >
                                <CheckCircle2 className="w-4 h-4 text-neon-green" />
                                <span className="text-xs font-bold text-neon-green">Verified On-Chain</span>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Action Buttons ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap items-center justify-center gap-3 mb-10"
                >
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-green to-emerald-400 text-black text-xs font-black"
                    >
                        <Download className="w-3.5 h-3.5" /> Download Image
                    </motion.button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs text-zinc-400 hover:text-white hover:border-white/[0.15] transition-all font-bold">
                        <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                    <a
                        href={cert.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs text-zinc-400 hover:text-white hover:border-white/[0.15] transition-all font-bold"
                    >
                        <ExternalLink className="w-3.5 h-3.5" /> View on Explorer
                    </a>
                </motion.div>

                {/* ── Social Share ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="max-w-2xl mx-auto mb-10 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                >
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-neon-cyan" /> Share Your Achievement
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { name: "Twitter / X", color: "hover:border-sky-400/30 hover:text-sky-400" },
                            { name: "LinkedIn", color: "hover:border-blue-500/30 hover:text-blue-500" },
                            { name: "Farcaster", color: "hover:border-purple-400/30 hover:text-purple-400" },
                            { name: "Copy Link", color: "hover:border-neon-green/30 hover:text-neon-green" },
                        ].map((platform) => (
                            <button
                                key={platform.name}
                                className={`px-4 py-2 rounded-xl border border-white/[0.08] text-xs text-zinc-500 font-bold transition-all ${platform.color}`}
                            >
                                {platform.name}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* ── NFT Details ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="max-w-2xl mx-auto"
                >
                    <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-neon-green" /> On-Chain Details
                    </h3>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
                        {[
                            { label: "Mint Address", value: cert.mintAddress, mono: true, copyable: true },
                            { label: "Owner Wallet", value: cert.ownerWallet, mono: true, copyable: true },
                            { label: "Metadata URI", value: cert.metadataUri, mono: true, copyable: true },
                            { label: "Collection", value: cert.collection, mono: false, copyable: false },
                            { label: "Standard", value: cert.standard, mono: false, copyable: false },
                        ].map((field) => (
                            <div key={field.label} className="flex items-center justify-between px-5 py-4 group">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider shrink-0 w-28">{field.label}</span>
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={`text-xs truncate ${field.mono ? "font-mono text-zinc-400" : "text-zinc-300"}`}>
                                        {field.value}
                                    </span>
                                    {field.copyable && (
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-white shrink-0">
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Verification status */}
                    <div className="mt-4 p-4 rounded-xl bg-neon-green/5 border border-neon-green/10 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-neon-green shrink-0" />
                        <div>
                            <div className="text-xs font-bold text-neon-green">Ownership Verified</div>
                            <div className="text-[10px] text-zinc-500">This soulbound NFT is non-transferable and permanently bound to the recipient&apos;s wallet.</div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
