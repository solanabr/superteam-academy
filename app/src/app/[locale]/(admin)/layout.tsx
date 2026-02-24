import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s | Admin | Superteam Academy',
  },
};

/**
 * Admin layout with dedicated admin sidebar navigation.
 * Access control is enforced at the page level via wallet authority checks.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
