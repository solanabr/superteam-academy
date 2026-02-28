'use client';

import { useState, useCallback } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Zap,
  MessageSquare,
  User,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/courses', labelKey: 'courses', icon: BookOpen },
  { href: '/leaderboard', labelKey: 'leaderboard', icon: Trophy },
  { href: '/challenges', labelKey: 'challenges', icon: Zap },
  { href: '/community', labelKey: 'community', icon: MessageSquare },
  { href: '/profile', labelKey: 'profile', icon: User },
  { href: '/settings', labelKey: 'settings', icon: Settings2 },
];

interface XPData {
  currentXP: number;
  requiredXP: number;
  level: number;
}

// Placeholder XP data -- will be replaced with real data from on-chain state
const MOCK_XP: XPData = {
  currentXP: 2450,
  requiredXP: 5000,
  level: 7,
};

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

function SidebarNavItem({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const t = useTranslations('nav');
  const Icon = item.icon;
  const label = t(item.labelKey);

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
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

function XPProgressSection({
  xpData,
  collapsed,
}: {
  xpData: XPData;
  collapsed: boolean;
}) {
  const t = useTranslations('gamification');
  const progressPercent =
    xpData.requiredXP > 0
      ? Math.round((xpData.currentXP / xpData.requiredXP) * 100)
      : 0;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-1.5 px-2">
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {xpData.level}
            </Badge>
            <div className="h-12 w-1.5 rounded-full bg-primary/20 relative overflow-hidden">
              <div
                className="absolute bottom-0 w-full rounded-full bg-primary transition-all"
                style={{ height: `${progressPercent}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <div className="text-xs">
            <p className="font-medium">
              {t('level')} {xpData.level}
            </p>
            <p className="text-muted-foreground">
              {xpData.currentXP.toLocaleString()} /{' '}
              {xpData.requiredXP.toLocaleString()} {t('xp')}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="space-y-2 px-3">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {t('level')} {xpData.level}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {xpData.currentXP.toLocaleString()} /{' '}
          {xpData.requiredXP.toLocaleString()} {t('xp')}
        </span>
      </div>
      <Progress value={progressPercent} className="h-2" />
    </div>
  );
}

export function Sidebar({
  collapsed: controlledCollapsed,
  onCollapsedChange,
  className,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const pathname = usePathname();

  const collapsed = controlledCollapsed ?? internalCollapsed;

  const toggleCollapsed = useCallback(() => {
    const next = !collapsed;
    if (onCollapsedChange) {
      onCollapsedChange(next);
    } else {
      setInternalCollapsed(next);
    }
  }, [collapsed, onCollapsedChange]);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r bg-background transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      <ScrollArea className="flex-1">
        <nav
          className={cn('flex flex-col gap-1 py-4', collapsed ? 'px-2' : 'px-3')}
          aria-label="Platform navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <SidebarNavItem
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
        <XPProgressSection xpData={MOCK_XP} collapsed={collapsed} />

        <Separator className="my-3" />

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

/**
 * Mobile sidebar content for use inside a Sheet component.
 * Renders the same nav items but always in expanded state.
 */
export function SidebarMobileContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const t = useTranslations('nav');
  const tGamification = useTranslations('gamification');
  const pathname = usePathname();
  const progressPercent =
    MOCK_XP.requiredXP > 0
      ? Math.round((MOCK_XP.currentXP / MOCK_XP.requiredXP) * 100)
      : 0;

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Platform navigation">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const label = t(item.labelKey);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive && 'bg-primary/10 text-primary',
                  !isActive && 'text-muted-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn(
                    'size-5 shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t px-3 py-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {tGamification('level')} {MOCK_XP.level}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {MOCK_XP.currentXP.toLocaleString()} /{' '}
              {MOCK_XP.requiredXP.toLocaleString()} {tGamification('xp')}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>
    </div>
  );
}
