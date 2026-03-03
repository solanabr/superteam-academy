import { LandingHeaderActions } from "@/components/landing/LandingHeaderActions";
import { getTranslations } from "next-intl/server";
import { Terminal } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";

const ScrollJourney = dynamic(() => import("@/components/landing/ScrollJourney").then(mod => mod.ScrollJourney));
const SocialProof = dynamic(() => import("@/components/landing/SocialProof").then(mod => mod.SocialProof));
const Footer = dynamic(() => import("@/components/layout/Footer").then(mod => mod.Footer));

export const revalidate = 300; // ISR cache for 5 minutes

export default async function LandingPage() {
    const t = await getTranslations("landing");
    return (
        <div className="relative min-h-screen flex flex-col bg-void text-text-primary overflow-x-hidden">
            {/* Noise Texture Overlay — z-30 keeps it below navbar (z-40) and modals (z-50+) */}
            <div className="fixed inset-0 z-30 pointer-events-none opacity-100 bg-noise mix-blend-overlay"></div>

            {/* Background Gradient Mesh */}
            <div className="fixed inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
                <div className="w-[120vw] h-[120vw] rounded-full bg-gradient-mesh blur-[120px] opacity-30 animate-spin-slow"></div>
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 h-20 z-40 glass-panel border-b border-white/10 px-8 flex items-center justify-between transition-all duration-300">
                <div className="flex items-center gap-3">
                    <div className="relative h-8 w-48 hidden sm:block">
                        <Image
                            src="/logo/st-brazil-horizontal.svg"
                            alt="Superteam Brazil"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div role="img" aria-label="Terminal Logo" className="size-9 bg-solana/10 border border-solana/20 rounded flex items-center justify-center sm:hidden">
                        <Terminal className="text-solana h-5 w-5" />
                    </div>
                </div>

                <LandingHeaderActions />
            </nav>

            {/* Main Content */}
            <main className="relative z-10 flex-grow flex flex-col items-center justify-center pt-32 px-4 md:px-8">
                {/* Hero Text Section */}
                <div className="max-w-4xl w-full text-center flex flex-col items-center gap-6 mb-16 relative">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-2 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-solana animate-pulse"></span>
                        <span className="font-code text-xs text-text-muted uppercase tracking-widest">{t("system_status")}</span>
                    </div>

                    <h1 className="font-display font-bold text-6xl md:text-8xl lg:text-[6.5rem] leading-[0.95] tracking-tighter text-white mb-4">
                        {t("tagline_start")} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-solana via-white to-[#FFD23F]">{t("tagline_end")}</span>
                    </h1>

                    <p className="font-body text-lg md:text-xl text-text-muted max-w-2xl leading-relaxed">
                        The definitive learning environment for the Solana ecosystem. Transform Rust smart contract development into an immersive experience.
                    </p>
                </div>

                {/* 3D Artifact Section */}
                <div className="w-full max-w-5xl perspective-container h-[500px] md:h-[600px] flex items-center justify-center pointer-events-none select-none">
                    {/* Floating Code Window */}
                    <div className="w-full max-w-3xl glass-panel rounded-lg border border-white/10 shadow-2xl code-window animate-float relative overflow-hidden group border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
                        {/* Glow Effect behind window */}
                        <div className="absolute -inset-1 bg-gradient-to-br from-solana/20 to-[#FFD23F]/20 blur-xl opacity-20 -z-10 group-hover:opacity-30 transition-opacity duration-700"></div>

                        {/* Window Title Bar */}
                        <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-white/5">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            </div>
                            <div className="flex-1 text-center font-code text-xs text-text-muted opacity-60">lib.rs — Superteam Editor</div>
                        </div>

                        {/* Code Editor Content */}
                        <div className="p-6 md:p-8 font-code text-sm md:text-base leading-relaxed overflow-hidden bg-[#0A0A0B]/80 backdrop-blur-xl h-full min-h-[400px]">
                            <div className="flex gap-4">
                                {/* Line Numbers */}
                                <div className="flex flex-col text-right text-white/20 select-none">
                                    {[...Array(15)].map((_, i) => <div key={i}>{i + 1}</div>)}
                                </div>

                                {/* Code */}
                                <div className="flex flex-col">
                                    <div><span className="text-rust">use</span> anchor_lang::prelude::*;</div>
                                    <div>&nbsp;</div>
                                    <div><span className="text-[#e5c07b]">declare_id!</span>(<span className="text-[#98c379]">"Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"</span>);</div>
                                    <div>&nbsp;</div>
                                    <div><span className="text-[#e5c07b]">#[program]</span></div>
                                    <div><span className="text-rust">pub mod</span> <span className="text-solana">solana_mastery</span> {"{"}</div>
                                    <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rust">use super</span>::*;</div>
                                    <div>&nbsp;</div>
                                    <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rust">pub fn</span> <span className="text-solana">initialize</span>(ctx: <span className="text-[#d19a66]">Context</span>&lt;<span className="text-[#d19a66]">Initialize</span>&gt;) -&gt; <span className="text-[#d19a66]">Result</span>&lt;()&gt; {"{"}</div>
                                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rust">let</span> account = &amp;<span className="text-rust">mut</span> ctx.accounts.base_account;</div>
                                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;account.total_xp = <span className="text-[#d19a66]">0</span>;</div>
                                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#5c6370]">// Transform your skills into assets</span></div>
                                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#e5c07b]">msg!</span>(<span className="text-[#98c379]">"Welcome to the metal level."</span>);</div>
                                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#d19a66]">Ok</span>(())</div>
                                    <div>&nbsp;&nbsp;&nbsp;&nbsp;{"}"}</div>
                                    <div>{"}"}</div>
                                    <div>&nbsp;</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#e5c07b]">#[derive(Accounts)]</span>
                                        <span className="w-2 h-4 bg-solana animate-pulse inline-block align-middle ml-1"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <ScrollJourney />

                <SocialProof />
            </main>
            <Footer />

            {/* Background Elements for Atmosphere */}
            <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0A0A0B] to-transparent z-20 pointer-events-none"></div>
        </div>
    );
}
