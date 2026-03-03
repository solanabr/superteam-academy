"use client";

import { useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "@/i18n/routing";
import { ShieldCheck } from "lucide-react";

/**
 * Dedicated login page that triggers the Privy modal on mount.
 * This page contains the heavy authentication dependencies, isolating them 
 * from the main landing page for better performance.
 */
export default function LoginPage() {
    const { login, authenticated, ready } = usePrivy();
    const router = useRouter();
    const loginTriggered = useRef(false);

    useEffect(() => {
        if (ready) {
            if (authenticated) {
                // Redirect to dashboard if already logged in
                router.replace("/dashboard");
            } else if (!loginTriggered.current) {
                // Auto-trigger login modal exactly once
                loginTriggered.current = true;
                login();
            }
        }
    }, [ready, authenticated, login, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0B] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-solana/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl relative z-10 flex flex-col items-center gap-6 max-w-sm text-center">
                <div className="h-16 w-16 rounded-full bg-solana/20 flex items-center justify-center border border-solana/30 shadow-[0_0_20px_rgba(20,241,149,0.2)]">
                    <ShieldCheck className="h-8 w-8 text-solana" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-xl font-display font-bold text-white tracking-wide">
                        Authenticating
                    </h1>
                </div>

                {/* Simplified button - only visible if Privy is ready and not authenticated */}
                {ready && !authenticated && (
                    <button
                        onClick={() => login()}
                        className="w-full py-3 px-6 bg-solana text-[#0A0A0B] font-bold rounded-lg hover:bg-solana-accent transition-all duration-300 shadow-[0_4px_14px_rgba(20,241,149,0.4)]"
                    >
                        Login or Signup
                    </button>
                )}

                <button
                    onClick={() => router.push("/")}
                    className="text-xs text-text-muted hover:text-white transition-colors underline underline-offset-4"
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
}
