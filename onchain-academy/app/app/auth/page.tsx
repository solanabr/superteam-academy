"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    ChevronRight,
    Crown,
    Flame,
    Github,
    Link2,
    Lock,
    Mail,
    Shield,
    Sparkles,
    Trophy,
    Wallet,
    Zap,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";

/* ─── Types ─── */
type AuthMode = "login" | "signup";
type AuthMethod = "wallet" | "google" | "github";

/* ─── Google SVG Icon ─── */
function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

/* ─── Signup Bonuses ─── */
function SignupBonuses() {
    const bonuses = [
        { icon: "⚡", label: "500 XP Bonus", color: "text-neon-green" },
        { icon: "🏅", label: "Early Adopter Badge", color: "text-amber-400" },
        { icon: "❄️", label: "3x Streak Freezes", color: "text-neon-cyan" },
    ];

    return (
        <div className="space-y-2">
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                🎁 Signup Rewards
            </div>
            <div className="flex gap-2">
                {bonuses.map((b, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                    >
                        <span className="text-sm">{b.icon}</span>
                        <span className={`text-[10px] font-bold ${b.color}`}>{b.label}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* ─── Auth Method Button ─── */
function AuthButton({
    method,
    mode,
    onClick,
    isLoading,
}: {
    method: AuthMethod;
    mode: AuthMode;
    onClick: () => void;
    isLoading: boolean;
}) {
    const config = {
        wallet: {
            icon: <Wallet className="w-5 h-5" />,
            label: "Solana Wallet",
            desc: mode === "signup" ? "Connect to earn XP" : "Sign in with wallet",
            gradient: "from-neon-green to-emerald-400",
            glow: "rgba(0,255,163,0.15)",
            borderHover: "hover:border-neon-green/40",
            recommended: true,
        },
        google: {
            icon: <GoogleIcon className="w-5 h-5" />,
            label: "Google",
            desc: mode === "signup" ? "Quick start, link wallet later" : "Sign in with Google",
            gradient: "from-blue-500 to-blue-400",
            glow: "rgba(66,133,244,0.15)",
            borderHover: "hover:border-blue-400/40",
            recommended: false,
        },
        github: {
            icon: <Github className="w-5 h-5 text-white" />,
            label: "GitHub",
            desc: mode === "signup" ? "Sync your dev profile" : "Sign in with GitHub",
            gradient: "from-zinc-400 to-zinc-500",
            glow: "rgba(255,255,255,0.08)",
            borderHover: "hover:border-zinc-400/40",
            recommended: false,
        },
    };

    const c = config[method];

    return (
        <motion.button
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={onClick}
            disabled={isLoading}
            className={`w-full relative group flex items-center gap-4 p-4 rounded-xl border border-white/[0.08] ${c.borderHover} bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {/* Hover glow */}
            <div
                className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"
                style={{ background: `radial-gradient(ellipse, ${c.glow}, transparent 70%)` }}
            />

            {/* Icon */}
            <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${c.gradient} p-[1px] flex-shrink-0 relative z-10`}>
                <div className="w-full h-full rounded-lg bg-[#080c14] flex items-center justify-center">
                    {c.icon}
                </div>
            </div>

            {/* Label */}
            <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{c.label}</span>
                    {c.recommended && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20">
                            Recommended
                        </span>
                    )}
                </div>
                <span className="text-[11px] text-zinc-500">{c.desc}</span>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all relative z-10" />
        </motion.button>
    );
}

/* ─── Linked Account Row ─── */
function LinkedAccount({
    method,
    linked,
    detail,
    required,
    onLink,
}: {
    method: AuthMethod;
    linked: boolean;
    detail?: string;
    required?: boolean;
    onLink: () => void;
}) {
    const config = {
        wallet: { icon: <Wallet className="w-4 h-4" />, label: "Solana Wallet", gradient: "from-neon-green to-emerald-400" },
        google: { icon: <GoogleIcon className="w-4 h-4" />, label: "Google", gradient: "from-blue-500 to-blue-400" },
        github: { icon: <Github className="w-4 h-4 text-white" />, label: "GitHub", gradient: "from-zinc-400 to-zinc-500" },
    };

    const c = config[method];

    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${linked ? "border-neon-green/20 bg-neon-green/[0.03]" : "border-white/[0.06] bg-white/[0.01]"}`}>
            <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${c.gradient} p-[1px] flex-shrink-0`}>
                <div className="w-full h-full rounded-md bg-[#080c14] flex items-center justify-center">
                    {c.icon}
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{c.label}</span>
                    {required && !linked && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-400">Required</span>
                    )}
                </div>
                {linked && detail && (
                    <span className="text-[10px] text-zinc-500 truncate block">{detail}</span>
                )}
            </div>

            {linked ? (
                <div className="flex items-center gap-1 text-neon-green">
                    <Check className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Linked</span>
                </div>
            ) : (
                <button
                    onClick={onLink}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.08] text-[10px] font-bold text-white transition-all"
                >
                    <Link2 className="w-3 h-3" />
                    Link
                </button>
            )}
        </div>
    );
}

