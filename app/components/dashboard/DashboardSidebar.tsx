/**
 * DashboardSidebar — Collapsible sidebar with navigation, admin-only item, and logout.
 * Uses shadcn Sidebar with brand colors.
 */
'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
    LayoutDashboard,
    BookOpen,
    Swords,
    Trophy,
    Award,
    User,
    MessageSquare,
    Settings,
    Shield,
    LogOut,
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarSeparator,
    useSidebar,
} from '@/components/ui/sidebar';
import { Link } from '@/context/i18n/navigation';

const NAV_ITEMS = [
    { icon: LayoutDashboard, labelKey: 'dashboard', href: '/dashboard' },
    { icon: BookOpen, labelKey: 'courses', href: '/courses' },
    { icon: Swords, labelKey: 'challenges', href: '/challenges' },
    { icon: Trophy, labelKey: 'leaderboard', href: '/leaderboard' },
    { icon: Award, labelKey: 'achievements', href: '/achievements' },
    { icon: User, labelKey: 'profile', href: '/profile' },
    { icon: MessageSquare, labelKey: 'community', href: '/community' },
    { icon: Settings, labelKey: 'settings', href: '/settings' },
] as const;

export function DashboardSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const t = useTranslations('sidebar');
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    // Admin display hint — strict boolean from signed JWT, not client-settable.
    // Server-side routes independently verify admin access; this only controls UI visibility.
    const isAdmin = (session?.user as Record<string, unknown> | undefined)?.isAdmin === true;

    function isActive(href: string) {
        // Strip locale prefix for comparison
        const clean = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') || '/';
        return clean === href || clean.startsWith(href + '/');
    }

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
            {/* Logo */}
            <SidebarHeader className="p-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                    {isCollapsed ? (
                        /* Collapsed: vertical icon */
                        <>
                            <Image
                                src="/superteams-brandkit/Logo/VERTICAL/ST-EMERALD-GREEN-VERTICAL.png"
                                alt="ST"
                                width={28}
                                height={28}
                                className="dark:hidden"
                            />
                            <Image
                                src="/superteams-brandkit/Logo/VERTICAL/ST-OFF-WHITE-VERTICAL.png"
                                alt="ST"
                                width={28}
                                height={28}
                                className="hidden dark:block"
                            />
                        </>
                    ) : (
                        /* Expanded: horizontal logo */
                        <>
                            <Image
                                src="/superteams-brandkit/Logo/HORIZONTAL/PNG/ST-EMERALD-GREEN-HORIZONTAL.png"
                                alt="Superteam Academy"
                                width={160}
                                height={28}
                                className="h-7 dark:hidden"
                                style={{ width: 'auto', height: 'auto' }}
                            />
                            <Image
                                src="/superteams-brandkit/Logo/HORIZONTAL/PNG/ST-OFF-WHITE-HORIZONTAL.png"
                                alt="Superteam Academy"
                                width={160}
                                height={28}
                                className="hidden dark:block"
                                style={{ width: 'auto', height: 'auto' }}
                            />
                        </>
                    )}
                </Link>
            </SidebarHeader>

            <SidebarContent>
                {/* Main Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel className="font-supreme text-xs uppercase tracking-wider text-sidebar-foreground/50">
                        Menu
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {NAV_ITEMS.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.href)}
                                        tooltip={t(item.labelKey)}
                                        className="font-supreme"
                                    >
                                        <Link href={item.href}>
                                            <item.icon className="w-4 h-4" />
                                            <span>{t(item.labelKey)}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Admin — visible only for whitelisted admins */}
                {isAdmin && (
                    <>
                        <SidebarSeparator />
                        <SidebarGroup>
                            <SidebarGroupLabel className="font-supreme text-xs uppercase tracking-wider text-sidebar-foreground/50">
                                Admin
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive('/admin')}
                                            tooltip="Admin Panel"
                                            className="font-supreme"
                                        >
                                            <Link href="/admin">
                                                <Shield className="w-4 h-4" />
                                                <span>Admin Panel</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}
            </SidebarContent>

            {/* Logout — bottom */}
            <SidebarFooter className="p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            tooltip="Logout"
                            className="font-supreme text-destructive hover:bg-destructive/10"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
