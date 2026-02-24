"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
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
import { useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-context";
import { googleAuth, walletGetNonce, walletVerify } from "@/lib/api";

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
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold font-mono">
                <span className="text-neon-green/40">// </span>signup_rewards
            </div>
            <div className="flex gap-2">
                {bonuses.map((b, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06] font-mono"
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
            color: "text-neon-green",
            borderColor: "border-neon-green/20",
            borderHover: "hover:border-neon-green/40",
            glow: "rgba(0,255,163,0.08)",
            recommended: true,
        },
        google: {
            icon: <GoogleIcon className="w-5 h-5" />,
            label: "Google",
            desc: mode === "signup" ? "Quick start, link wallet later" : "Sign in with Google",
            color: "text-blue-400",
            borderColor: "border-white/[0.06]",
            borderHover: "hover:border-blue-400/40",
            glow: "rgba(66,133,244,0.08)",
            recommended: false,
        },
        github: {
            icon: <Github className="w-5 h-5 text-white" />,
            label: "GitHub",
            desc: mode === "signup" ? "Sync your dev profile" : "Sign in with GitHub",
            color: "text-zinc-300",
            borderColor: "border-white/[0.06]",
            borderHover: "hover:border-zinc-400/40",
            glow: "rgba(255,255,255,0.05)",
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
            className={`w-full relative group flex items-center gap-4 p-4 border ${c.borderColor} ${c.borderHover} bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed font-mono`}
        >
            {/* Corner brackets on hover */}
            <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-neon-green/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-neon-green/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
            <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-neon-green/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-neon-green/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

            {/* Icon */}
            <div className={`w-11 h-11 border ${c.borderColor} bg-[#080c14] flex items-center justify-center flex-shrink-0 relative z-10`}>
                {c.icon}
            </div>

            {/* Label */}
            <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{c.label}</span>
                    {c.recommended && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-neon-green/10 text-neon-green border border-neon-green/20">
                            Recommended
                        </span>
                    )}
                </div>
                <span className="text-[11px] text-zinc-500">{c.desc}</span>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-neon-green group-hover:translate-x-0.5 transition-all relative z-10" />
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
        wallet: { icon: <Wallet className="w-4 h-4" />, label: "Solana Wallet", color: "text-neon-green" },
        google: { icon: <GoogleIcon className="w-4 h-4" />, label: "Google", color: "text-blue-400" },
        github: { icon: <Github className="w-4 h-4 text-white" />, label: "GitHub", color: "text-zinc-300" },
    };

    const c = config[method];

    return (
        <div className={`flex items-center gap-3 p-3 border transition-all font-mono ${linked ? "border-neon-green/20 bg-neon-green/[0.03]" : "border-white/[0.06] bg-white/[0.01]"}`}>
            <div className={`w-8 h-8 border border-white/10 bg-[#080c14] flex items-center justify-center flex-shrink-0`}>
                {c.icon}
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
                    className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/[0.08] hover:border-neon-green/30 text-[10px] font-bold text-white transition-all font-mono"
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
    const { setVisible } = useWalletModal();
    const { user, isAuthenticated } = useAuth();

    const walletLinked = connected;
    const googleLinked = !!session;
    const githubLinked = isAuthenticated && !session;

    const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const GITHUB_REDIRECT_URI = typeof window !== "undefined"
        ? `${window.location.origin}/auth/github/callback`
        : "";

    return (
        <div className="space-y-4 font-mono">
            <div className="space-y-1">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-neon-cyan" />
                    Link Your Accounts
                </h3>
                <p className="text-sm text-zinc-500">
                    <span className="text-neon-green/40">// </span>
                    Connect multiple auth methods. Use any of them to sign in.
                </p>
            </div>

            <div className="space-y-2">
                <LinkedAccount method="wallet" linked={walletLinked} required onLink={() => setVisible(true)} />
                <LinkedAccount
                    method="google"
                    linked={googleLinked}
                    detail={googleLinked ? session?.user?.email || undefined : undefined}
                    onLink={() => signIn("google", { callbackUrl: "/auth" })}
                />
                <LinkedAccount
                    method="github"
                    linked={githubLinked}
                    detail={githubLinked ? user?.username || undefined : undefined}
                    onLink={() => {
                        if (GITHUB_CLIENT_ID) {
                            window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=read:user,user:email`;
                        }
                    }}
                />
            </div>

            {/* Wallet required notice */}
            {!walletLinked && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 p-3 bg-amber-400/[0.05] border border-amber-400/20"
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
                    className="flex items-center gap-2.5 p-3 bg-neon-green/[0.05] border border-neon-green/20"
                >
                    <Check className="w-4 h-4 text-neon-green" />
                    <span className="text-[11px] text-neon-green font-bold">All accounts linked! You can sign in with any method.</span>
                </motion.div>
            )}

            {/* Continue to Dashboard */}
            {isAuthenticated && (
                <motion.a
                    href="/dashboard"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-neon-green text-black text-sm font-black font-mono uppercase tracking-wider hover:bg-neon-green/90 hover:shadow-[0_0_30px_rgba(0,255,163,0.2)] transition-all"
                >
                    Continue to Dashboard
                    <ArrowRight className="w-4 h-4" />
                </motion.a>
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
                {/* Terminal heading */}
                <div className="flex items-center gap-3">
                    <span className="text-neon-green font-mono text-sm">{">"}</span>
                    <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                        system_status
                    </span>
                    <div className="w-2 h-2 bg-neon-green animate-pulse" />
                </div>

                <h2 className="text-3xl xl:text-4xl font-black font-mono text-white tracking-tight leading-tight">
                    Join{" "}
                    <span className="text-neon-green">12,400+</span>{" "}
                    builders leveling up.
                </h2>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-sm font-mono">
                    <span className="text-neon-green/40">// </span>
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
                        className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.04] font-mono group relative"
                    >
                        {/* Corner brackets on hover */}
                        <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-green/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-green/30 opacity-0 group-hover:opacity-100 transition-opacity" />

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
                className="p-4 bg-white/[0.02] border border-white/[0.06] space-y-3 relative"
            >
                {/* Corner brackets */}
                <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-neon-green/20" />
                <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-neon-green/20" />
                <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-neon-green/20" />
                <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-neon-green/20" />

                <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold font-mono">
                    <span className="text-neon-green/40">$ </span>player --new
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 border border-white/10 bg-white/[0.02] flex items-center justify-center text-xl">
                        🧑‍💻
                    </div>
                    <div className="font-mono">
                        <div className="text-sm font-bold text-white">New Player</div>
                        <div className="text-[10px] text-zinc-500">Level 1 • 0 XP • No streak</div>
                    </div>
                </div>
                <div className="h-1.5 bg-white/5 overflow-hidden">
                    <div className="h-full w-0 bg-neon-green" />
                </div>
                <div className="text-[10px] text-zinc-600 text-center font-mono">Sign up to activate your player card</div>
            </motion.div>
        </div>
    );
}

/* ─── Main Auth Page ─── */
function AuthPageContent() {
    const [mode, setMode] = useState<AuthMode>("signup");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<AuthMethod | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const googleAuthSent = useRef(false);

    const { setVisible } = useWalletModal();
    const { connected, publicKey, signMessage } = useWallet();
    const { data: session } = useSession();
    const { login, isAuthenticated } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const GITHUB_REDIRECT_URI = typeof window !== "undefined"
        ? `${window.location.origin}/auth/github/callback`
        : "";

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (isAuthenticated) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, router]);

    // Watch for wallet connection → start nonce+sign+verify flow
    useEffect(() => {
        if (connected && publicKey && selectedMethod === "wallet" && signMessage) {
            (async () => {
                try {
                    setIsLoading(true);
                    setAuthError(null);

                    const nonceResult = await walletGetNonce(publicKey.toBase58());
                    const message = new TextEncoder().encode(nonceResult.message);
                    const signature = await signMessage(message);
                    const authResult = await walletVerify(
                        publicKey.toBase58(),
                        Array.from(signature),
                        nonceResult.nonce
                    );

                    login(authResult.token, authResult.user);
                    setIsLoading(false);
                } catch (err) {
                    setIsLoading(false);
                    setAuthError(err instanceof Error ? err.message : "Wallet auth failed");
                }
            })();
        }
    }, [connected, publicKey, selectedMethod, signMessage, mode, login]);

    // Watch for Google session → send id_token to backend
    useEffect(() => {
        if (session && !googleAuthSent.current) {
            // @ts-expect-error - id_token is custom property
            const idToken = session.id_token as string | undefined;

            if (idToken) {
                googleAuthSent.current = true;
                (async () => {
                    try {
                        setIsLoading(true);
                        setAuthError(null);
                        const authResult = await googleAuth(idToken);
                        login(authResult.token, authResult.user);
                        setIsLoading(false);
                        setSelectedMethod("google");
                    } catch (err) {
                        setIsLoading(false);
                        setAuthError(err instanceof Error ? err.message : "Google auth failed");
                    }
                })();
            }
        }
    }, [session, mode, login]);

    const handleAuth = (method: AuthMethod) => {
        setSelectedMethod(method);
        setAuthError(null);

        if (method === "wallet") {
            if (!connected) {
                setVisible(true);
            } else {
                if (publicKey && signMessage) {
                    (async () => {
                        try {
                            setIsLoading(true);
                            const nonceResult = await walletGetNonce(publicKey.toBase58());
                            const message = new TextEncoder().encode(nonceResult.message);
                            const signature = await signMessage(message);
                            const authResult = await walletVerify(
                                publicKey.toBase58(),
                                Array.from(signature),
                                nonceResult.nonce
                            );
                            login(authResult.token, authResult.user);
                            setIsLoading(false);
                        } catch (err) {
                            setIsLoading(false);
                            setAuthError(err instanceof Error ? err.message : "Wallet auth failed");
                        }
                    })();
                }
            }
            return;
        }

        if (method === "google") {
            setIsLoading(true);
            signIn("google", { callbackUrl: "/auth" });
            return;
        }

        if (method === "github") {
            setIsLoading(true);
            if (GITHUB_CLIENT_ID) {
                window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=read:user,user:email`;
            } else {
                setIsLoading(false);
                setAuthError("GitHub client ID not configured");
            }
            return;
        }
    };

    return (
        <div className="min-h-screen bg-[#020408] flex relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-neon-green/5 blur-[150px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-neon-purple/5 blur-[120px]" />
                {/* Grid */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(0,255,163,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,163,0.3) 1px, transparent 1px)`,
                        backgroundSize: "60px 60px",
                    }}
                />
                {/* Scanlines */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,163,0.08) 2px, rgba(0,255,163,0.08) 4px)",
                }} />
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
                            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-neon-green transition-colors group font-mono"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            cd ../home
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Header */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-neon-green font-mono text-sm">{">"}</span>
                                <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                                    {mode === "signup" ? "new_player" : "returning_player"}
                                </span>
                                <div className="flex-1 h-px bg-white/[0.06]" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-white font-mono">
                                {mode === "signup" ? "Start Your Quest" : "Welcome Back"}
                            </h1>
                            <p className="text-sm text-zinc-500 font-mono">
                                <span className="text-neon-green/40">// </span>
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
                                <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold font-mono">or continue with</span>
                                <div className="flex-1 h-px bg-white/[0.06]" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <AuthButton method="google" mode={mode} onClick={() => handleAuth("google")} isLoading={isLoading && selectedMethod === "google"} />
                                <AuthButton method="github" mode={mode} onClick={() => handleAuth("github")} isLoading={isLoading && selectedMethod === "github"} />
                            </div>
                        </div>

                        {/* Auth error display */}
                        {authError && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-2.5 p-3 bg-red-500/[0.05] border border-red-500/20 font-mono"
                            >
                                <Shield className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="text-[11px] font-bold text-red-400">ERROR: Authentication failed</div>
                                    <div className="text-[10px] text-zinc-500 mt-0.5">{authError}</div>
                                </div>
                            </motion.div>
                        )}

                        {/* Signup bonuses */}
                        {mode === "signup" && <SignupBonuses />}

                        {/* Toggle mode */}
                        <div className="text-center text-sm text-zinc-500 font-mono">
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
                        <p className="text-[10px] text-zinc-700 text-center leading-relaxed font-mono">
                            By continuing, you agree to our{" "}
                            <a href="#" className="text-zinc-500 underline hover:text-neon-green transition-colors">Terms of Service</a>
                            {" "}and{" "}
                            <a href="#" className="text-zinc-500 underline hover:text-neon-green transition-colors">Privacy Policy</a>.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense>
            <AuthPageContent />
        </Suspense>
    );
}
