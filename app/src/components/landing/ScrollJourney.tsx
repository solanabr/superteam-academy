"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/routing";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ScrollJourney() {
    const { ready, authenticated, login } = usePrivy();
    const router = useRouter();

    const orbRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<HTMLDivElement>(null);
    const blockchainRef = useRef<HTMLDivElement>(null);
    const mobileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!orbRef.current || !containerRef.current || !terminalRef.current || !blockchainRef.current || !mobileRef.current) return;

            const windowHeight = window.innerHeight;
            const observerY = windowHeight / 2; // The fixed vertical point where the orb is located

            const sections = [terminalRef.current, blockchainRef.current, mobileRef.current];
            let minDistanceToEdge = Infinity;
            let isInsideAnySection = false;

            sections.forEach((section) => {
                const rect = section.getBoundingClientRect();
                // Add a tiny buffer (5px) to ensure it's fully hidden before it even touches the element
                const top = rect.top + 5;
                const bottom = rect.bottom - 5;

                if (observerY >= top && observerY <= bottom) {
                    isInsideAnySection = true;
                } else {
                    const dist = Math.min(Math.abs(observerY - top), Math.abs(observerY - bottom));
                    if (dist < minDistanceToEdge) minDistanceToEdge = dist;
                }
            });

            // Calculate target opacity
            // Faster fade threshold (40px)
            const fadeThreshold = 40;
            let targetOpacity = isInsideAnySection ? 0 : Math.min(1, minDistanceToEdge / fadeThreshold);

            // Special rule: The orb should only be visible strictly between elements as per user's "wire" requirement
            // Hide if above the terminal
            const firstRect = terminalRef.current.getBoundingClientRect();
            if (observerY < firstRect.top) targetOpacity = 0;

            // Hide if below the mobile app (transitioning to CTA)
            const lastRect = mobileRef.current.getBoundingClientRect();
            if (observerY > lastRect.bottom) targetOpacity = 0;

            orbRef.current.style.opacity = targetOpacity.toString();

            // Pulse animation
            const scale = 1 + Math.sin(Date.now() / 300) * 0.08;
            orbRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
        };

        window.addEventListener("scroll", handleScroll);
        // Use requestAnimationFrame for smoother and more performant updates
        let rafId: number;
        const tick = () => {
            handleScroll();
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <div ref={containerRef} className="relative w-full max-w-7xl px-6 flex flex-col items-center mt-32">
            {/* Scroll Indicator Wire */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full vertical-wire opacity-30 z-0"></div>

            {/* Moving Glow Orb - with faster transition for better responsiveness */}
            <div
                ref={orbRef}
                className="fixed left-1/2 w-4 h-4 rounded-full glow-orb z-50 pointer-events-none"
                style={{
                    top: '50%',
                    opacity: 0,
                    transition: 'opacity 0.15s linear, transform 0.1s ease-out'
                }}
            ></div>

            {/* Element 1 - Terminal Window */}
            <div ref={terminalRef} className="relative z-10 max-w-[676px] w-full mb-64" data-purpose="terminal-component">
                <div className="ambient-glow -top-20 -left-20"></div>
                <div className="glass-morphism bg-[#0A0A0B]/90 rounded-lg overflow-hidden shadow-2xl">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                        <span className="text-xs font-code text-white/40 ml-4">Terminal — v1.0.4</span>
                    </div>
                    <div className="p-6 font-code text-sm md:text-base leading-relaxed text-gray-300">
                        <p className="mb-1"><span className="text-solana">$</span> anchor deploy</p>
                        <p className="text-solana/80">Compiling solana-twitter v0.1.0...</p>
                        <p className="text-solana mt-2">Finished release [optimized] target(s) in 2.45s</p>
                        <p className="mt-4">Deploying cluster: <span className="text-solana">https://api.mainnet-beta.solana.com</span></p>
                        <p className="mt-1">Program Id: <span className="text-solana/90">6X3y...Y9uP</span></p>
                        <p className="mt-4">Deployment successful. <span className="terminal-cursor"></span></p>
                    </div>
                </div>
                <div className="mt-8 text-right md:absolute md:-right-72 md:top-1/2 md:-translate-y-1/2 md:w-64">
                    <p className="text-white/40 font-code text-xs uppercase tracking-tighter mb-1">Phase 01</p>
                    <h3 className="text-2xl font-display font-bold text-white mb-2">Hands-on learning with in-built IDE</h3>
                </div>
            </div>

            {/* Element 2 - Blockchain Visualization (Solana Validator/Database) */}
            <div ref={blockchainRef} className="relative z-10 max-w-2xl mb-64 flex justify-center" data-purpose="blockchain-visualization">
                <div className="ambient-glow top-0"></div>
                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                    <svg className="w-full h-full opacity-90 eclipse-halo" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" fill="none" r="85" stroke="rgba(20, 241, 149, 0.1)" strokeWidth="1"></circle>
                        <circle cx="100" cy="100" fill="none" r="70" stroke="rgba(20, 241, 149, 0.2)" strokeDasharray="4 4" strokeWidth="1"></circle>
                        {/* Orbiting Nodes */}
                        <g transform="translate(100, 100)">
                            <circle className="orbit-node-item" cx="0" cy="0" fill="#14F195" r="4" style={{ filter: 'drop-shadow(0 0 5px #14F195)' }}></circle>
                            <circle className="orbit-node-item" cx="0" cy="0" fill="#14F195" r="3" style={{ animationDelay: '-4s', filter: 'drop-shadow(0 0 5px #14F195)' }}></circle>
                        </g>
                        <circle cx="100" cy="100" fill="#14F195" r="2"></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none eclipse-halo">
                        <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center animate-pulse">
                            <div className="absolute inset-0 glass-morphism rotate-45 border-solana/40 bg-solana/20 shadow-[0_0_40px_rgba(20,241,149,0.4),0_0_60px_rgba(240,101,41,0.2)] eclipse-halo flex"></div>
                            <div className="absolute w-2/3 h-2/3 glass-morphism rotate-[22.5deg] border-solana/30 bg-solana/10"></div>
                            <div className="w-2 h-2 rounded-full bg-solana shadow-[0_0_15px_#14F195]"></div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 text-left md:absolute md:-left-72 md:top-1/2 md:-translate-y-1/2 md:w-64">
                    <p className="text-white/40 font-code text-xs uppercase tracking-tighter mb-1">Phase 02</p>
                    <h3 className="text-2xl font-display font-bold text-white mb-2">Implement your learning on-chain</h3>
                </div>
            </div>

            {/* Element 3 - Mobile UI */}
            <div ref={mobileRef} className="relative z-10 max-w-2xl flex flex-col items-center" data-purpose="mobile-ui-component">
                <div className="ambient-glow -bottom-20 -right-20"></div>
                <div className="w-[280px] h-[560px] bg-[#0A0A0B] rounded-[3rem] border-[8px] border-neutral-800 shadow-2xl relative overflow-hidden flex flex-col items-center p-6">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-800 rounded-b-2xl"></div>
                    <div className="mt-16 w-full text-center">
                        <h4 className="text-white/60 text-sm font-display font-medium uppercase tracking-widest mb-10">Secure Transaction</h4>
                        {/* Biometric/Success Glow */}
                        <div className="relative flex items-center justify-center py-12">
                            <div className="absolute w-32 h-32 rounded-full border animate-ping border-solana/30"></div>
                            <div className="absolute w-24 h-24 rounded-full border border-solana/40"></div>
                            <div className="w-20 h-20 bg-solana rounded-full flex items-center justify-center animate-[heartbeat_2s_ease-in-out_infinite] shadow-[0_0_30px_#14F195] eclipse-halo relative z-10">
                                <div className="w-8 h-8 bg-white/40 rounded-full blur-sm"></div>
                            </div>
                        </div>
                        <div className="mt-12">
                            <p className="text-sm font-code text-solana mb-2">Confirming on Mainnet...</p>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-solana w-2/3 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="mt-20 p-4 rounded-lg bg-white/5 border border-white/10 text-left">
                            <p className="text-[10px] text-white/40 uppercase font-code">Recipient</p>
                            <p className="text-xs font-code truncate text-white">sol.superteam_academy.mainnet</p>
                        </div>
                    </div>
                </div>
                <div className="mt-8 text-right md:absolute md:-right-72 md:top-1/2 md:-translate-y-1/2 md:w-64">
                    <p className="text-white/40 font-code text-xs uppercase tracking-tighter mb-1">Phase 03</p>
                    <h3 className="text-2xl font-display font-bold text-white mb-2">See your learning in action</h3>
                </div>
            </div>

            {/* Final CTA below the mobile app */}
            <div className="mt-32 mb-20 z-10">
                <Button
                    onClick={() => {
                        if (!ready) return;
                        if (authenticated) {
                            router.push("/dashboard");
                        } else {
                            login();
                        }
                    }}
                    disabled={!ready}
                    variant="default"
                    size="lg"
                    className="h-14 px-10 bg-solana hover:bg-[#10d482] hover:scale-105 transition-all duration-300 text-black font-display font-bold text-lg rounded-sm flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(20,241,149,0.3)] disabled:opacity-50"
                >
                    <span>{authenticated ? "Dashboard" : "Start Compiling"}</span>
                    <span className="material-symbols-outlined notranslate text-xl">arrow_forward</span>
                </Button>
            </div>
        </div>
    );
}
