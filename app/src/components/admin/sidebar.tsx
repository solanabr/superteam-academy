'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  BookOpen,
  Database,
  Lock,
  FileText,
  Activity,
  Clock,
  Sparkles,
  Layout,
  Bell,
  Megaphone,
  Code,
} from 'lucide-react';

interface AdminNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: 'default' | 'destructive' | 'secondary';
  section?: string;
}

const adminNavItems: AdminNavItem[] = [
  // Dashboard
  { title: 'Dashboard', href: '/admin-premium', icon: ShieldCheck, section: 'Main' },

  // Analytics & Monitoring
  {
    title: 'Analytics',
    href: '/admin-premium/analytics',
    icon: BarChart3,
    section: 'Analytics & Insights',
  },
  {
    title: 'Activity',
    href: '/admin-premium/activity',
    icon: Activity,
    section: 'Analytics & Insights',
  },

  // Content Management
  { title: 'Courses', href: '/admin-premium/courses', icon: BookOpen, section: 'Content' },
  { title: 'New Course', href: '/admin-premium/courses/new', icon: BookOpen, section: 'Content' },
  { title: 'Challenges', href: '/admin-premium/challenges', icon: Code, section: 'Content' },
  { title: 'Learning Tracks', href: '/admin-premium/tracks', icon: FileText, section: 'Content' },
  {
    title: 'Announcements',
    href: '/admin-premium/announcements',
    icon: Megaphone,
    section: 'Content',
  },
  { title: 'Social Proof', href: '/admin-premium/social-proof', icon: Sparkles, section: 'Content' },

  // System & Monitoring
  { title: 'Indexer Settings', href: '/admin-premium/indexer', icon: Database, section: 'System' },
  { title: 'Studio', href: '/admin-premium/studio', icon: Layout, section: 'System' },

  // Security & Audit
  { title: 'Access Control', href: '/admin-premium/access', icon: Lock, section: 'Security' },
  { title: 'Audit Logs', href: '/admin-premium/audit', icon: Clock, section: 'Security' },
  { title: 'Notifications', href: '/admin-premium/notifications', icon: Bell, section: 'Security' },
];

interface AdminSidebarProps {
  defaultCollapsed?: boolean;
}

export function AdminSidebar({ defaultCollapsed = false }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const NavLink = ({ item }: { item: AdminNavItem }) => {
    const isActive = mounted && (pathname === item.href || pathname.startsWith(item.href + '/'));

    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          'hover:bg-primary/10 hover:text-primary',
          isActive ? 'bg-primary/15 text-primary shadow-sm' : 'text-muted-foreground',
          isCollapsed && 'justify-center px-2'
        )}
      >
        <item.icon
          className={cn(
            'h-5 w-5 shrink-0 transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
          )}
        />
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span
                className={cn(
                  'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                  item.badgeVariant === 'destructive'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-primary/20 text-primary'
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.title}
            {item.badge && (
              <span className="bg-primary/20 text-primary flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold">
                {item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  const sections = Array.from(
    new Map(adminNavItems.map((item) => [item.section || 'Other', item.section || 'Other']))
  ).map(([key]) => key);

  return (
    <aside
      className={cn(
        'bg-card/50 border-border/50 relative flex h-dvh flex-col overflow-hidden border-r backdrop-blur-xl transition-all duration-300',
        'from-card/30 to-card/10 bg-gradient-to-b',
        isCollapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Logo Section */}
      <div
        className={cn(
          'border-border/50 flex h-16 items-center border-b px-4 backdrop-blur-sm',
          isCollapsed ? 'justify-center' : 'gap-3'
        )}
      >
        <Link href="/admin-premium" className="flex items-center gap-3">
          <div className="bg-primary/10 border-primary/20 flex h-9 w-9 items-center justify-center rounded-xl border">
            <ShieldCheck className="text-primary h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">Admin</span>
              <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
                Premium
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-6 pb-4">
          {sections.map((section) => {
            const sectionItems = adminNavItems.filter((item) => item.section === section);
            return (
              <div key={section} className="space-y-1">
                {!isCollapsed && (
                  <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
                    {section}
                  </p>
                )}
                {sectionItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="border-border bg-background hover:bg-primary/10 absolute top-20 -right-3 h-6 w-6 rounded-full border shadow-md"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </aside>
  );
}
