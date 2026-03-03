/**
 * Dashboard layout — wraps ALL /dashboard/* routes with sidebar + topbar shell.
 * This layout renders instead of the LandingNavbar for authenticated dashboard pages.
 */
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
