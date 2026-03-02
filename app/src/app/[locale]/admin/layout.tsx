// app/src/app/[locale]/admin/layout.tsx
import { AdminGuard } from "@/components/admin-guard";
import { Link } from "@/i18n/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { BarChart3, BookOpen, Users, LayoutDashboard } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
        <div className="flex min-h-screen bg-muted/20">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r bg-background flex flex-col">
                <div className="h-16 flex items-center px-6 border-b font-bold text-lg text-primary">
                    Academy Admin
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors">
                        <LayoutDashboard className="h-4 w-4" /> Overview
                    </Link>
                    <Link href="/admin/courses" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors">
                        <BookOpen className="h-4 w-4" /> Manage Courses
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors">
                        <Users className="h-4 w-4" /> User Management
                    </Link>
                </nav>
                <div className="p-4 border-t">
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">← Back to App</Link>
                </div>
            </aside>

            {/* Admin Content */}
            <main className="flex-1 flex flex-col">
                <header className="h-16 border-b bg-background flex items-center justify-end px-6">
                    <ModeToggle />
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    </AdminGuard>
  );
}