/* ─── Account Linking Panel ─── */
function AccountLinkingPanel() {
    const { connected } = useWallet();
    const { data: session } = useSession();

    const walletLinked = connected;
    const googleLinked = !!session;
    const [githubLinked, setGithubLinked] = useState(false);
    const { setVisible } = useWalletModal();

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-neon-cyan" />
                    Link Your Accounts
                </h3>
                <p className="text-sm text-zinc-500">
                    Connect multiple auth methods. Use any of them to sign in.
                </p>
            </div>

            <div className="space-y-2">
                <LinkedAccount method="wallet" linked={walletLinked} required onLink={() => setVisible(true)} />
                <LinkedAccount
                    method="google"
                    linked={googleLinked}
                    detail={session?.user?.email || undefined}
                    onLink={() => signIn("google")}
                />
                <LinkedAccount method="github" linked={githubLinked} onLink={() => setGithubLinked(true)} />
            </div>

            {/* Wallet required notice */}
            {!walletLinked && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-400/[0.05] border border-amber-400/20"
                >
                    <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <div className="text-[11px] font-bold text-amber-400">Wallet required for credentials</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                            Link a Solana wallet to finalize courses and receive soulbound NFT credentials on-chain.
                        </div>
                    </div>
                </motion.div>
            )}

            {/* All linked success */}
            {walletLinked && googleLinked && githubLinked && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-neon-green/[0.05] border border-neon-green/20"
                >
                    <Check className="w-4 h-4 text-neon-green" />
                    <span className="text-[11px] text-neon-green font-bold">All accounts linked! You can sign in with any method.</span>
                </motion.div>
            )}
        </div>
    );
}

