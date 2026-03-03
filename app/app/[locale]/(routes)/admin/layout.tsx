/**
 * Admin layout — server component.
 * Forces dark theme + system fonts. Validates admin access.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { isAdmin } from '@/backend/admin/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

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
        <div
            className="dark"
            style={{
                display: 'flex',
                minHeight: '100vh',
                background: '#0a0a14',
                color: '#ccc',
                fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
                fontSize: '14px',
            }}
        >
            <AdminSidebar />
            <main
                style={{
                    flex: 1,
                    padding: '24px 32px',
                    overflowY: 'auto',
                    maxWidth: '1200px',
                }}
            >
                {children}
            </main>
        </div>
    );
}
