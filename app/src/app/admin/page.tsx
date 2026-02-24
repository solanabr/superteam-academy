"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { PlatformLayout } from "@/components/layout";
import { AdminRoute } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { StatCard } from "@/components/admin/stat-card";
import { OverviewCharts } from "@/components/admin/overview-charts";
import { UserTable } from "@/components/admin/user-table";
import { CourseTable } from "@/components/admin/course-table";
import type { AnalyticsData } from "@/types/admin";
import {
  ShieldCheck,
  BookOpen,
  Clock,
  CheckCircle2,
  ArrowRight,
  FileText,
  Users,
  Zap,
  GraduationCap,
  Trophy,
  Activity,
  MessageSquare,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Wallet,
} from "lucide-react";

interface CourseSummary {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: number;
  trackId: number;
  lessonCount: number;
  status: string;
  submittedAt: string | null;
  creator: string;
  thumbnailUrl: string | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  pending_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function AdminPage() {
  const [pending, setPending] = useState<CourseSummary[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const getAuthHeaders = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;
    return { Authorization: `Bearer ${session.access_token}` };
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const res = await fetch("/api/admin/courses?status=pending_review", { headers });
      if (res.ok) {
        const { courses } = await res.json();
        setPending(courses ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const headers = await getAuthHeaders();
      if (!headers) return;
      const res = await fetch("/api/admin/analytics", { headers });
      if (res.ok) {
        const data: AnalyticsData = await res.json();
        setAnalytics(data);
      }
    } catch {
      // silent
    } finally {
      setAnalyticsLoading(false);
    }
  }, [getAuthHeaders]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchPending(), fetchAnalytics()]);
    setRefreshing(false);
  }, [fetchPending, fetchAnalytics]);

  useEffect(() => {
    fetchPending();
    fetchAnalytics();
  }, [fetchPending, fetchAnalytics]);

  const o = analytics?.overview;

  return (
    <AdminRoute>
      <PlatformLayout>
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-[1400px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                  Platform analytics, user management &amp; course review
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button asChild size="sm">
                <Link href="/admin/courses">
                  <FileText className="h-4 w-4 mr-2" />
                  Review Queue
                </Link>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-1.5" />
                Users
              </TabsTrigger>
              <TabsTrigger value="courses">
                <BookOpen className="h-4 w-4 mr-1.5" />
                Courses
              </TabsTrigger>
              <TabsTrigger value="review">
                <Clock className="h-4 w-4 mr-1.5" />
                Review
                {pending.length > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 h-5 px-1.5 text-[10px]"
                  >
                    {pending.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ─── OVERVIEW TAB ──────────────────────────── */}
            <TabsContent value="overview" className="space-y-6">
              {/* Primary KPIs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Users"
                  value={o?.totalUsers ?? 0}
                  icon={<Users className="h-4 w-4" />}
                  subtitle={`${o?.usersWithWallet ?? 0} with wallet`}
                  trend={
                    o
                      ? { value: o.newUsersLast30Days, label: "last 30 days" }
                      : undefined
                  }
                  loading={analyticsLoading}
                />
                <StatCard
                  label="Active Users (7d)"
                  value={o?.activeUsersLast7Days ?? 0}
                  icon={<Activity className="h-4 w-4" />}
                  subtitle={
                    o && o.totalUsers > 0
                      ? `${Math.round((o.activeUsersLast7Days / o.totalUsers) * 100)}% of total`
                      : undefined
                  }
                  loading={analyticsLoading}
                />
                <StatCard
                  label="Total Enrollments"
                  value={o?.totalEnrollments ?? 0}
                  icon={<BookOpen className="h-4 w-4" />}
                  subtitle={`${o?.completionRate ?? 0}% completion rate`}
                  loading={analyticsLoading}
                />
                <StatCard
                  label="Total XP Distributed"
                  value={o ? o.totalXpEarned.toLocaleString() : 0}
                  icon={<Zap className="h-4 w-4" />}
                  subtitle={`${o?.totalLessonsCompleted?.toLocaleString() ?? 0} lessons completed`}
                  loading={analyticsLoading}
                />
              </div>

              {/* Secondary KPIs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard
                  label="Courses"
                  value={o?.totalCourses ?? 0}
                  icon={<BookOpen className="h-4 w-4" />}
                  subtitle={`${o?.approvedCourses ?? 0} approved`}
                  loading={analyticsLoading}
                />
                <StatCard
                  label="Completions"
                  value={o?.totalCompletions ?? 0}
                  icon={<GraduationCap className="h-4 w-4" />}
                  loading={analyticsLoading}
                />
                <StatCard
                  label="Finalizations"
                  value={o?.totalFinalizations ?? 0}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  loading={analyticsLoading}
                />
                <StatCard
                  label="Achievements"
                  value={o?.totalAchievementsEarned ?? 0}
                  icon={<Trophy className="h-4 w-4" />}
                  loading={analyticsLoading}
                />
                <StatCard
                  label="Comments"
                  value={o?.totalComments ?? 0}
                  icon={<MessageSquare className="h-4 w-4" />}
                  loading={analyticsLoading}
                />
              </div>

              {/* Charts */}
              <OverviewCharts data={analytics} loading={analyticsLoading} />

              {/* Top users preview */}
              <div className="rounded-xl border bg-card p-6">
                <UserTable
                  users={analytics?.topUsersByXp ?? []}
                  loading={analyticsLoading}
                  title="Top Users by XP"
                  description="Most engaged learners ranked by experience points earned"
                />
              </div>
            </TabsContent>

            {/* ─── USERS TAB ─────────────────────────────── */}
            <TabsContent value="users" className="space-y-6">
              {/* User KPIs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Users"
                  value={o?.totalUsers ?? 0}
                  icon={<Users className="h-4 w-4" />}
                  loading={analyticsLoading}
                />
                <StatCard
                  label="Onboarded"
                  value={o?.onboardedUsers ?? 0}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  subtitle={
                    o && o.totalUsers > 0
                      ? `${Math.round((o.onboardedUsers / o.totalUsers) * 100)}% of users`
                      : undefined
                  }
                  loading={analyticsLoading}
                />
                <StatCard
                  label="With Wallet"
                  value={o?.usersWithWallet ?? 0}
                  icon={<Wallet className="h-4 w-4" />}
                  subtitle={
                    o && o.totalUsers > 0
                      ? `${Math.round((o.usersWithWallet / o.totalUsers) * 100)}% linked`
                      : undefined
                  }
                  loading={analyticsLoading}
                />
                <StatCard
                  label="New (30d)"
                  value={o?.newUsersLast30Days ?? 0}
                  icon={<TrendingUp className="h-4 w-4" />}
                  loading={analyticsLoading}
                />
              </div>

              {/* All users table */}
              <div className="rounded-xl border bg-card p-6">
                <UserTable
                  users={analytics?.allUsers ?? []}
                  loading={analyticsLoading}
                  title="All Users"
                  description="Complete list of all platform users with engagement metrics"
                  showAll
                />
              </div>

              {/* Most active by lessons */}
              <div className="rounded-xl border bg-card p-6">
                <UserTable
                  users={analytics?.topUsersByLessons ?? []}
                  loading={analyticsLoading}
                  title="Top Users by Lessons Completed"
                  description="Users who have completed the most lessons"
                />
              </div>

              {/* Most active by activity */}
              <div className="rounded-xl border bg-card p-6">
                <UserTable
                  users={analytics?.topUsersByActivity ?? []}
                  loading={analyticsLoading}
                  title="Most Active Users"
                  description="Users with the highest activity count across the platform"
                />
              </div>

              {/* Users with streaks */}
              <div className="rounded-xl border bg-card p-6">
                <UserTable
                  users={analytics?.usersWithStreaks ?? []}
                  loading={analyticsLoading}
                  title="Active Streaks"
                  description="Users currently maintaining learning streaks"
                />
              </div>
            </TabsContent>

            {/* ─── COURSES TAB ───────────────────────────── */}
            <TabsContent value="courses" className="space-y-6">
              {/* Course KPIs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Courses"
                  value={o?.totalCourses ?? 0}
                  icon={<BookOpen className="h-4 w-4" />}
                  loading={analyticsLoading}
                />
                <StatCard
                  label="Approved"
                  value={o?.approvedCourses ?? 0}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  loading={analyticsLoading}
                />
                <StatCard
                  label="Pending Review"
                  value={o?.pendingCourses ?? 0}
                  icon={<Clock className="h-4 w-4" />}
                  loading={analyticsLoading}
                />
                <StatCard
                  label="Avg Completion Rate"
                  value={`${o?.completionRate ?? 0}%`}
                  icon={<TrendingUp className="h-4 w-4" />}
                  loading={analyticsLoading}
                />
              </div>

              {/* Course table */}
              <div className="rounded-xl border bg-card p-6">
                <CourseTable
                  courses={analytics?.courseStats ?? []}
                  loading={analyticsLoading}
                />
              </div>

              {/* Users per course bar visualization */}
              <div className="rounded-xl border bg-card p-6">
                <h3 className="text-lg font-semibold mb-1">Users per Course</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enrollment vs completion breakdown
                </p>
                {analyticsLoading ? (
                  <Skeleton className="h-40 w-full rounded-lg" />
                ) : (
                  <div className="space-y-3">
                    {(analytics?.usersPerCourse ?? [])
                      .filter((c) => c.enrollments > 0)
                      .map((course) => {
                        const maxEnrollments = Math.max(
                          ...(analytics?.usersPerCourse ?? []).map((c) => c.enrollments),
                          1,
                        );
                        return (
                          <div key={course.courseId} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="truncate max-w-[60%] font-medium">
                                {course.title}
                              </span>
                              <span className="text-muted-foreground tabular-nums">
                                {course.completions}/{course.enrollments}
                              </span>
                            </div>
                            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                              <div
                                className="absolute inset-y-0 left-0 bg-primary/30 rounded-full"
                                style={{
                                  width: `${(course.enrollments / maxEnrollments) * 100}%`,
                                }}
                              />
                              <div
                                className="absolute inset-y-0 left-0 bg-primary rounded-full"
                                style={{
                                  width: `${(course.completions / maxEnrollments) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    {(analytics?.usersPerCourse ?? []).filter((c) => c.enrollments > 0)
                      .length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No enrollment data yet
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary/30" />
                        Enrolled
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        Completed
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ─── REVIEW TAB ────────────────────────────── */}
            <TabsContent value="review" className="space-y-6">
              {/* Quick actions */}
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/admin/courses">
                    <FileText className="h-4 w-4 mr-2" />
                    Full Review Queue
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/courses?status=all">
                    <BookOpen className="h-4 w-4 mr-2" />
                    All Courses
                  </Link>
                </Button>
              </div>

              {/* Pending courses */}
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Pending Review
                  {!loading && pending.length > 0 && (
                    <Badge
                      variant="outline"
                      className="ml-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    >
                      {pending.length}
                    </Badge>
                  )}
                </h2>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                  </div>
                ) : pending.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    <p className="font-medium">All caught up!</p>
                    <p className="text-sm">No courses pending review</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pending.map((course) => (
                      <Link
                        key={course._id}
                        href={`/admin/courses/${course._id}`}
                        className="flex items-center justify-between rounded-xl border bg-card p-5 hover:bg-accent/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{course.title}</h3>
                            <Badge className={statusColors[course.status] ?? ""}>
                              {statusLabels[course.status] ?? course.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {course.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            By {course.creator?.slice(0, 8)}...
                            {course.submittedAt &&
                              ` · Submitted ${new Date(course.submittedAt).toLocaleDateString()}`}
                            {` · ${course.lessonCount ?? 0} lessons`}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PlatformLayout>
    </AdminRoute>
  );
}
