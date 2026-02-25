"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    User,
    Settings,
    Award,
    Shield,
    Trophy,
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useXpBalance } from "@/hooks";

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
    SidebarSeparator,
} from "@/components/ui/sidebar";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/certificates", label: "Certificates", icon: Award },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
    const { isAdmin } = useIsAdmin();
    const pathname = usePathname();
    const { data: xp } = useXpBalance();

    const xpValue = xp ?? 0;
    const level = Math.floor(xpValue / 500) + 1;
    const xpInLevel = xpValue % 500;
    const xpForNextLevel = 500;
    const progress = (xpInLevel / xpForNextLevel) * 100;

    return (
        <ShadcnSidebar
            collapsible="icon"
            variant="floating"
            className="floating-sidebar"
        >
            {/* Header */}
            <Link href="/">
                <SidebarHeader className="h-16 flex items-center justify-center border-b border-zinc-800/60">
                    <p
                        className="
      font-game font-bold text-2xl
      transition-all duration-200
      group-data-[state=collapsed]:opacity-0
      group-data-[state=collapsed]:scale-90
      group-data-[state=collapsed]:pointer-events-none
    "
                    >
                        Superteam-academy
                    </p>
                </SidebarHeader>
            </Link>

            {/* Content */}
            <SidebarContent className="px-1">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map(({ href, label, icon: Icon }) => {
                                const active =
                                    pathname === href || pathname.startsWith(href + "/");

                                return (
                                    <SidebarMenuItem key={href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={active}
                                            tooltip={label}
                                            className="
                                                rounded-xl
                                                transition-all duration-200
                                                hover:bg-zinc-800/60
                                                data-[active=true]:bg-zinc-800
                                                data-[active=true]:shadow-inner
                                            "
                                        >
                                            <Link
                                                href={href}
                                                className="flex items-center gap-3 px-3 py-2"
                                            >
                                                <Icon className="h-4 w-4 shrink-0 text-zinc-400" />
                                                <span className="font-game text-lg">
                                                    {label}
                                                </span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Admin */}
                {isAdmin && (
                    <>
                        <SidebarSeparator className="my-3 bg-zinc-800/40" />
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname.startsWith("/admin")}
                                            tooltip="Admin"
                                            className="
                                                rounded-xl
                                                transition-all duration-200
                                                hover:bg-zinc-800/60
                                                data-[active=true]:bg-zinc-800
                                                data-[active=true]:shadow-inner
                                            "
                                        >
                                            <Link
                                                href="/admin"
                                                className="flex items-center gap-3 px-3 py-2"
                                            >
                                                <Shield className="h-4 w-4 shrink-0 text-zinc-400" />
                                                <span className="font-game text-lg">Admin</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}
            </SidebarContent>

            {/* Footer / XP */}
            <SidebarFooter className="p-3 border-t border-zinc-800/60">
                <div className="group-data-[collapsible=icon]:hidden rounded-xl bg-zinc-800/40 p-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-game text-sm text-yellow-400">
                            Lv.{level}
                        </span>
                        <span className="font-game text-sm text-gray-500">
                            Lv.{level + 1}
                        </span>
                    </div>

                    <div className="h-2 rounded-full bg-zinc-700 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <p className="font-game text-xs text-gray-500 mt-1 text-center">
                        {xpInLevel} / {xpForNextLevel} XP
                    </p>
                </div>
            </SidebarFooter>
        </ShadcnSidebar>
    );
}