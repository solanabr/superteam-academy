/**
 * Achievements layout — wraps /achievements/* routes with sidebar + topbar shell.
 * Mirrors the dashboard/leaderboard/challenges layout for consistent navigation.
 */
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';

export default function AchievementsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <DashboardSidebar />
            <SidebarInset>
                <DashboardTopbar />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 bg-background font-supreme">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
