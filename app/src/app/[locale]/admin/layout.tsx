// app/src/app/[locale]/admin/layout.tsx
"use client"; // Добавили use client для хука usePathname

import { AdminGuard } from "@/components/admin-guard";
import { Link, usePathname } from "@/i18n/navigation"; // Импортируем usePathname
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher"; // Импортируем свитчер
import { BarChart3, BookOpen, Users, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils"; // Для склеивания классов

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // Получаем текущий путь (без локали!)

  return (
    <AdminGuard>
        <div className="flex min-h-screen bg-muted/20">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r bg-background flex flex-col">
                <div className="h-16 flex items-center px-6 border-b font-bold text-lg text-primary">
                    Academy Admin
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link 
                        href="/admin" 
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            pathname === "/admin" ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"
                        )}
                    >
                        <LayoutDashboard className="h-4 w-4" /> Overview
                    </Link>
                    <Link 
                        href="/admin/courses" 
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            pathname.startsWith("/admin/courses") ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"
                        )}
                    >
                        <BookOpen className="h-4 w-4" /> Manage Courses
                    </Link>
                    <Link 
                        href="/admin/users" 
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            pathname.startsWith("/admin/users") ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"
                        )}
                    >
                        <Users className="h-4 w-4" /> Users
                    </Link>
                </nav>
                <div className="p-4 border-t">
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">← Back to App</Link>
                </div>
            </aside>

            {/* Admin Content */}
            <main className="flex-1 flex flex-col">
                <header className="h-16 border-b bg-background flex items-center justify-end px-6 gap-4">
                    
                    <ModeToggle />
                    <LanguageSwitcher /> 
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    </AdminGuard>
  );
}