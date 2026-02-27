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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWalletContext } from '@/components/providers/wallet-provider';
import { useTranslation } from '@/hooks';
import { type Locale, localeNames } from '@/locales';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Award,
  User,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Flame,
  Target,
  BarChart3,
  MessageSquare,
  Bell,
  Wallet,
  ShieldCheck,
  Globe,
  Check,
} from 'lucide-react';

interface NavItem {
  titleKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: 'default' | 'destructive' | 'secondary';
}

const mainNavItems: NavItem[] = [
  { titleKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { titleKey: 'sidebar.myCourses', href: '/courses', icon: BookOpen },
  { titleKey: 'nav.discoverCourses', href: '/discover', icon: GraduationCap },
  { titleKey: 'nav.learningPaths', href: '/discover/paths', icon: Target },
  { titleKey: 'nav.challenges', href: '/challenges', icon: Flame },
  { titleKey: 'nav.leaderboard', href: '/leaderboard', icon: Trophy },
];

const secondaryNavItems: NavItem[] = [
  { titleKey: 'nav.analytics', href: '/analytics', icon: BarChart3 },
  { titleKey: 'nav.community', href: '/community', icon: MessageSquare },
  {
    titleKey: 'nav.notifications',
    href: '/notifications',
    icon: Bell,
    badgeVariant: 'destructive',
  },
];

const adminNavItems: NavItem[] = [
  { titleKey: 'nav.adminDashboard', href: '/admin', icon: ShieldCheck },
];

const bottomNavItems: NavItem[] = [
  { titleKey: 'nav.profile', href: '/profile', icon: User },
  { titleKey: 'nav.settings', href: '/settings', icon: Settings },
  { titleKey: 'nav.helpSupport', href: '/help', icon: HelpCircle },
];

interface SidebarProps {
  defaultCollapsed?: boolean;
}

export function DashboardSidebar({ defaultCollapsed = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [mounted, setMounted] = useState(false);
  const [sidebarCounts, setSidebarCounts] = useState({ courses: 0, unreadNotifications: 0 });
  const [hasNewChallenges, setHasNewChallenges] = useState(false);
  const pathname = usePathname();
  const { connected, address } = useWalletContext();
  const { t, locale, setLocale } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchSidebarCounts = async () => {
      try {
        const [dashboardRes, unreadNotificationsRes, challengesStatusRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/notifications?unread=true'),
          fetch('/api/challenges/status'),
        ]);

        const nextCounts = { courses: 0, unreadNotifications: 0 };

        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          nextCounts.courses = dashboardData.userProgress?.totalCourses || 0;
        }

        if (unreadNotificationsRes.ok) {
          const unreadData = await unreadNotificationsRes.json();
          nextCounts.unreadNotifications = unreadData.notifications?.length || 0;
        }

        if (challengesStatusRes.ok) {
          const challengesStatus = await challengesStatusRes.json();
          const latestChallengeCreatedAt = challengesStatus.latestChallengeCreatedAt as
            | string
            | null;

          if (latestChallengeCreatedAt) {
            const storageKey = 'lastSeenChallengeCreatedAt';
            const currentPathIsChallenges = pathname === '/challenges' || pathname.startsWith('/challenges/');

            if (currentPathIsChallenges) {
              localStorage.setItem(storageKey, latestChallengeCreatedAt);
              setHasNewChallenges(false);
            } else {
              const lastSeenChallengeCreatedAt = localStorage.getItem(storageKey);
              const isNewChallengeAdded =
                !lastSeenChallengeCreatedAt ||
                new Date(latestChallengeCreatedAt).getTime() >
                  new Date(lastSeenChallengeCreatedAt).getTime();
              setHasNewChallenges(isNewChallengeAdded);
            }
          } else {
            setHasNewChallenges(false);
          }
        }

        setSidebarCounts(nextCounts);
      } catch (error) {
        console.error('Error fetching sidebar counts:', error);
      }
    };

    if (mounted) {
      fetchSidebarCounts();
    }
  }, [mounted, pathname]);

  const resolvedMainNavItems = mainNavItems.map((item) => {
    if (item.href === '/courses') {
      return {
        ...item,
        badge: sidebarCounts.courses > 0 ? sidebarCounts.courses : undefined,
      };
    }

    if (item.href === '/challenges') {
      return {
        ...item,
        badge: hasNewChallenges ? 'New' : undefined,
      };
    }

    return item;
  });

  const resolvedSecondaryNavItems = secondaryNavItems.map((item) => {
    if (item.href === '/notifications') {
      return {
        ...item,
        badge: sidebarCounts.unreadNotifications > 0 ? sidebarCounts.unreadNotifications : undefined,
      };
    }

    return item;
  });

  const NavLink = ({ item }: { item: NavItem }) => {
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
            <span className="flex-1">{t(item.titleKey)}</span>
            {item.badge && (
              <span
                className={cn(
                  'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                  item.badgeVariant === 'destructive'
                    ? 'bg-destructive text-destructive-foreground'
                    : item.badgeVariant === 'secondary'
                      ? 'bg-secondary text-secondary-foreground'
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
            {t(item.titleKey)}
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
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <aside
      className={cn(
        'bg-card/50 border-border/50 relative flex h-dvh flex-col overflow-hidden border-r backdrop-blur-xl transition-all duration-300',
        isCollapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Logo Section */}
      <div
        className={cn(
          'border-border/50 flex h-16 items-center border-b px-4',
          isCollapsed ? 'justify-center' : 'gap-3'
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-xl">
            <Image src="/logo.png" alt="Logo" width={28} height={28} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">CapySolBuild</span>
              <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
                Academy
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1 pb-4">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
                {t('sidebar.sections.learning')}
              </p>
            )}
            {resolvedMainNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>

          {/* Secondary Navigation */}
          <div className="mt-6 space-y-1">
            {!isCollapsed && (
              <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
                {t('sidebar.sections.community')}
              </p>
            )}
            {resolvedSecondaryNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>

          {/* Account */}
          <div className="mt-6 space-y-1 border-t pt-4">
            {!isCollapsed && (
              <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
                {t('sidebar.sections.account')}
              </p>
            )}
            {bottomNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>

          {/* Wallet Connect - Compact */}
          {mounted && !isCollapsed && connected && address && (
            <div className="from-primary/10 to-secondary/10 mt-4 rounded-xl bg-gradient-to-r p-3">
              <div className="flex items-center gap-2">
                <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Wallet className="text-primary h-4 w-4" />
                </div>
                <div className="flex-1 truncate">
                  <p className="truncate text-xs font-medium">
                    {address.slice(0, 4)}...{address.slice(-4)}
                  </p>
                  <p className="text-muted-foreground text-[10px] capitalize">
                    {t('sidebar.devnet')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Language Switcher */}
          {mounted && !isCollapsed && (
            <div className="mt-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-sm"
                    size="sm"
                  >
                    <Globe className="h-4 w-4" />
                    {localeNames[locale]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => setLocale('en')}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">🇺🇸 English</span>
                    {locale === 'en' && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLocale('pt-br')}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">🇧🇷 Português</span>
                    {locale === 'pt-br' && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLocale('es')}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">🇪🇸 Español</span>
                    {locale === 'es' && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
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
