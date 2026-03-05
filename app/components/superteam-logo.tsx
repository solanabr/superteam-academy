"use client";

import { motion } from "framer-motion";

/**
 * Superteam Academy Logo — follows the Superteam brand with interlocking S/T motif.
 * 
 * - Uses CSS custom properties (--solana-purple, --solana-green) for brand-reactive colors
 * - Framer Motion bounce/squish on mount and hover
 * - The "ST" monogram represents "SuperTeam" in the official style
 */
export function SuperteamLogo({
    size = 32,
    showWordmark = false,
    className = "",
}: {
    size?: number;
    showWordmark?: boolean;
    className?: string;
}) {
    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <motion.svg
                width={size}
                height={size}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 15,
                    mass: 0.8,
                }}
                whileHover={{
                    scale: 1.08,
                    rotate: [0, -2, 2, 0],
                    transition: { duration: 0.35 },
                }}
                whileTap={{ scale: 0.92 }}
                className="shrink-0"
            >
                <defs>
                    <linearGradient id="st-grad-main" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" style={{ stopColor: "var(--solana-purple, #9945FF)" }} />
                        <stop offset="100%" style={{ stopColor: "var(--solana-green, #14F195)" }} />
                    </linearGradient>
                    <linearGradient id="st-grad-accent" x1="64" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" style={{ stopColor: "var(--solana-green, #14F195)" }} />
                        <stop offset="100%" style={{ stopColor: "var(--solana-purple, #9945FF)" }} />
                    </linearGradient>
                </defs>

                {/* Rounded square background */}
                <motion.rect
                    x="2" y="2" width="60" height="60" rx="16"
                    fill="url(#st-grad-main)"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.05, duration: 0.3 }}
                />

                {/* "S" letterform — flowing curve */}
                <motion.path
                    d="M38 16C38 16 26 16 22 20C18 24 22 28 26 30C30 32 34 34 34 38C34 42 28 44 22 44"
                    stroke="white"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                />

                {/* "T" stem — vertical bar integrated into the S */}
                <motion.path
                    d="M38 16V48"
                    stroke="url(#st-grad-accent)"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.9 }}
                    transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
                />

                {/* "T" crossbar */}
                <motion.path
                    d="M30 16H46"
                    stroke="white"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.3, ease: "easeOut" }}
                />
            </motion.svg>

            {/* Wordmark */}
            {showWordmark && (
                <motion.span
                    className="font-display font-bold tracking-tight leading-none select-none text-sm"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                >
                    <span className="gradient-text">Academy</span>
                </motion.span>
            )}
        </span>
    );
}

/**
 * Full-screen loading animation with the logo.
 */
export function LogoLoader({ message = "Loading..." }: { message?: string }) {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background">
            <motion.div
                animate={{
                    scale: [1, 1.08, 1],
                    y: [0, -6, 0],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                <SuperteamLogo size={64} />
            </motion.div>

            <motion.p
                className="text-sm font-medium text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {message}
            </motion.p>

            <div className="w-48 h-1 overflow-hidden rounded-full bg-accent">
                <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--solana-purple)] to-[var(--solana-green)]"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>
        </div>
    );
}
