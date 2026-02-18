import { PlatformNavbar } from "@/components/navigation/PlatformNavbar";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="flex flex-col min-h-screen bg-void text-text-primary">
                {/* Noise Texture Overlay */}
                <div className="fixed inset-0 pointer-events-none bg-noise opacity-30 z-50"></div>

                {/* Background Gradients */}
                <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-solana/5 blur-[120px] pointer-events-none z-0"></div>
                <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rust/5 blur-[100px] pointer-events-none z-0"></div>

                <PlatformNavbar />

                <main className="relative z-10 flex-1 pt-16">
                    {children}
                </main>
            </div>
        </AuthGuard>
    );
}
