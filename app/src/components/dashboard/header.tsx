'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, truncateAddress } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Sun,
  Moon,
  Flame,
  Zap,
  ChevronDown,
  Sparkles,
  BookOpen,
  Trophy,
  MessageSquare,
  ShieldCheck,
  Wallet,
  Power,
} from 'lucide-react';
import { useAuth } from '@/components/providers';
import { useWalletContext } from '@/components/providers/wallet-provider';
import { useThemeContext } from '@/components/providers/theme-provider';
import { useTranslation } from '@/hooks';

// Helper function to get user initials
function getUserInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface DashboardHeaderProps {
  className?: string;
}

export function DashboardHeader({ className }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useThemeContext();
  const { user, signOutUser, connectWallet, walletConnecting } = useAuth();
  const { t } = useTranslation();
  const { connected, publicKey, connect, connecting } = useWalletContext();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userStats, setUserStats] = useState({ xp: 0, streak: 0, level: 1 });
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const isAdminUser = (() => {
    const roleValue = (user as { role?: string | string[] | null } | null)?.role;

    if (!roleValue) return false;

    if (Array.isArray(roleValue)) {
      return roleValue.includes('admin') || roleValue.includes('super_admin');
    }

    return roleValue === 'admin' || roleValue === 'super_admin';
  })();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch notifications and user stats
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const [allNotificationsResponse, unreadNotificationsResponse] = await Promise.all([
          fetch('/api/notifications?unread=false'),
          fetch('/api/notifications?unread=true'),
        ]);

        if (allNotificationsResponse.ok) {
          const data = await allNotificationsResponse.json();
          setNotifications((data.notifications || []).slice(0, 5));
        }

        if (unreadNotificationsResponse.ok) {
          const unreadData = await unreadNotificationsResponse.json();
          setUnreadCount(unreadData.notifications?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    const fetchUserStats = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const data = await response.json();
          const xp =
            data.userProgress?.totalXP ??
            data.userProgress?.totalXp ??
            data.xp?.total ??
            data.xp?.totalXP ??
            0;
          const streak =
            data.userProgress?.currentStreak ??
            data.streakData?.currentStreak ??
            data.streak?.currentStreak ??
            data.streak?.current ??
            0;
          const level = data.userProgress?.level ?? data.xp?.level ?? 1;

          setUserStats({
            xp,
            streak,
            level,
          });
          return;
        }

        const fallbackResponse = await fetch('/api/gamification');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackXp =
            fallbackData.xp?.total ?? fallbackData.xp?.totalXP ?? fallbackData.totalXP ?? 0;
          const fallbackStreak =
            fallbackData.streak?.currentStreak ??
            fallbackData.streak?.current ??
            fallbackData.currentStreak ??
            0;
          const fallbackLevel = fallbackData.xp?.level ?? fallbackData.level ?? 1;

          setUserStats({
            xp: fallbackXp,
            streak: fallbackStreak,
            level: fallbackLevel,
          });
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchNotifications();
    fetchUserStats();
  }, [user]);

  // Handle wallet connection
  const handleConnect = async () => {
    await connectWallet();
  };

  // Handle wallet disconnect
  const handleDisconnect = () => {
    void signOutUser();
  };

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Simple search through Sanity courses
      const response = await fetch(`/api/sanity/courses`);
      if (response.ok) {
        const courses = await response.json();
        const filtered = courses
          .filter(
            (course: any) =>
              course.title?.toLowerCase().includes(query.toLowerCase()) ||
              course.description?.toLowerCase().includes(query.toLowerCase())
          )
          .map((course: any) => ({
            type: 'course',
            title: course.title,
            href: `/courses/${course.slug?.current || course._id}`,
          }))
          .slice(0, 5);
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  // Get page title from pathname
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Dashboard';
    const lastSegment = segments[segments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
  };

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => ({
      name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      href: '/' + segments.slice(0, index + 1).join('/'),
    }));
  };

  const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'course':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'social':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <header
      className={cn(
        'bg-background/80 border-border/50 sticky top-0 z-40 flex h-16 items-center justify-between border-b px-6 backdrop-blur-xl',
        className
      )}
    >
      {/* Left: Breadcrumb and Title */}
      <div className="flex flex-col">
        <nav className="text-muted-foreground flex items-center gap-1 text-xs">
          {getBreadcrumbs().map((crumb, index) => (
            <span key={crumb.href} className="flex items-center">
              {index > 0 && <span className="mx-1">/</span>}
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.name}
              </Link>
            </span>
          ))}
        </nav>
        <h1 className="text-lg font-semibold tracking-tight">{getPageTitle()}</h1>
      </div>

      {/* Center: Search */}
      <div className="mx-auto hidden max-w-md flex-1 px-8 lg:block">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="bg-muted/50 hover:bg-muted text-muted-foreground w-full justify-start text-sm"
            >
              <Search className="mr-2 h-4 w-4" />
              <span>{t('dashboard.searchPlaceholder')}</span>
              <kbd className="bg-background ml-auto hidden rounded border px-1.5 font-mono text-[10px] font-medium opacity-60 sm:inline-flex">
                ⌘K
              </kbd>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="center">
            <Command>
              <CommandInput
                placeholder={t('dashboard.searchInputPlaceholder')}
                value={searchQuery}
                onValueChange={handleSearch}
              />
              <CommandList>
                <CommandEmpty>{t('dashboard.searchEmpty')}</CommandEmpty>
                {searchResults.length > 0 && (
                  <>
                    <CommandGroup heading={t('nav.courses')}>
                      {searchResults
                        .filter((r) => r.type === 'course')
                        .map((result) => (
                          <CommandItem key={result.href} asChild>
                            <Link href={result.href} className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              {result.title}
                            </Link>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandGroup heading={t('dashboard.lessons')}>
                      {searchResults
                        .filter((r) => r.type === 'lesson')
                        .map((result) => (
                          <CommandItem key={result.href} asChild>
                            <Link href={result.href} className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              {result.title}
                            </Link>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Right: Stats, Notifications, User Menu */}
      <div className="flex items-center gap-2">
        {/* Quick Stats */}
        <div className="mr-4 hidden items-center gap-4 lg:flex">
          <div className="flex items-center gap-1.5">
            <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
              <Zap className="text-primary h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold">{userStats.xp.toLocaleString()}</span>
              <span className="text-muted-foreground text-[10px]">{t('dashboard.xp')}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold">{userStats.streak}</span>
              <span className="text-muted-foreground text-[10px]">{t('dashboard.streak')}</span>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground h-9 w-9"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {mounted && resolvedTheme === 'dark' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span className="sr-only">{t('admin.toggleTheme')}</span>
        </Button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground relative h-9 w-9"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="bg-destructive absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">{t('admin.notifications')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="border-border flex items-center justify-between border-b p-4">
              <h4 className="font-semibold">{t('admin.notifications')}</h4>
              <Button variant="ghost" size="sm" className="text-primary h-auto p-0 text-xs">
                {t('admin.markAllRead')}
              </Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                  <p className="text-muted-foreground text-sm">{t('admin.noNotificationsYet')}</p>
                </div>
              ) : (
                notifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'border-border flex gap-3 border-b p-4 last:border-0',
                      !notification.isRead && 'bg-muted/50'
                    )}
                  >
                    <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                      <NotificationIcon type={notification.type} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-muted-foreground text-xs">{notification.message}</p>
                      <p className="text-muted-foreground mt-1 text-[10px]">
                        {notification.timestamp}
                      </p>
                    </div>
                    {!notification.isRead && <div className="bg-primary h-2 w-2 rounded-full" />}
                  </div>
                ))
              )}
            </div>
            <div className="border-border border-t p-2">
              <Button variant="ghost" className="w-full" size="sm" asChild>
                <Link href="/notifications">{t('admin.viewAllNotifications')}</Link>
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Menu / Connect Wallet */}
        {connected && publicKey ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hover:bg-muted/50 flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {publicKey.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start md:flex">
                  <span className="text-sm font-medium">{truncateAddress(publicKey)}</span>
                  <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                    {t('dashboard.level')} {userStats.level}
                    <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                      PRO
                    </Badge>
                  </span>
                </div>
                <ChevronDown className="text-muted-foreground hidden h-4 w-4 md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{truncateAddress(publicKey)}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    {t('nav.connectWallet')}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  {t('nav.profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('nav.settings')}
                </Link>
              </DropdownMenuItem>
              {isAdminUser && (
                <DropdownMenuItem asChild>
                  <Link href="/admin-premium" className="flex items-center">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {t('nav.adminDashboard')}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDisconnect} className="text-muted-foreground">
                <LogOut className="mr-2 h-4 w-4" />
                {t('nav.disconnect')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={signOutUser}
                className="text-destructive focus:text-destructive"
              >
                <Power className="mr-2 h-4 w-4" />
                {t('nav.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={handleConnect}
            size="sm"
            className="gap-2"
            disabled={connecting || walletConnecting}
          >
            {connecting || walletConnecting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t('auth.signin.connecting')}
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                {t('nav.connectWallet')}
              </>
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
