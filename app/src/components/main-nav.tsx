// app/src/components/main-nav.tsx
import { Link, usePathname } from "@/i18n/navigation";
import { LayoutDashboard, GraduationCap, Trophy, Settings, MessageSquare, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Courses", href: "/courses", icon: GraduationCap },
  { title: "Forum", href: "/forum", icon: MessageSquare },
  { title: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex flex-col h-full", className)}>
        <nav className="flex flex-col space-y-2 flex-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-foreground/70"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Отдельная кнопка Creator Studio внизу */}
        <div className="mt-auto pt-4 border-t">
             <Link
              href="/creator"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-all bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border border-purple-500/20",
                pathname.startsWith("/creator") ? "bg-purple-500 text-white" : ""
              )}
            >
              <PenTool className="h-4 w-4" />
              Creator Studio
            </Link>
        </div>
    </div>
  );
}