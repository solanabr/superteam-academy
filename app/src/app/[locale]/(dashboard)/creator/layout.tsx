// app/src/app/[locale]/(dashboard)/creator/layout.tsx
"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pt-6">
        {/* Внутренняя навигация для Creator Studio */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Creator Studio</h1>
                <p className="text-muted-foreground mt-1">Build and publish your own courses.</p>
            </div>
            <nav className="flex gap-2 bg-muted p-1 rounded-lg">
                <Link 
                    href="/creator" 
                    className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", pathname === "/creator" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                    My Courses
                </Link>
                <Link 
                    href="/creator/new" 
                    className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", pathname.includes("/creator/new") ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                    Create New
                </Link>
            </nav>
        </div>
        {children}
    </div>
  );
}