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
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/certificates", label: "Certificates", icon: Award },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
    const { isAdmin } = useIsAdmin();
    const pathname = usePathname();

    return (
        <ShadcnSidebar collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center justify-center">
                <Logo />
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map(({ href, label, icon: Icon }) => {
                                const active =
                                    pathname === href ||
                                    pathname.startsWith(href + "/");
                                return (
                                    <SidebarMenuItem key={href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={active}
                                            tooltip={label}
                                        >
                                            <Link href={href}>
                                                <Icon className="h-4 w-4 shrink-0" />
                                                <span>{label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                {isAdmin && (
                    <>
                        <SidebarSeparator />
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname.startsWith("/admin")}
                                            tooltip="Admin"
                                        >
                                            <Link href="/admin">
                                                <Shield className="h-4 w-4 shrink-0" />
                                                <span>Admin</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}
            </SidebarContent>
            <SidebarFooter />
        </ShadcnSidebar>
    );
}
