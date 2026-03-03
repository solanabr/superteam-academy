/**
 * DashboardTopbar — Horizontal bar with sidebar trigger, logo, XP badge, toggles.
 */
'use client';


import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { XpBadge } from './XpBadge';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { NotificationErrorBoundary } from '@/components/notification/NotificationErrorBoundary';

export function DashboardTopbar() {
    return (
        <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-background px-4" role="banner" aria-label="Dashboard toolbar">
            {/* Sidebar toggle */}
            <SidebarTrigger className="text-foreground" aria-label="Toggle sidebar navigation" />

            <Separator orientation="vertical" className="h-6" aria-hidden="true" />

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right side: XP + notifications + toggles */}
            <div className="flex items-center gap-2" role="navigation" aria-label="Dashboard actions">
                <XpBadge />
                <NotificationErrorBoundary>
                    <NotificationBell />
                </NotificationErrorBoundary>
                <ThemeToggle />
                <LanguageToggle />
            </div>
        </header>
    );
}
