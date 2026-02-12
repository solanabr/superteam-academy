'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import {
  BookOpen,
  LayoutDashboard,
  Trophy,
  User,
  Settings,
  GraduationCap,
  BarChart3,
  Users,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

export function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = session?.user?.role as UserRole | undefined;

  const navItems: NavItem[] = [
    // Student items
    { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/courses', label: t('nav.courses'), icon: BookOpen },
    { href: '/leaderboard', label: t('nav.leaderboard'), icon: Trophy },
    { href: '/profile', label: t('nav.profile'), icon: User },
    { href: '/settings', label: t('nav.settings'), icon: Settings },
    // Professor items
    { href: '/teach/dashboard', label: t('teach.title'), icon: GraduationCap, roles: ['professor', 'admin'] },
    { href: '/teach/courses', label: t('teach.myCourses'), icon: BookOpen, roles: ['professor', 'admin'] },
    { href: '/teach/analytics', label: t('teach.analytics'), icon: BarChart3, roles: ['professor', 'admin'] },
    // Admin items
    { href: '/admin/dashboard', label: t('admin.title'), icon: Shield, roles: ['admin'] },
    { href: '/admin/users', label: t('admin.users'), icon: Users, roles: ['admin'] },
    { href: '/admin/courses', label: t('admin.courses'), icon: BookOpen, roles: ['admin'] },
    { href: '/admin/analytics', label: t('admin.analytics'), icon: BarChart3, roles: ['admin'] },
  ];

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return role && item.roles.includes(role);
  });

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
      <nav className="flex flex-col gap-1 p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
