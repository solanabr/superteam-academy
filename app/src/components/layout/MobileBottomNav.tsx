"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Sword, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/courses", icon: BookOpen, label: "Courses" },
    { href: "/challenges", icon: Sword, label: "Challenges" },
    { href: "/leaderboard", icon: Trophy, label: "Ranks" },
    { href: "/community", icon: Users, label: "Community" },
];

export function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md">
            {NAV_ITEMS.map((item) => {
                const isActive =
                    item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors"
                    >
                        {isActive && (
                            <motion.div
                                layoutId="mobile-nav-indicator"
                                className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-primary"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <item.icon
                            className={`h-5 w-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                                }`}
                        />
                        <span
                            className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                                }`}
                        >
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
