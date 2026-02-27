'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { localeNames, type Locale } from '@/locales';
import {
  Search,
  Bell,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  Shield,
  ArrowUpRight,
  Command,
  Globe,
  Check,
} from 'lucide-react';
import { useAuth, useThemeContext } from '@/components/providers';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks';

function getInitials(name?: string | null): string {
  if (!name) return 'AD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AdminHeaderProps {
  className?: string;
}

export function AdminHeader({ className }: AdminHeaderProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useThemeContext();
  const { user, signOutUser } = useAuth();
  const { t, locale, setLocale } = useTranslation();
  const [adminStats, setAdminStats] = useState({
    activeUsers: 0,
    totalCourses: 0,
    completedLessons: 0,
    systemHealth: 100,
  });
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchAdminStats = async () => {
      try {
        const response = await fetch('/api/admin/analytics/user-stats');
        if (response.ok) {
          const data = await response.json();
          setAdminStats({
            activeUsers: data.activeUsers?.last7Days || 0,
            totalCourses: data.totalCourses || 0,
            completedLessons: data.courseStats?.totalCoursesCompleted || 0,
            systemHealth: 100, // Placeholder
          });
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      }
    };

    fetchAdminStats();
  }, [user]);

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
        console.error('Error fetching admin notifications:', error);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', notificationId: 'all' }),
      });

      if (!response.ok) return;

      setUnreadCount(0);
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    return segments[segments.length - 1]?.replace(/-/g, ' ') || 'Dashboard';
  };

  return (
    <header
      className={cn(
        'border-border/50 bg-card/30 flex h-16 items-center justify-between border-b px-6 backdrop-blur-xl',
        'from-card/40 via-card/30 to-background/50 bg-gradient-to-r',
        className
      )}
    >
      {/* Left Section - Breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Shield className="text-primary h-5 w-5" />
          <h2 className="text-sm font-semibold capitalize">{getPageTitle()}</h2>
        </div>

        {/* Quick Stats */}
        {mounted && (
          <div className="border-border/50 ml-6 flex items-center gap-6 border-l pl-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">{t('admin.activeUsers7d')}</span>
              <span className="text-sm font-semibold">{adminStats.activeUsers}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">{t('admin.totalCourses')}</span>
              <span className="text-sm font-semibold">{adminStats.totalCourses}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">{t('admin.systemHealth')}</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold">{adminStats.systemHealth}%</span>
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:flex">
          <Input
            placeholder={t('admin.searchPlaceholder')}
            className="border-border/50 bg-background/50 placeholder:text-muted-foreground focus:bg-background h-9 w-64 rounded-lg pl-10"
          />
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
        </div>

        {/* Quick Access */}
        <Button variant="ghost" size="icon" className="relative">
          <Command className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>{t('admin.notifications')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-2 px-2 py-2">
              {notifications.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-muted-foreground text-xs">{t('admin.noNotificationsYet')}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'hover:bg-muted/50 flex items-start gap-3 rounded-lg p-2',
                      !notification.isRead && 'bg-muted/40'
                    )}
                  >
                    <div
                      className={cn(
                        'mt-1.5 h-2 w-2 rounded-full',
                        notification.isRead ? 'bg-muted-foreground/30' : 'bg-primary'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-medium">{notification.title}</p>
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {notification.message}
                      </p>
                      <p className="text-muted-foreground mt-1 text-[10px]">
                        {notification.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleMarkAllRead} className="text-xs">
              {t('admin.markAllRead')}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="text-xs">
                {t('admin.viewAllNotifications')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {mounted ? (
            resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )
          ) : (
            <div className="h-5 w-5" />
          )}
        </Button>

        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => setLocale('en')}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">🇺🇸 {localeNames.en}</span>
              {locale === 'en' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLocale('pt-br' as Locale)}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">🇧🇷 {localeNames['pt-br']}</span>
              {locale === 'pt-br' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLocale('es')}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">🇪🇸 {localeNames.es}</span>
              {locale === 'es' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pr-3 pl-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image || undefined} />
                <AvatarFallback>{mounted && getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden flex-1 flex-col items-start gap-0 sm:flex">
                <span className="text-xs leading-none font-semibold">{user?.name || 'Admin'}</span>
                <span className="text-muted-foreground text-[10px] leading-none">{t('admin.admin')}</span>
              </div>
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span>{user?.name || t('admin.admin')}</span>
              <span className="text-muted-foreground text-xs font-normal">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin-premium/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t('admin.adminSettings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <span>{t('nav.profile')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOutUser()}
              className="text-destructive flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t('nav.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
