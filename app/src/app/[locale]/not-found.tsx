"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Terminal, Home, ChevronRight, Hash, Database, Cpu } from "lucide-react";

export default function NotFound() {
    const t = useTranslations("not_found");

    return (
        <div className="min-h-screen bg-void flex flex-col items-center justify-center p-6 text-center overflow-hidden font-mono">
            {/* Background Matrix/Grid Effect */}
            <div className="fixed inset-0 pointer-events-none opacity-5">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            </div>

            <div className="relative w-full max-w-2xl z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">

                {/* Terminal Window */}
                <div className="glass-panel-flat border border-solana/20 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(20,241,149,0.1)]">
                    {/* Terminal Header */}
                    <div className="bg-white/5 border-b border-white/10 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="size-2.5 rounded-full bg-rust/50"></div>
                            <div className="size-2.5 rounded-full bg-amber-500/50"></div>
                            <div className="size-2.5 rounded-full bg-solana/50"></div>
                        </div>
                        <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                            <Terminal size={12} />
                            mempool-explorer --v1.4.0
                        </div>
                        <div className="w-12"></div>
                    </div>

                    {/* Terminal Content */}
                    <div className="p-8 text-left space-y-6">
                        <div className="flex items-start gap-4">
                            <span className="text-solana shrink-0 animate-pulse">SYSTEM:</span>
                            <div className="space-y-1">
                                <p className="text-white font-bold tracking-tight">FATAL_ERROR: BLOCK_NOT_FOUND</p>
                                <p className="text-text-muted text-xs">Slot execution failed at index 0x1A4...FD2</p>
                            </div>
                        </div>

                        {/* ASCII 404 ART */}
                        <div className="py-4 flex flex-col items-center justify-center text-solana opacity-80 select-none">
                            <pre className="text-[10px] sm:text-xs leading-none font-bold mb-4">
                                {`
  ██╗  ██╗  ██████╗  ██╗  ██╗
  ██║  ██║ ██╔═══██╗ ██║  ██║
  ███████║ ██║   ██║ ███████║
  ╚════██║ ██║   ██║ ╚════██║
       ██║ ╚██████╔╝      ██║
       ╚═╝  ╚═════╝       ╚═╝
                                `}
                            </pre>
                            <div className="text-[10px] uppercase tracking-[0.3em] text-solana/60 font-bold">
                                page not found
                            </div>
                        </div>

                        <div className="space-y-2 border-l-2 border-solana/20 pl-4 py-1">
                            <div className="flex items-center gap-3 text-xs">
                                <Hash size={14} className="text-solana" />
                                <span className="text-text-muted">Transaction ID:</span>
                                <span className="text-white truncate">5Hw8...3p9v_dropped_mempool</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <Database size={14} className="text-solana" />
                                <span className="text-text-muted">Cluster:</span>
                                <span className="text-white">Devnet (via Superteam Academy)</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <Cpu size={14} className="text-solana" />
                                <span className="text-text-muted">Validator Status:</span>
                                <span className="text-solana animate-pulse">Running Glitch Protocol</span>
                            </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                            <p className="text-text-secondary text-sm leading-relaxed italic">
                                "{t("subtitle")}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Button asChild className="bg-solana hover:bg-solana-dark text-void font-bold px-10 py-6 rounded-full flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(20,241,149,0.3)]">
                        <Link href="/dashboard">
                            <Home size={20} />
                            {t("back_home")}
                        </Link>
                    </Button>

                    <Link href="/courses" className="text-text-muted hover:text-white transition-colors flex items-center gap-2 group text-sm font-bold uppercase tracking-widest">
                        Reconnect to Devnet
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Dynamic SVG Shapes */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden sm:block hidden">
                {/* Animated geometric packets */}
                <svg width="100%" height="100%" className="opacity-20">
                    <rect width="6" height="6" fill="#14F195" className="animate-ping" x="20%" y="30%" />
                    <rect width="4" height="4" fill="#14F195" x="80%" y="20%" opacity="0.5" />
                    <rect width="8" height="8" fill="#14F195" x="15%" y="85%" opacity="0.3" />
                    <rect width="5" height="5" fill="#14F195" x="75%" y="75%" opacity="0.6" />

                    {/* Glitch lines */}
                    <line x1="0" y1="15%" x2="100%" y2="15%" stroke="#14F195" strokeWidth="0.5" strokeDasharray="5,10" className="animate-pulse" />
                    <line x1="0" y1="85%" x2="100%" y2="85%" stroke="#14F195" strokeWidth="0.5" strokeDasharray="5,10" className="animate-pulse" />
                </svg>
            </div>
        </div>
    );
}
