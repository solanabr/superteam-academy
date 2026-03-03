import { WalletGuard } from "@/components/app/WalletGuard";
import { AppSidebar } from "@/components/app/Sidebar";
import { AppHeader } from "@/components/app/AppHeader";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { AdminAuthProvider } from "@/providers/AdminAuthProvider";

/**
 * Main app layout: dashboard, courses, discussions, certificates, settings, profile, leaderboard, admin.
 * Only used by routes under (app). Do not use test-page-only behavior here; /test has its own layout.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <WalletGuard>
            <AdminAuthProvider>
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset className="floating-content-panel overflow-hidden md:m-2">
                        <div className="flex flex-1 flex-col min-h-0">
                            <AppHeader />
                            <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 bg-transparent min-h-0">
                                {children}
                            </div>
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </AdminAuthProvider>
        </WalletGuard>
    );
}
