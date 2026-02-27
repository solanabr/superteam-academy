"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { LogoLoader } from '@/components/ui/logo-loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  BookOpen,
  Database,
  Settings2,
  Route,
  Lock,
  Zap,
  AlertCircle,
  ArrowRight,
  Activity,
  BookMarked,
  Clock,
  Sparkles,
  Layout,
} from 'lucide-react';

interface AdminDashboardData {
  stats: {
    totalCourses: number;
    activeUsers: number;
    growthRate: number;
    completionRate: number;
  };
  snapshot: {
    totalUsers: number;
    totalEnrollments: number;
    totalChallenges: number;
    totalNotifications: number;
  };
  lastUpdatedAt: string;
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value
  );
}

export default function AdminPremiumDashboard() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard', { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load dashboard data');
      }

      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch admin dashboard data:', error);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !dashboardData) {
    return (
      <div className="bg-background fixed inset-0 z-50 flex items-center justify-center">
        <LogoLoader size="2xl" message="Loading..." />
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Courses',
      value: dashboardData ? formatCompact(dashboardData.stats.totalCourses) : '—',
      change: 'Created',
      icon: BookOpen,
      href: '/admin-premium/courses',
    },
    {
      title: 'Active Users',
      value: dashboardData ? formatCompact(dashboardData.stats.activeUsers) : '—',
      change: 'Last 30 days',
      icon: Activity,
      href: '/admin-premium/analytics',
    },
    {
      title: 'Challenges',
      value: dashboardData ? `${dashboardData.stats.growthRate}%` : '—',
      change: 'Users vs previous 30 days',
      icon: TrendingUp,
      href: '/admin-premium/challenges',
    },
    {
      title: 'Completion Rate',
      value: dashboardData ? `${dashboardData.stats.completionRate}%` : '—',
      change: 'Course enrollments',
      icon: BookMarked,
      href: '/admin-premium/analytics',
    },
  ];

  const adminSections = [
    {
      title: 'Analytics & Insights',
      description: 'Monitor user engagement, challenges, and activity',
      icon: BarChart3,
      links: [
        { title: 'Analytics Dashboard', href: '/admin-premium/analytics', icon: BarChart3 },
        { title: 'Activity Tracking', href: '/admin-premium/activity', icon: Activity },
        { title: 'Challenges', href: '/admin-premium/challenges', icon: TrendingUp },
      ],
    },
    {
      title: 'Content Management',
      description: 'Manage courses, learning tracks, and testimonials',
      icon: BookOpen,
      links: [
        { title: 'Courses', href: '/admin-premium/courses', icon: BookOpen },
        { title: 'Learning Tracks', href: '/admin-premium/tracks', icon: Route },
        { title: 'Social Proof', href: '/admin-premium/social-proof', icon: Sparkles },
      ],
    },
    {
      title: 'System & Configuration',
      description: 'Manage indexer, performance, and system settings',
      icon: Database,
      links: [
        { title: 'Indexer Settings', href: '/admin-premium/indexer', icon: Database },
        { title: 'Performance', href: '/admin-premium/performance', icon: Zap },
        { title: 'Settings', href: '/admin-premium/settings', icon: Settings2 },
      ],
    },
    {
      title: 'Security & Audit',
      description: 'Access control, audit logs, and system alerts',
      icon: Lock,
      links: [
        { title: 'Access Control', href: '/admin-premium/access', icon: Lock },
        { title: 'Audit Logs', href: '/admin-premium/audit', icon: Clock },
        { title: 'Alerts', href: '/admin-premium/alerts', icon: AlertCircle },
      ],
    },
    {
      title: 'Studio & Tools',
      description: 'Advanced tools and content studio',
      icon: Layout,
      links: [{ title: 'Studio', href: '/admin-premium/studio', icon: Layout }],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Premium Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Complete platform management and monitoring center
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:border-primary/50 cursor-pointer transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="text-primary h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-primary mt-1 text-xs font-medium">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Admin Sections */}
      <div className="space-y-8">
        {adminSections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <div key={section.title} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <SectionIcon className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{section.title}</h2>
                  <p className="text-muted-foreground text-sm">{section.description}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {section.links.map((link) => {
                  const LinkIcon = link.icon;
                  return (
                    <Link key={link.href} href={link.href}>
                      <Card className="hover:border-primary/50 h-full cursor-pointer transition-all hover:shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <LinkIcon className="text-primary h-5 w-5" />
                            {link.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Button
                            variant="ghost"
                            className="text-primary hover:text-primary h-auto gap-2 p-0 hover:bg-transparent"
                            asChild
                          >
                            <span>
                              Open
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used admin tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/admin-premium/courses/new">
                <BookOpen className="h-4 w-4" />
                New Course
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/admin-premium/access">
                <Lock className="h-4 w-4" />
                Manage Access
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/admin-premium/analytics">
                <BarChart3 className="h-4 w-4" />
                View Analytics
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/admin-premium/audit">
                <Clock className="h-4 w-4" />
                Audit Logs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Database Snapshot</CardTitle>
          <CardDescription>Live totals loaded from MongoDB</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Users</span>
              <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                {loading || !dashboardData ? '—' : dashboardData.snapshot.totalUsers.toLocaleString()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enrollments</span>
              <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                {loading || !dashboardData
                  ? '—'
                  : dashboardData.snapshot.totalEnrollments.toLocaleString()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Challenges</span>
              <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                {loading || !dashboardData
                  ? '—'
                  : dashboardData.snapshot.totalChallenges.toLocaleString()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Notifications</span>
              <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                {loading || !dashboardData
                  ? '—'
                  : dashboardData.snapshot.totalNotifications.toLocaleString()}
              </Badge>
            </div>

            <p className="text-muted-foreground text-xs">
              {dashboardData?.lastUpdatedAt
                ? `Last updated: ${new Date(dashboardData.lastUpdatedAt).toLocaleString()}`
                : 'Waiting for data...'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
