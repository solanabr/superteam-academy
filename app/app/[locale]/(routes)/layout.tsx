/**
 * Routes layout — wraps authenticated/app pages with providers.
 *
 * Heavy providers (Solana wallet, Auth, React Query) are loaded here
 * instead of in the locale layout, so the public landing page doesn't
 * pull in ~208 KiB of unused JS.
 */

import { AuthProvider } from '@/app/providers/AuthProvider';
import { WalletProvider } from '@/app/providers/WalletProvider';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { NotificationProvider } from '@/context/stores/notificationStore';
import { ToastProvider } from '@/app/providers/ToastProvider';

export default function RoutesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <QueryProvider>
            <WalletProvider>
                <AuthProvider>
                    <NotificationProvider>
                        {children}
                        <ToastProvider />
                    </NotificationProvider>
                </AuthProvider>
            </WalletProvider>
        </QueryProvider>
    );
}
