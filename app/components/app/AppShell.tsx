"use client";

import { AdminAuthProvider } from "@/providers/AdminAuthProvider";
import { AppSidebar } from "@/components/app/Sidebar";
import { AppHeader } from "@/components/app/AppHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Wraps children with sidebar + app header (same chrome as (app) layout).
 * Use when a public page should show the app shell when the user is connected.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
