import { WalletGuard } from "@/components/app/WalletGuard";
import { Sidebar } from "@/components/app/Sidebar";
import { AppHeader } from "@/components/app/AppHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <WalletGuard>
            <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <AppHeader />
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </WalletGuard>
    );
}
