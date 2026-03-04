"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    Loader2,
    Lock,
} from "lucide-react";
import { coursesApi, Certificate } from "@/lib/courses";
import { useAuth } from "@/components/providers/auth-context";

export default function CertificatePage() {
    const { id: slug } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    const [cert, setCert] = useState<Certificate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/auth");
            return;
        }

        if (isAuthenticated && slug) {
            setLoading(true);
            coursesApi.getCertificateDetails(slug)
                .then(res => {
                    setCert(res.data);
                })
                .catch(err => {
                    console.error("Failed to fetch certificate:", err);
                    setError(err.message || "Failed to load certificate. Make sure you have completed the course.");
                })
                .finally(() => setLoading(false));
        }
    }, [slug, isAuthenticated, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#020408] flex items-center justify-center font-mono">
                <div className="space-y-4 text-center">
                    <Loader2 className="w-12 h-12 text-neon-green animate-spin mx-auto" />
                    <p className="text-zinc-500 text-xs animate-pulse tracking-[0.3em] uppercase">Retrieving Credentials...</p>
                </div>
            </div>
        );
    }

    if (error || !cert) {
        return (
            <div className="min-h-screen bg-[#020408] flex items-center justify-center font-mono px-6">
                <div className="max-w-md w-full p-8 border border-red-500/20 bg-red-500/5 text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20">
                        <Lock className="w-8 h-8 text-red-500 opacity-50" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-white font-black uppercase tracking-wider text-lg">Access Restrained</h2>
                        <p className="text-zinc-500 text-xs leading-relaxed">{error || "Course completion required to unlock this certificate."}</p>
                    </div>
                    <Link href="/dashboard" className="block w-full py-3 border border-white/10 text-[10px] text-white hover:bg-white/5 transition-all font-black uppercase tracking-widest">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const formattedDate = new Date(cert.completedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    const userIdentifier = user?.name || user?.username || "SOL.ANONYMOUS.USER";

    return (
        <div className="min-h-screen bg-[#020408] relative overflow-hidden font-sans">
            {/* Background Layer: Deep Atmosphere */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-neon-green/[0.03] blur-[250px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-neon-purple/[0.04] blur-[200px]" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-cyan/[0.02] blur-[180px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* Top Bar Navigation */}
            <header className="relative z-20 border-b border-white/[0.05] bg-black/40 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-all group font-mono font-bold uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Arena
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,163,0.3)] border border-white/10">
                            <Zap className="w-5 h-5 text-black" />
                        </div>
                        <span className="text-lg font-black text-white tracking-tighter uppercase font-mono">Osmos</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-24">

                {/* ── Visual Certificate Masterpiece ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                    className="relative max-w-3xl mx-auto mb-16 perspective-1000"
                >
                    {/* Multi-layered glow effects */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple opacity-40 blur-xl animate-slow-glow" />
                    <div className="absolute -inset-px bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple opacity-20" />

                    <div className="relative bg-black/90 border border-white/10 overflow-hidden backdrop-blur-3xl shadow-2xl">

                        {/* Elaborate Header Region */}
                        <div className="relative h-48 md:h-64 overflow-hidden border-b border-white/[0.05]">
                            {/* Dynamic background patterns */}
                            <div className="absolute inset-0 bg-gradient-to-br from-neon-green/10 via-neon-cyan/5 to-neon-purple/10" />
                            <div className="absolute inset-0 opacity-20" style={{
                                backgroundImage: `radial-gradient(circle at 20% 30%, rgba(0,255,163,0.15) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(153,69,255,0.15) 0%, transparent 40%)`,
                            }} />

                            {/* Floating Geometric Assets */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-10 -right-10 w-40 h-40 border border-neon-green/10"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                className="absolute -bottom-10 -left-10 w-32 h-32 border border-neon-purple/10"
                            />

                            {/* Badge Of Excellence */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.5, type: "spring", damping: 12 }}
                                    className="relative"
                                >
                                    <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-20 animate-pulse" />
                                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 p-1 shadow-2xl">
                                        <div className="w-full h-full bg-black flex items-center justify-center border border-white/10">
                                            <Award className="w-12 h-12 md:w-16 md:h-16 text-amber-400" />
                                        </div>
                                    </div>
                                    {/* Victory Wreath Overlay Styled Element */}
                                    <div className="absolute -inset-4 border-b-2 border-amber-400/20" />
                                </motion.div>
                            </div>
                        </div>

                        {/* High-Concept Typography Section */}
                        <div className="p-10 md:p-16 text-center space-y-8">
                            <div className="space-y-4 font-mono">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    className="text-[10px] md:text-xs text-neon-cyan font-black uppercase tracking-[0.5em] mb-4"
                                >
                                    Proof of Protocol Mastery
                                </motion.div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-white uppercase tracking-tighter"
                                >
                                    {cert.title}
                                </motion.h1>
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                                className="w-20 h-px bg-white/10 mx-auto"
                            />

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.0 }}
                                className="space-y-2 font-mono"
                            >
                                <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Successfully Bound To</div>
                                <div className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">{userIdentifier}</div>
                                <div className="text-[10px] text-neon-green/60 uppercase">Verification ID: {slug.toUpperCase()}-VERIFIED</div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.1 }}
                                className="flex items-center justify-center gap-8 py-6 border-y border-white/[0.05] font-mono"
                            >
                                <div className="text-left">
                                    <div className="text-[9px] text-zinc-600 uppercase font-black mb-1">Status</div>
                                    <div className="text-xs text-neon-green font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-white/5" />
                                <div className="text-left">
                                    <div className="text-[9px] text-zinc-600 uppercase font-black mb-1">Maturity Date</div>
                                    <div className="text-xs text-white font-bold tracking-wider uppercase">{formattedDate}</div>
                                </div>
                            </motion.div>

                            {/* Seal Ornament */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.2 }}
                                className="pt-4"
                            >
                                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/[0.03] border border-white/[0.08] group hover:bg-white/[0.05] transition-colors cursor-default font-mono">
                                    <Shield className="w-5 h-5 text-neon-cyan animate-pulse" />
                                    <div className="text-left">
                                        <div className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Osmos Verified</div>
                                        <div className="text-[8px] text-zinc-500 uppercase">On-Chain Certification Standard v1.0</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Footer Aesthetic Pattern */}
                        <div className="h-2 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple opacity-50" />
                    </div>
                </motion.div>

                {/* ── Social Hub & Meta Actions ── */}
                <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 font-mono">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.3 }}
                        className="p-8 bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-6"
                    >
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-neon-cyan" /> Secure Sharing
                        </h3>
                        <p className="text-[10px] text-zinc-500 leading-relaxed font-medium uppercase tracking-wider">Broadcast your achievement across the decentralized frontier. Let the world know your on-chain expertise.</p>

                        <div className="grid grid-cols-2 gap-3">
                            <button className="py-3 bg-white/[0.05] border border-white/[0.08] text-[10px] text-zinc-300 font-black uppercase tracking-wider hover:bg-white/[0.1] hover:text-white hover:border-white/20 transition-all">
                                Twitter / X
                            </button>
                            <button className="py-3 bg-white/[0.05] border border-white/[0.08] text-[10px] text-zinc-300 font-black uppercase tracking-wider hover:bg-white/[0.1] hover:text-white hover:border-white/20 transition-all">
                                LinkedIn
                            </button>
                            <button className="py-3 bg-white/[0.05] border border-white/[0.08] text-[10px] text-zinc-300 font-black uppercase tracking-wider hover:bg-white/[0.1] hover:text-white hover:border-white/20 transition-all">
                                Farcaster
                            </button>
                            <button className="py-3 bg-white/[0.05] border border-white/[0.08] text-[10px] text-neon-green font-black uppercase tracking-wider hover:bg-neon-green/10 hover:border-neon-green/20 transition-all flex items-center justify-center gap-2">
                                <Copy className="w-3.5 h-3.5" /> Copy Link
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.4 }}
                        className="p-8 bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-6 flex flex-col justify-between"
                    >
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                <Download className="w-4 h-4 text-neon-green" /> Digital Assets
                            </h3>
                            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium uppercase tracking-wider">Download a high-resolution render of your certificate for offline verification and portfolio showcase.</p>
                        </div>

                        <div className="space-y-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-4 bg-gradient-to-r from-neon-green to-emerald-400 text-black text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,163,0.15)] border border-white/10"
                            >
                                Download Image (.PNG)
                            </motion.button>
                            <a
                                href="#"
                                className="w-full py-3 border border-white/[0.08] bg-white/[0.02] text-[10px] text-zinc-400 hover:text-white hover:border-white/20 transition-all font-black uppercase tracking-widest text-center flex items-center justify-center gap-2"
                            >
                                <ExternalLink className="w-3.5 h-3.5" /> View On-Chain Receipt
                            </a>
                        </div>
                    </motion.div>
                </div>
            </main>

            <style jsx global>{`
                @keyframes slow-glow {
                    0%, 100% { opacity: 0.4; filter: blur(20px); }
                    50% { opacity: 0.6; filter: blur(25px); }
                }
                .animate-slow-glow {
                    animation: slow-glow 8s ease-in-out infinite;
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
            `}</style>
        </div>
    );
}
