"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useXP } from "@/hooks/useXP";
import { formatXP } from "@/lib/xp";
import { Zap, BookOpen, Trophy, User, LayoutDashboard, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const NAV_LINKS = [
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function Header() {
    const pathname = usePathname();
    const { publicKey } = useWallet();
    const xp = useXP();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    return (
        <header className="sticky top-0 z-50 glass border-b border-[hsl(var(--border))]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 shrink-0 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-green-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-heading font-bold text-lg hidden sm:block">
                        Superteam <span className="gradient-text">Academy</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1 flex-1">
                    {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                        const active = pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active
                                    ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right side — only rendered after client hydration to avoid mismatch */}
                <div className="flex items-center gap-3 ml-auto">
                    {mounted && (
                        <>
                            {/* XP badge */}
                            {publicKey && !xp.loading && (
                                <div className="hidden sm:flex items-center gap-1.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-full px-3 py-1.5 text-sm">
                                    <Zap className="w-3.5 h-3.5 text-green-400" />
                                    <span className="font-semibold text-green-400">{formatXP(xp.balance)}</span>
                                    <span className="text-[hsl(var(--muted-foreground))]">XP</span>
                                    <span className="ml-1 text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-medium">
                                        Lv.{xp.level}
                                    </span>
                                </div>
                            )}

                            {/* Profile link */}
                            {publicKey && (
                                <Link
                                    href={`/profile/${publicKey.toBase58().slice(0, 8)}`}
                                    className="hidden sm:flex w-8 h-8 rounded-full bg-[hsl(var(--muted))] items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                </Link>
                            )}

                            {/* Wallet button */}
                            <WalletMultiButton
                                style={{
                                    background: "hsl(var(--primary))",
                                    fontSize: "13px",
                                    padding: "8px 16px",
                                    height: "36px",
                                    borderRadius: "8px",
                                    fontFamily: "var(--font-sans)",
                                    fontWeight: "600",
                                }}
                            />
                        </>
                    )}

                    {/* Mobile menu — always rendered (no wallet state) */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
                        onClick={() => setMobileOpen((v) => !v)}
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav */}
            {mobileOpen && (
                <div className="md:hidden border-t border-[hsl(var(--border))] py-3 px-4 space-y-1">
                    {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors"
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </Link>
                    ))}
                </div>
            )}
        </header>
    );
}
