/**
 * Admin layout — server component.
 *
 * Validates admin access via session check, redirects unauthorized users.
 * Renders AdminSidebar + main content area.
 * Wraps children in WalletProvider so on-chain admin actions can access wallet.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { isAdmin } from '@/backend/admin/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { WalletProvider } from '@/app/providers/WalletProvider';

export const metadata = {
    title: 'Admin — Superteam Academy',
    description: 'Platform management dashboard',
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/en/login');
    }

    if (!(await isAdmin(session))) {
        redirect('/en/dashboard');
    }

    return (
        <WalletProvider>
            <div
                style={{
                    display: 'flex',
                    height: '100vh',
                    overflow: 'hidden',
                    background: '#0a0a1a',
                    color: '#fff',
                    fontFamily: 'var(--font-geist-sans), sans-serif',
                }}
            >
                <AdminSidebar />
                <main
                    style={{
                        flex: 1,
                        padding: '32px 40px',
                        overflowY: 'auto',
                    }}
                >
                    {children}
                </main>
            </div>
        </WalletProvider>
    );
}
