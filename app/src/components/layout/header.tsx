"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sun,
    Moon,
    Menu,
    X,
    ChevronDown,
    Wallet,
    LogOut,
    User,
    Settings,
    LayoutDashboard,
    BookOpen,
    Trophy,
    Globe,
} from "lucide-react";
import { cn, shortenAddress } from "@/lib/utils";
import { NAV_ITEMS, LOCALE_LABELS, LOCALE_FLAGS, type Locale } from "@/lib/constants";

export function Header() {
    const t = useTranslations();
    const { theme, setTheme } = useTheme();
    const { connected, publicKey, disconnect } = useWallet();
    const { setVisible: setWalletModalVisible } = useWalletModal();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

    const navIcons: Record<string, React.ReactNode> = {
        courses: <BookOpen className="w-4 h-4" />,
        dashboard: <LayoutDashboard className="w-4 h-4" />,
        leaderboard: <Trophy className="w-4 h-4" />,
    };

    const changeLocale = (locale: Locale) => {
        document.cookie = `locale=${locale};path=/;max-age=31536000`;
        setLangDropdownOpen(false);
        window.location.reload();
    };

    const currentLocale = (typeof document !== "undefined"
        ? document.cookie.match(/locale=([^;]+)/)?.[1]
        : "en") as Locale || "en";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-emerald-500 flex items-center justify-center font-bold text-white text-sm group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-shadow">
                            SA
                        </div>
                        <span className="font-bold text-lg hidden sm:block">
                            <span className="gradient-text">Superteam</span>{" "}
                            <span className="text-foreground">Academy</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.key}
                                href={item.href}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                            >
                                {navIcons[item.key]}
                                {t(`nav.${item.key}`)}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Section */}
                    <div className="flex items-center gap-2">
                        {/* Language Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                                className="flex items-center gap-1 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                            >
                                <Globe className="w-4 h-4" />
                                <span className="hidden sm:inline text-xs">{LOCALE_FLAGS[currentLocale]}</span>
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            <AnimatePresence>
                                {langDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="absolute right-0 mt-2 w-40 glass-strong rounded-xl shadow-xl overflow-hidden"
                                    >
                                        {(Object.keys(LOCALE_LABELS) as Locale[]).map((locale) => (
                                            <button
                                                key={locale}
                                                onClick={() => changeLocale(locale)}
                                                className={cn(
                                                    "w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary/50 transition-colors",
                                                    currentLocale === locale && "text-primary font-medium"
                                                )}
                                            >
                                                <span>{LOCALE_FLAGS[locale]}</span>
                                                {LOCALE_LABELS[locale]}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? (
                                <Sun className="w-4 h-4" />
                            ) : (
                                <Moon className="w-4 h-4" />
                            )}
                        </button>

                        {/* Wallet Button */}
                        {connected && publicKey ? (
                            <div className="relative">
                                <button
                                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-all text-sm"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-emerald-500" />
                                    <span className="hidden sm:inline font-mono text-xs">
                                        {shortenAddress(publicKey.toBase58())}
                                    </span>
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                                <AnimatePresence>
                                    {profileDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="absolute right-0 mt-2 w-48 glass-strong rounded-xl shadow-xl overflow-hidden"
                                        >
                                            <Link
                                                href="/dashboard"
                                                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary/50 transition-colors"
                                                onClick={() => setProfileDropdownOpen(false)}
                                            >
                                                <LayoutDashboard className="w-4 h-4" />
                                                {t("nav.dashboard")}
                                            </Link>
                                            <Link
                                                href="/profile"
                                                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary/50 transition-colors"
                                                onClick={() => setProfileDropdownOpen(false)}
                                            >
                                                <User className="w-4 h-4" />
                                                {t("nav.profile")}
                                            </Link>
                                            <Link
                                                href="/settings"
                                                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary/50 transition-colors"
                                                onClick={() => setProfileDropdownOpen(false)}
                                            >
                                                <Settings className="w-4 h-4" />
                                                {t("nav.settings")}
                                            </Link>
                                            <div className="border-t border-border" />
                                            <button
                                                onClick={() => {
                                                    disconnect();
                                                    setProfileDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-secondary/50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                {t("common.disconnect")}
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <button
                                onClick={() => setWalletModalVisible(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                            >
                                <Wallet className="w-4 h-4" />
                                <span className="hidden sm:inline">{t("common.connectWallet")}</span>
                            </button>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden glass-strong border-t border-border"
                    >
                        <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
                            {NAV_ITEMS.map((item) => (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                                >
                                    {navIcons[item.key]}
                                    {t(`nav.${item.key}`)}
                                </Link>
                            ))}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
