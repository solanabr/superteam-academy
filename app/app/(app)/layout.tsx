import { WalletGuard } from "@/components/app/WalletGuard";
import { AppSidebar } from "@/components/app/Sidebar";
import { AppHeader } from "@/components/app/AppHeader";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";

/**
 * Main app layout: dashboard, courses, certificates, settings, profile, leaderboard, admin.
 * Only used by routes under (app). Do not use test-page-only behavior here; /test has its own layout.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <WalletGuard>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <AppHeader />
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-900">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </WalletGuard>
    );
}
