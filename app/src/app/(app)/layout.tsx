"use client";

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { SidebarProvider, useSidebar } from "@/components/layout/SidebarContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#fdfdfc] dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100">
        <DashboardSidebar />
        <AppContent>{children}</AppContent>
      </div>
    </SidebarProvider>
  );
}

function AppContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={`transition-all duration-300 ease-in-out pt-14 lg:pt-0 ${
        collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
      }`}
    >
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
