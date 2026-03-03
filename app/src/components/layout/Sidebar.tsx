"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useXP } from "@/hooks/useXP";
import { formatXP } from "@/lib/xp";
import { useTheme } from "@/providers/ThemeProvider";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import {
    Zap,
    BookOpen,
    Trophy,
    LayoutDashboard,
    Settings,
    Shield,
    User,
    GraduationCap,
    Sun,
    Moon,
    Award,
    Menu,
    X,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV_LINKS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/certificates", label: "Certificates", icon: Award },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/admin", label: "Admin", icon: Shield },
];

export function Sidebar() {
    const pathname = usePathname();
    const { publicKey } = useWallet();
    const xp = useXP();
    const { theme, toggleTheme } = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="px-5 pt-6 pb-8">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <img
                        src="/icon-192x192.png"
                        alt="Superteam Academy Logo"
                        className="w-10 h-10 rounded-xl shadow-md group-hover:scale-105 transition-transform"
                    />
                    <span className="font-heading font-bold text-base">
                        Academy
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setMobileOpen(false)}
                            className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${active
                                ? "active"
                                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                                }`}
                        >
                            <Icon className="w-[18px] h-[18px]" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div className="px-3 pb-4 space-y-3">
                {/* XP Badge */}
                {publicKey && (
                    <div className="px-3 py-3 rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Zap className="w-4 h-4" />
                            {formatXP(xp.balance)} XP
                        </div>
                        <p className="text-xs mt-0.5 opacity-70">Level {xp.level}</p>
                    </div>
                )}

                {/* Language switcher */}
                <LocaleSwitcher />

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                >
                    {theme === "light" ? (
                        <Moon className="w-[18px] h-[18px]" />
                    ) : (
                        <Sun className="w-[18px] h-[18px]" />
                    )}
                    {theme === "light" ? "Dark Mode" : "Light Mode"}
                </button>

                {/* Profile link */}
                {publicKey && (
                    <Link
                        href={`/profile/${publicKey.toBase58().slice(0, 8)}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                    >
                        <User className="w-[18px] h-[18px]" />
                        Profile
                    </Link>
                )}

                {/* Wallet button */}
                {mounted && (
                    <div className="pt-1">
                        <WalletMultiButton
                            style={{
                                width: "100%",
                                height: "40px",
                                fontSize: "13px",
                                borderRadius: "12px",
                                justifyContent: "center",
                                background: "hsl(var(--primary))",
                            }}
                        />
                    </div>
                )}
            </div>
        </>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] z-40">
                {sidebarContent}
            </aside>

            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] z-40 flex items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <img
                        src="/icon-192x192.png"
                        alt="Superteam Academy Logo"
                        className="w-8 h-8 rounded-lg"
                    />
                    <span className="font-heading font-bold text-sm">Academy</span>
                </Link>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 bg-black/30 z-40"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-60 bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] z-50 flex flex-col">
                        {sidebarContent}
                    </aside>
                </>
            )}
        </>
    );
}
