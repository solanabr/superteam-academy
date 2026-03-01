'use client';

import { useState, useCallback } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Award,
  BarChart3,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/achievements', label: 'Achievements', icon: Award },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/config', label: 'Config', icon: Settings2 },
];

function AdminNavLink({
  item,
  isActive,
  collapsed,
}: {
  item: AdminNavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive && 'bg-primary/10 text-primary',
        !isActive && 'text-muted-foreground',
        collapsed && 'justify-center px-2',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className={cn(
          'size-5 shrink-0 transition-colors',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground group-hover:text-accent-foreground',
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

export function AdminSidebar({ className }: { className?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r bg-background transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      {/* Admin Badge */}
      <div
        className={cn(
          'flex items-center border-b',
          collapsed ? 'justify-center px-2 py-3' : 'px-4 py-3',
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="default" className="text-[10px] px-1.5">
                A
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Admin Panel
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">
              Admin
            </Badge>
            <span className="text-sm font-semibold text-muted-foreground">
              Panel
            </span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav
          className={cn(
            'flex flex-col gap-1 py-4',
            collapsed ? 'px-2' : 'px-3',
          )}
          aria-label="Admin navigation"
        >
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <AdminNavLink
                key={item.href}
                item={item}
                isActive={isActive}
                collapsed={collapsed}
              />
            );
          })}
        </nav>
      </ScrollArea>

      <div className={cn('border-t', collapsed ? 'px-2 py-3' : 'px-3 py-4')}>
        <Separator className="mb-3" />
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          onClick={toggleCollapsed}
          className={cn('w-full', !collapsed && 'justify-start gap-2')}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <>
              <ChevronLeft className="size-4" />
              <span className="text-xs text-muted-foreground">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
