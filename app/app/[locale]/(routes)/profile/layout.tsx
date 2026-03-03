/**
 * Profile layout — wraps /profile/* routes.
 * /profile/[username] (public): minimal navbar with logo, theme/language toggles.
 * /profile (own): full sidebar layout for authenticated users.
 */
'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import { LanguageToggle } from '@/components/dashboard/LanguageToggle';
import Image from 'next/image';
import Link from 'next/link';
import { LogIn, LayoutDashboard } from 'lucide-react';

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { status } = useSession();
    const pathname = usePathname();

    // /{locale}/profile/{username} → public profile
    const segments = pathname.split('/').filter(Boolean);
    const isPublicProfile = segments.length >= 3 && segments[1] === 'profile' && segments[2] !== '';

    // Public profile → minimal layout, no sidebar
    if (isPublicProfile) {
        return (
            <div className="min-h-screen bg-background">
                <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
                    <div className="max-w-[900px] mx-auto flex items-center justify-between px-5 py-3">
                        {/* Logo — vertical for mobile, horizontal for desktop */}
                        <Link href="/" className="flex items-center shrink-0">
                            {/* Mobile: vertical icon (light) */}
                            <Image
                                src="/superteams-brandkit/Logo/VERTICAL/ST-EMERALD-GREEN-VERTICAL.png"
                                alt="Superteam"
                                width={28}
                                height={28}
                                className="block sm:hidden dark:hidden"
                            />
                            {/* Mobile: vertical icon (dark) */}
                            <Image
                                src="/superteams-brandkit/Logo/VERTICAL/ST-OFF-WHITE-VERTICAL.png"
                                alt="Superteam"
                                width={28}
                                height={28}
                                className="hidden dark:block dark:sm:hidden"
                            />
                            {/* Desktop: horizontal (light) */}
                            <Image
                                src="/superteams-brandkit/Logo/HORIZONTAL/PNG/ST-EMERALD-GREEN-HORIZONTAL.png"
                                alt="Superteam Academy"
                                width={140}
                                height={24}
                                className="h-6 w-auto hidden sm:block sm:dark:hidden"
                            />
                            {/* Desktop: horizontal (dark) */}
                            <Image
                                src="/superteams-brandkit/Logo/HORIZONTAL/PNG/ST-OFF-WHITE-HORIZONTAL.png"
                                alt="Superteam Academy"
                                width={140}
                                height={24}
                                className="h-6 w-auto hidden dark:sm:block"
                            />
                        </Link>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5">
                            <ThemeToggle />
                            <LanguageToggle />

                            {/* CTA */}
                            {status === 'authenticated' ? (
                                <Link
                                    href="/en/dashboard"
                                    className="inline-flex items-center gap-1.5 ml-1 px-4 h-9 rounded-xl bg-brand-green-emerald text-white text-xs font-semibold font-supreme shadow-sm hover:opacity-90 transition-all"
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/en/login"
                                    className="inline-flex items-center gap-1.5 ml-1 px-4 h-9 rounded-xl bg-brand-green-emerald text-white text-xs font-semibold font-supreme shadow-sm hover:opacity-90 transition-all"
                                >
                                    <LogIn className="w-3.5 h-3.5" />
                                    Join Free
                                </Link>
                            )}
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 font-supreme">
                    {children}
                </main>
            </div>
        );
    }

    // Loading
    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-brand-green-emerald border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Own profile — sidebar layout
    return (
        <SidebarProvider>
            <DashboardSidebar />
            <SidebarInset>
                <DashboardTopbar />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-background font-supreme">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
