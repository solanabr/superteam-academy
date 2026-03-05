"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, X, LayoutDashboard, Gamepad2, Users, BookOpen, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AuthButton } from "@/components/auth-button";
import { HeaderCoursePicker } from "@/components/header-course-picker";
import { SuperteamLogo } from "@/components/superteam-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { AnimatePresence, motion } from "framer-motion";

/** Public links — always visible */
const publicLinks = [
    { key: "courses", href: "/courses", icon: BookOpen },
    { key: "leaderboard", href: "/leaderboard", icon: Trophy },
] as const;

/** Auth-only links — shown in secondary nav bar */
const authLinks = [
    { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    { key: "games", href: "/games", icon: Gamepad2 },
    { key: "friends", href: "/friends", icon: Users },
] as const;

export function Header() {
    const t = useTranslations("Header");
    const { isAuthenticated } = useAuth();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/" || pathname === "";
        return pathname.startsWith(href);
    };

    // Secondary bar links (auth-only: dashboard, games, friends, courses, leaderboard)
    const secondaryLinks = [...authLinks, ...publicLinks];

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            {/* ─── Primary Bar ─── */}
            <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="content-container">
                    <div className="flex h-14 items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-1.5 font-display shrink-0">
                            <SuperteamLogo size={28} showWordmark />
                        </Link>

                        {/* When NOT authenticated: show public links inline in primary bar */}
                        {!isAuthenticated && (
                            <nav className="hidden items-center gap-1 md:flex">
                                {publicLinks.map(({ key, href, icon: Icon }) => {
                                    const active = isActive(href);
                                    return (
                                        <Link
                                            key={key}
                                            href={href}
                                            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active
                                                    ? "text-solana-purple bg-solana-purple/5"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                                }`}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                            {t(key)}
                                        </Link>
                                    );
                                })}
                            </nav>
                        )}

                        {/* Desktop utilities */}
                        <div className="hidden items-center gap-2 md:flex">
                            <HeaderCoursePicker />
                            <LanguageSwitcher />
                            <ThemeSwitcher />
                            <AuthButton />
                        </div>

                        {/* Mobile hamburger */}
                        <div className="flex items-center gap-2 md:hidden">
                            <ThemeSwitcher />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full"
                                onClick={() => setMobileOpen(!mobileOpen)}
                            >
                                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                                <span className="sr-only">{t("menu")}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Secondary Nav Bar (only when authenticated) ─── */}
            {isAuthenticated && (
                <div className="hidden border-b border-border/30 bg-background/60 backdrop-blur-md md:block">
                    <div className="content-container">
                        <nav className="flex h-10 items-center gap-0.5 -mb-px">
                            {secondaryLinks.map(({ key, href, icon: Icon }) => {
                                const active = isActive(href);
                                return (
                                    <Link
                                        key={key}
                                        href={href}
                                        className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${active
                                                ? "text-solana-purple"
                                                : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {t(key, { defaultValue: key })}
                                        {active && (
                                            <motion.div
                                                layoutId="nav-active"
                                                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-solana-purple to-solana-green"
                                                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}

            {/* ─── Mobile Menu ─── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden border-b border-border/30 bg-background/95 backdrop-blur-xl md:hidden"
                    >
                        <nav className="content-container flex flex-col gap-0.5 py-3">
                            {/* Show all applicable links */}
                            {(isAuthenticated ? secondaryLinks : publicLinks).map(({ key, href, icon: Icon }) => {
                                const active = isActive(href);
                                return (
                                    <Link
                                        key={key}
                                        href={href}
                                        onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active
                                                ? "text-solana-purple bg-solana-purple/5"
                                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                            }`}
                                    >
                                        <Icon className={`h-4 w-4 ${active ? "text-solana-purple" : ""}`} />
                                        {t(key, { defaultValue: key })}
                                        {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-solana-purple" />}
                                    </Link>
                                );
                            })}

                            <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
                                <LanguageSwitcher />
                                <HeaderCoursePicker />
                                <AuthButton />
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
