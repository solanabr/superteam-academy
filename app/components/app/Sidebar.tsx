"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    User,
    Settings,
    Award,
    Shield,
    Trophy,
    Target,
} from "lucide-react";

import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useXpBalance } from "@/hooks";
import { useWallet } from "@solana/wallet-adapter-react";
import { levelFromXp, xpProgressInLevel } from "@/lib/level";
import { useTranslations } from "next-intl";

import {
    Sidebar as ShadcnSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

const staticNavItems: { href: string; key: "dashboard" | "courses" | "leaderboard" | "challenges" | "certificates" | "settings"; icon: typeof LayoutDashboard }[] = [
    { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
    { href: "/courses", key: "courses", icon: BookOpen },
    { href: "/leaderboard", key: "leaderboard", icon: Trophy },
    { href: "/challenges", key: "challenges", icon: Target },
    { href: "/certificates", key: "certificates", icon: Award },
    { href: "/settings", key: "settings", icon: Settings },
];

export function AppSidebar() {
    const { isAdmin } = useIsAdmin();
    const pathname = usePathname();
    const { data: xp } = useXpBalance();
    const { publicKey } = useWallet();
    const t = useTranslations("common");
    const profileHref = publicKey ? `/profile/${publicKey.toBase58()}` : "/profile";

    const navItems = [
        ...staticNavItems.slice(0, 4),
        { href: profileHref, key: "profile" as const, icon: User },
        ...staticNavItems.slice(4),
    ];

    const xpValue = xp ?? 0;
    const { level, xpInLevel, xpForNextLevel } = xpProgressInLevel(xpValue);
    const progress = xpForNextLevel > 0 ? (xpInLevel / xpForNextLevel) * 100 : 0;

    return (
        <ShadcnSidebar
            collapsible="icon"
            variant="floating"
            className="floating-sidebar"
        >
            {/* Header: vertical logo — same optical column as nav icons when collapsed */}
            <Link href="/" className="flex items-center justify-center min-h-[4rem] py-2">
                <SidebarHeader className="h-full flex items-center justify-center border-b border-sidebar-border w-full">
                    <div className="flex w-full items-center justify-center group-data-[state=collapsed]:w-8 group-data-[state=collapsed]:h-8 group-data-[state=collapsed]:shrink-0">
                        <Image
                            src="/VERTICAL-LOGO/ST-DARK-GREEN-VERTICAL.png"
                            alt="Superteam Academy"
                            width={80}
                            height={120}
                            className="h-14 w-auto object-contain object-center transition-[height,width] duration-200 ease-linear dark:hidden group-data-[state=collapsed]:h-8 group-data-[state=collapsed]:w-auto"
                        />
                        <Image
                            src="/VERTICAL-LOGO/ST-OFF-WHITE-VERTICAL.png"
                            alt="Superteam Academy"
                            width={80}
                            height={120}
                            className="h-14 w-auto object-contain object-center transition-[height,width] duration-200 ease-linear hidden dark:block group-data-[state=collapsed]:h-8 group-data-[state=collapsed]:w-auto"
                        />
                    </div>
                </SidebarHeader>
            </Link>

            {/* Content */}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map(({ href, key, icon: Icon }) => {
                                const active = key === "profile"
                                    ? pathname.startsWith("/profile")
                                    : pathname === href || pathname.startsWith(href + "/");

                                return (
                                    <SidebarMenuItem key={href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={active}
                                            tooltip={t(key)}
                                            className="rounded-xl transition-colors duration-150 hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:shadow-inner w-full"
                                        >
                                            <Link
                                                href={href}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-150 hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                                            >
                                                <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-5">
                                                    <Icon />
                                                </span>
                                                <span className="font-game text-lg truncate min-w-0 group-data-[collapsible=icon]:hidden">
                                                    {t(key)}
                                                </span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                            {isAdmin && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname.startsWith("/admin")}
                                        tooltip={t("admin")}
                                        className="rounded-xl transition-colors duration-150 hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:shadow-inner w-full"
                                    >
                                        <Link
                                            href="/admin"
                                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-150 hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                                        >
                                            <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-5">
                                                <Shield />
                                            </span>
                                            <span className="font-game text-lg truncate min-w-0 group-data-[collapsible=icon]:hidden">{t("admin")}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer / XP */}
            <SidebarFooter className="p-3 border-t border-sidebar-border">
                <div className="group-data-[collapsible=icon]:hidden rounded-xl bg-muted/80 p-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-game text-base sm:text-lg text-yellow-500">
                            Lv.{level}
                        </span>
                        <span className="font-game text-base sm:text-lg text-muted-foreground">
                            Lv.{level + 1}
                        </span>
                    </div>

                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full bg-yellow-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <p className="font-game text-sm text-muted-foreground mt-1 text-center">
                        {xpInLevel} / {xpForNextLevel} {t("xp")}
                    </p>
                </div>
            </SidebarFooter>
        </ShadcnSidebar>
    );
}