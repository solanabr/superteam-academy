"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    User,
    Settings,
    Award,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";
import { XpBadge } from "./XpBadge";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/certificates", label: "Certificates", icon: Award },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function AppHeader() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm lg:justify-end">
                {/* Mobile left: logo + hamburger */}
                <div className="flex items-center gap-2 lg:hidden">
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors"
                    >
                        {mobileOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                    <Logo />
                </div>

                <div className="flex items-center gap-3">
                    <XpBadge />
                </div>
            </header>

            {/* Mobile nav drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-20 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setMobileOpen(false)}
                    />
                    <nav className="absolute left-0 top-14 bottom-0 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-y-auto">
                        <div className="space-y-1 p-3">
                            {navItems.map(({ href, label, icon: Icon }) => {
                                const active =
                                    pathname === href || pathname.startsWith(href + "/");
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                            active
                                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                                        )}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        <span>{label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                </div>
            )}
        </>
    );
}
