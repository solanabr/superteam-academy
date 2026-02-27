import { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';

export const metadata = {
  title: 'Admin Premium Dashboard | CapySolBuild',
  description: 'Comprehensive admin panel for managing CapySolBuild platform',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Admin Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Admin Header */}
          <AdminHeader />

          {/* Page Content */}
          <main className="from-background via-background to-muted/20 flex-1 overflow-y-auto bg-gradient-to-br">
            <div className="container py-8">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