/* ─── Stats Sidebar ─── */
function SidebarStats() {
    return (
        <div className="hidden lg:flex flex-col justify-center space-y-8 px-8 xl:px-12">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
            >
                <h2 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
                    Join{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-cyan">
                        12,400+
                    </span>{" "}
                    builders leveling up.
                </h2>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                    Complete quests, earn XP, unlock soulbound loot, and climb the leaderboard.
                </p>
            </motion.div>

            {/* Stats */}
            <div className="space-y-3">
                {[
                    { icon: Zap, label: "XP Distributed", value: "8.5M+", color: "text-neon-green" },
                    { icon: Trophy, label: "NFTs Earned", value: "32K+", color: "text-amber-400" },
                    { icon: Flame, label: "Active Streaks", value: "4.2K", color: "text-orange-400" },
                    { icon: Crown, label: "Avg. Level", value: "8.4", color: "text-neon-purple" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                    >
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        <div className="flex-1">
                            <div className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">{stat.label}</div>
                        </div>
                        <div className={`text-sm font-black ${stat.color}`}>{stat.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Player preview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3"
            >
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                    🎮 Your journey begins
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-purple/20 border border-white/10 flex items-center justify-center text-xl">
                        🧑‍💻
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">New Player</div>
                        <div className="text-[10px] text-zinc-500">Level 1 • 0 XP • No streak</div>
                    </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full w-0 rounded-full bg-gradient-to-r from-neon-green to-neon-cyan" />
                </div>
                <div className="text-[10px] text-zinc-600 text-center">Sign up to activate your player card</div>
            </motion.div>
        </div>
    );
}

/* ─── Main Auth Page ─── */
export default function AuthPage() {
    const [mode, setMode] = useState<AuthMode>("signup");
    const [step, setStep] = useState<"auth" | "linking">("auth");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<AuthMethod | null>(null);

    const { setVisible } = useWalletModal();
    const { connected, publicKey } = useWallet();
    const { data: session } = useSession();

    // Watch for wallet connection
    useEffect(() => {
        if (connected && selectedMethod === "wallet") {
            setIsLoading(false);
            if (mode === "signup") {
                setStep("linking");
            }
        }
    }, [connected, selectedMethod, mode]);

    // Watch for Google session
    useEffect(() => {
        if (session) {
            // @ts-expect-error - id_token is custom property
            const idToken = session.id_token;
            if (idToken) {
                console.log("Google ID Token:", idToken);
                // Here you would send the token to your backend
                // await fetch('/api/login', { method: 'POST', body: JSON.stringify({ token: idToken }) })

                setIsLoading(false);
                setSelectedMethod("google");
                if (mode === "signup") {
                    setStep("linking");
                }
            }
        }
    }, [session, mode]);

    const handleAuth = (method: AuthMethod) => {
        setSelectedMethod(method);

        if (method === "wallet") {
            if (!connected) {
                setVisible(true);
            } else {
                // Already connected
                if (mode === "signup") {
                    setStep("linking");
                }
            }
            return;
        }

        if (method === "google") {
            setIsLoading(true);
            signIn("google", { callbackUrl: "/dashboard" }); // Redirect to dashboard after login
            return;
        }

        setIsLoading(true);

        // Simulate auth flow
        setTimeout(() => {
            setIsLoading(false);
            if (mode === "signup") {
                setStep("linking");
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#020408] flex relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-neon-green/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-neon-purple/5 rounded-full blur-[120px]" />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(0,255,163,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,163,0.3) 1px, transparent 1px)`,
                        backgroundSize: "60px 60px",
                    }}
                />
            </div>

            {/* Left: Stats sidebar */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative z-10">
                <SidebarStats />
            </div>

            {/* Right: Auth form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-8 relative z-10">
                <div className="w-full max-w-md">
                    {/* Back to home */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-8"
                    >
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Back to Home
                        </Link>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {step === "auth" ? (
                            <motion.div
                                key="auth"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                {/* Header */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Sparkles className="w-6 h-6 text-neon-green" />
                                        </motion.div>
                                        <h1 className="text-2xl md:text-3xl font-black text-white">
                                            {mode === "signup" ? "Start Your Quest" : "Welcome Back"}
                                        </h1>
                                    </div>
                                    <p className="text-sm text-zinc-500">
                                        {mode === "signup"
                                            ? "Create your account to earn XP, unlock achievements, and build on Solana."
                                            : "Sign in with any linked auth method to continue your journey."}
                                    </p>
                                </div>

                                {/* Auth buttons */}
                                <div className="space-y-3">
                                    <AuthButton method="wallet" mode={mode} onClick={() => handleAuth("wallet")} isLoading={isLoading && selectedMethod === "wallet"} />

                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-px bg-white/[0.06]" />
                                        <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">or continue with</span>
                                        <div className="flex-1 h-px bg-white/[0.06]" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <AuthButton method="google" mode={mode} onClick={() => handleAuth("google")} isLoading={isLoading && selectedMethod === "google"} />
                                        <AuthButton method="github" mode={mode} onClick={() => handleAuth("github")} isLoading={isLoading && selectedMethod === "github"} />
                                    </div>
                                </div>

                                {/* Signup bonuses */}
                                {mode === "signup" && <SignupBonuses />}

                                {/* Toggle mode */}
                                <div className="text-center text-sm text-zinc-500">
                                    {mode === "signup" ? (
                                        <>
                                            Already have an account?{" "}
                                            <button
                                                onClick={() => setMode("login")}
                                                className="text-neon-green font-bold hover:text-neon-green/80 transition-colors"
                                            >
                                                Sign In
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            New to Superteam Academy?{" "}
                                            <button
                                                onClick={() => setMode("signup")}
                                                className="text-neon-green font-bold hover:text-neon-green/80 transition-colors"
                                            >
                                                Create Account
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Terms */}
                                <p className="text-[10px] text-zinc-700 text-center leading-relaxed">
                                    By continuing, you agree to our{" "}
                                    <a href="#" className="text-zinc-500 underline hover:text-white transition-colors">Terms of Service</a>
                                    {" "}and{" "}
                                    <a href="#" className="text-zinc-500 underline hover:text-white transition-colors">Privacy Policy</a>.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="linking"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                {/* Success header */}
                                <div className="space-y-3">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", bounce: 0.5 }}
                                        className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center"
                                    >
                                        <Check className="w-7 h-7 text-black" />
                                    </motion.div>
                                    <div>
                                        <h1 className="text-2xl font-black text-white">Account Created! 🎉</h1>
                                        <p className="text-sm text-zinc-500 mt-1">
                                            You signed up with{" "}
                                            <span className="text-white font-bold capitalize">{selectedMethod}</span>.
                                            Link more methods for flexible sign-in.
                                        </p>
                                    </div>
                                </div>

                                {/* XP reward */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-neon-green/[0.05] border border-neon-green/20"
                                >
                                    <Zap className="w-5 h-5 text-neon-green" />
                                    <div className="flex-1">
                                        <span className="text-sm font-bold text-neon-green">+500 XP Welcome Bonus</span>
                                        <span className="text-[10px] text-zinc-500 block">Your journey has begun!</span>
                                    </div>
                                    <span className="text-lg">⚡</span>
                                </motion.div>

                                {/* Account linking */}
                                <AccountLinkingPanel />

                                {/* Continue button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        // Navigate to dashboard
                                    }}
                                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-neon-green to-emerald-400 text-black font-black text-sm hover:shadow-[0_0_30px_rgba(0,255,163,0.3)] transition-all"
                                >
                                    Enter Academy
                                    <ArrowRight className="w-4 h-4" />
                                </motion.button>

                                <button
                                    onClick={() => {
                                        setStep("auth");
                                        setSelectedMethod(null);
                                    }}
                                    className="w-full text-center text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
                                >
                                    ← Back to sign in options
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
