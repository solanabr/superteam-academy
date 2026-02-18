"use client";

import { Link } from "@/i18n/routing";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useUIStore } from "@/store/ui-store";
import { useUserStore } from "@/store/user-store";
import { useAchievementStore } from "@/store/achievement-store";
import { useEnrollmentStore } from "@/store/enrollment-store";
import { useLessonStore } from "@/store/lesson-store";
import { usePlaygroundStore } from "@/store/playground-store";
import { useAppUser } from "@/hooks/useAppUser";

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

    // Check if user is professor/admin
    const isProfessor = user?.role === "professor" || user?.role === "admin";

    const navLinks = [
        { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
        { href: "/courses", label: "Courses", icon: "school" },
        { href: "/achievements", label: "Achievements", icon: "trophy" },
        ...(isProfessor ? [{ href: "/teach/courses", label: "Teach", icon: "edit_note" }] : []),
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
        <nav className="fixed top-0 left-0 right-0 h-16 z-40 glass-panel border-b border-white/10 px-4 md:px-8 flex items-center justify-between transition-all duration-300">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3">
                <div className="size-8 rounded bg-gradient-to-br from-solana to-emerald-800 flex items-center justify-center shadow-[0_0_10px_rgba(20,241,149,0.3)]">
                    <span className="material-symbols-outlined notranslate text-void font-bold text-lg">terminal</span>
                </div>
                <h1 className="font-display font-bold text-lg md:text-xl tracking-tight text-white hidden sm:block">
                    Superteam<span className="text-solana">.academy</span>
                </h1>
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
                        <span className="material-symbols-outlined notranslate text-lg">{link.icon}</span>
                        <span>{link.label}</span>
                    </Link>
                ))}
            </div>

            {/* Right Side: Wallet + User Profile */}
            <div className="flex items-center gap-3">
                {/* Wallet Address (Desktop) */}
                {user?.walletAddress && (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                        <span className="material-symbols-outlined notranslate text-solana text-sm">wallet</span>
                        <span className="font-mono text-xs text-text-muted">
                            {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
                        </span>
                    </div>
                )}

                {/* User Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={toggleProfile}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                    >
                        <div className="size-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center border border-white/10">
                            <span className="font-mono text-xs text-white">
                                {(user?.profile as any)?.displayName?.slice(0, 2).toUpperCase() || "DV"}
                            </span>
                        </div>
                        <span className="material-symbols-outlined notranslate text-text-muted text-sm hidden md:block">
                            {isProfileOpen ? "expand_less" : "expand_more"}
                        </span>
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-void/95 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden">
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
                                    <span className="material-symbols-outlined notranslate text-lg">settings</span>
                                    <span className="text-sm font-medium">Settings</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-all"
                                >
                                    <span className="material-symbols-outlined notranslate text-lg">logout</span>
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={toggleMobileMenu}
                    className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-all"
                >
                    <span className="material-symbols-outlined notranslate text-white">
                        {isMobileMenuOpen ? "close" : "menu"}
                    </span>
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
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
                                <span className="material-symbols-outlined notranslate text-lg">{link.icon}</span>
                                <span>{link.label}</span>
                            </Link>
                        ))}
                        {/* Mobile Logout */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-display font-medium text-sm text-text-muted hover:text-white hover:bg-white/5 transition-all"
                        >
                            <span className="material-symbols-outlined notranslate text-lg">logout</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
