"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useUIStore } from "@/store/ui-store";
import { useUserStore } from "@/store/user-store";
import { useAchievementStore } from "@/store/achievement-store";
import { useEnrollmentStore } from "@/store/enrollment-store";
import { useLessonStore } from "@/store/lesson-store";
import { usePlaygroundStore } from "@/store/playground-store";
import { useAppUser } from "@/hooks/useAppUser";
import { LocaleSwitcher } from "../layout/LocaleSwitcher";
import { Button } from "../ui/button";
import {
    LayoutDashboard,
    Trophy,
    GraduationCap,
    FileEdit,
    Terminal,
    Wallet,
    Settings,
    LogOut,
    ChevronDown,
    ChevronUp,
    Menu,
    X
} from "lucide-react";

export function PlatformNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = usePrivy();
    const { user } = useAppUser();

    // Use UI store for menu state instead of local useState
    const isProfileOpen = useUIStore((s) => s.isProfileOpen);
    const toggleProfile = useUIStore((s) => s.toggleProfile);
    const setProfileOpen = useUIStore((s) => s.setProfileOpen);
    const isMobileMenuOpen = useUIStore((s) => s.isMobileMenuOpen);
    const toggleMobileMenu = useUIStore((s) => s.toggleMobileMenu);
    const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);

    const t = useTranslations("nav");

    // Check if user is professor/admin
    const isProfessor = user?.role === "professor" || user?.role === "admin";

    const navLinks = [
        { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
        { href: "/leaderboard", label: t("leaderboard"), icon: Trophy },
        { href: "/courses", label: t("courses"), icon: GraduationCap },
        { href: "/achievements", label: t("achievements"), icon: Trophy },
        ...(isProfessor ? [{ href: "/teach/courses", label: t("teach"), icon: FileEdit }] : []),
    ];

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard" || pathname === "/en/dashboard";
        }
        return pathname?.startsWith(href) || pathname?.startsWith(`/en${href}`);
    };

    const handleLogout = async () => {
        try {
            // Close dropdown first
            setProfileOpen(false);
            setMobileMenuOpen(false);

            // Logout from Privy
            await logout();

            // Reset all Zustand stores
            useUserStore.getState().reset();
            useAchievementStore.getState().reset();
            useEnrollmentStore.getState().reset?.();
            useLessonStore.getState().reset();
            usePlaygroundStore.getState().reset();
            useUIStore.getState().reset();

            // Replace history to prevent back-button access
            window.history.replaceState(null, "", "/");
            router.replace("/");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 z-40 bg-[#0A0A0B]/70 backdrop-blur-2xl border-b border-white/10 px-4 md:px-8 flex items-center justify-between transition-all duration-300">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3">
                <img src="/logo/st-brazil-horizontal.svg" alt="Superteam Brazil" className="h-8 w-auto hidden sm:block" />
                <div className="size-8 rounded bg-gradient-to-br from-solana to-emerald-800 flex items-center justify-center shadow-[0_0_10px_rgba(20,241,149,0.3)] sm:hidden">
                    <Terminal size={18} className="text-void" strokeWidth={2.5} />
                </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-display font-medium text-sm transition-all ${isActive(link.href)
                            ? "bg-solana/10 text-solana border border-solana/20"
                            : "text-text-muted hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <link.icon size={18} className={isActive(link.href) ? "text-solana" : "text-text-muted"} />
                        <span>{link.label}</span>
                    </Link>
                ))}
            </div>

            {/* Right Side: Wallet + User Profile */}
            <div className="flex items-center gap-3">
                {/* Locale Switcher */}
                <div className="hidden md:block">
                    <LocaleSwitcher />
                </div>

                {/* Wallet Address (Desktop) */}
                {user?.walletAddress && (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                        <Wallet size={14} className="text-solana" />
                        <span className="font-mono text-xs text-text-muted">
                            {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
                        </span>
                    </div>
                )}

                {/* User Profile Dropdown */}
                <div
                    className="relative"
                    onMouseLeave={() => setProfileOpen(false)}
                >
                    <Button
                        variant="ghost"
                        onClick={toggleProfile}
                        className="flex items-center gap-2 px-2 h-auto py-1.5 rounded-lg hover:bg-white/10 transition-all border border-transparent hover:border-white/5"
                    >
                        <div className="size-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center border border-white/10 overflow-hidden">
                            {(user?.profile as any)?.image ? (
                                <img src={(user?.profile as any).image} alt="Profile" className="w-full h-full object-cover" />
                            ) : user?.walletAddress ? (
                                <img src={`https://api.dicebear.com/9.x/bottts/svg?seed=${user.walletAddress}&backgroundColor=0a0a0b&baseColor=14f195&radius=50&sidesProbability=0&topProbability=0`} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-mono text-xs text-white">
                                    {(user?.profile as any)?.displayName?.slice(0, 2).toUpperCase() || "DV"}
                                </span>
                            )}
                        </div>
                        <div className="hidden md:block">
                            {isProfileOpen ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
                        </div>
                    </Button>

                    {/* Dropdown Menu - Wrapped with invisible expanded padding for better UX */}
                    {isProfileOpen && (
                        <div className="absolute right-0 top-full pt-2 pb-10 pl-16 pr-8 -mr-8 z-50 flex justify-end">
                            <div className="w-56 rounded-lg bg-void/95 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden">
                                <div className="p-3 border-b border-white/10">
                                    <p className="text-sm font-medium text-white truncate">
                                        {(user?.profile as any)?.displayName || "DevUser"}
                                    </p>
                                    <p className="text-xs font-mono text-solana truncate">
                                        {user?.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : "Not Connected"}
                                    </p>
                                </div>
                                <div className="p-2">
                                    <Link
                                        href="/settings"
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-all"
                                        onClick={() => setProfileOpen(false)}
                                    >
                                        <Settings size={18} />
                                        <span className="text-sm font-medium">{t("settings")}</span>
                                    </Link>
                                    <Button
                                        onClick={handleLogout}
                                        variant="ghost"
                                        className="w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-all h-auto"
                                    >
                                        <LogOut size={18} />
                                        <span className="text-sm font-medium">{t("logout")}</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMobileMenu}
                    className="md:hidden"
                >
                    {isMobileMenuOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
                </Button>
            </div>

            {/* Mobile Menu */}
            {
                isMobileMenuOpen && (
                    <div className="absolute top-16 left-0 right-0 md:hidden bg-void/95 backdrop-blur-md border-b border-white/10 shadow-xl">
                        <div className="p-4 space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-display font-medium text-sm transition-all ${isActive(link.href)
                                        ? "bg-solana/10 text-solana border border-solana/20"
                                        : "text-text-muted hover:text-white hover:bg-white/5"
                                        }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <link.icon size={20} />
                                    <span>{link.label}</span>
                                </Link>
                            ))}

                            <hr className="border-white/10 my-2" />

                            <Link
                                href="/settings"
                                className="flex items-center gap-3 px-4 py-3 rounded-lg font-display font-medium text-sm text-text-muted hover:text-white hover:bg-white/5 transition-all"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Settings size={20} />
                                <span>{t("settings")}</span>
                            </Link>

                            <Button
                                onClick={handleLogout}
                                variant="ghost"
                                className="w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg font-display font-medium text-sm text-text-muted hover:text-white hover:bg-white/5 transition-all h-auto"
                            >
                                <LogOut size={20} />
                                <span>{t("logout")}</span>
                            </Button>
                        </div>
                    </div>
                )
            }
        </nav >
    );
}
