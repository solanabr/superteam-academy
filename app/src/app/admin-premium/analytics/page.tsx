'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Users,
  TrendingUp,
  MessageCircle,
  BookOpen,
  Globe,
  BarChart3,
  RefreshCw,
  Download,
} from 'lucide-react';
import { StatsCard } from '@/components/admin/analytics/stats-card';
import { AnalyticsChart } from '@/components/admin/analytics/analytics-chart';
import { AnalyticsTable } from '@/components/admin/analytics/analytics-table';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Skeleton } from '@/components/ui/skeleton';

interface UserStats {
  totalUsers: number;
  usersByRole: {
    admin: number;
    super_admin: number;
    user: number;
  };
  activeUsers: {
    last7Days: number;
    last30Days: number;
  };
  usersByLanguage: Array<{
    _id: string;
    count: number;
  }>;
  xpStats: {
    avgXp: number;
    totalXp: number;
    maxXp: number;
  };
  courseStats: {
    avgCoursesCompleted: number;
    totalCoursesCompleted: number;
  };
  streakStats: {
    avgStreak: number;
    totalStreakDays: number;
  };
  notifications: {
    emailEnabled: number;
    pushEnabled: number;
  };
}

interface EngagementData {
  posts: {
    total: number;
    pinned: number;
    announcements: number;
    discussions: number;
    byCategory: Array<{
      _id: string;
      count: number;
      avgReplies: number;
    }>;
  };
  comments: {
    total: number;
  };
  likes: {
    total: number;
  };
  engagement: {
    total: number;
    last7Days: {
      posts: number;
      comments: number;
      likes: number;
    };
    topEngagedUsers: Array<{
      _id: string;
      display_name: string;
      total_xp: number;
      engagement: number;
    }>;
  };
  engagementMetrics: {
    totalEngagedUsers: number;
    engagementRate: number;
    totalUsers: number;
  };
}

interface CoursesData {
  overview: {
    totalEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
    certificatesIssued: number;
  };
  topCourses: Array<{
    _id: string;
    enrollments: number;
    completed: number;
  }>;
  lessonStats: {
    avgLessonsCompleted: number;
    avgChallengesSolved: number;
  };
  xpStats: {
    avgXpEarned: number;
    totalXpEarned: number;
  };
  topLearners: Array<{
    user: {
      display_name: string;
      username: string;
    };
    coursesCompleted: number;
    totalEnrollments: number;
  }>;
}

interface DemographicsData {
  totalUsers: number;
  language: {
    distribution: Array<{
      _id: string;
      count: number;
      percentage: string;
    }>;
  };
  theme: {
    distribution: Array<{
      _id: string;
      count: number;
    }>;
  };
  location: {
    withLocation: number;
    topLocations: Array<{
      _id: string;
      count: number;
    }>;
  };
  accountCompletion: any;
  preferences: any;
  retention: {
    retention30Days: number;
    activeUsers30Days: number;
  };
}

interface GrowthData {
  period: number;
  dailyRegistrations: Array<{
    _id: {
      year: number;
      month: number;
      day: number;
    };
    count: number;
  }>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  // Fetch all analytics data
  const {
    data: userStats,
    loading: userStatsLoading,
    refetch: refetchUserStats,
  } = useAnalyticsData<UserStats>({
    endpointPath: 'user-stats',
  });

  const {
    data: engagementData,
    loading: engagementLoading,
    refetch: refetchEngagement,
  } = useAnalyticsData<EngagementData>({
    endpointPath: 'engagement',
  });

  const {
    data: coursesData,
    loading: coursesLoading,
    refetch: refetchCourses,
  } = useAnalyticsData<CoursesData>({
    endpointPath: 'courses',
  });

  const {
    data: demographicsData,
    loading: demographicsLoading,
    refetch: refetchDemographics,
  } =
    useAnalyticsData<DemographicsData>({
      endpointPath: 'demographics',
    });

  const { data: growthData, refetch: refetchGrowth } = useAnalyticsData<GrowthData>({
    endpointPath: 'growth',
    params: { period: 30 },
  });

  useEffect(() => {
    if (
      userStats &&
      engagementData &&
      coursesData &&
      demographicsData &&
      growthData &&
      !lastUpdatedAt
    ) {
      setLastUpdatedAt(new Date());
    }
  }, [userStats, engagementData, coursesData, demographicsData, growthData, lastUpdatedAt]);

  const registrationTrend = (() => {
    const daily = growthData?.dailyRegistrations || [];
    if (daily.length === 0) {
      return { value: 0, direction: 'neutral' as const, label: 'vs previous 15 days' };
    }

    const normalized = daily
      .map((item) => ({
        date: new Date(item._id.year, item._id.month - 1, item._id.day).getTime(),
        count: item.count,
      }))
      .sort((a, b) => a.date - b.date);

    const midpoint = Math.floor(normalized.length / 2);
    const firstHalf = normalized.slice(0, midpoint);
    const secondHalf = normalized.slice(midpoint);

    const firstTotal = firstHalf.reduce((sum, item) => sum + item.count, 0);
    const secondTotal = secondHalf.reduce((sum, item) => sum + item.count, 0);

    if (firstTotal === 0 && secondTotal === 0) {
      return { value: 0, direction: 'neutral' as const, label: 'vs previous 15 days' };
    }

    if (firstTotal === 0) {
      return { value: 100, direction: 'up' as const, label: 'vs previous 15 days' };
    }

    const changePercent = Math.round(((secondTotal - firstTotal) / firstTotal) * 100);

    return {
      value: Math.abs(changePercent),
      direction:
        changePercent > 0 ? ('up' as const) : changePercent < 0 ? ('down' as const) : ('neutral' as const),
      label: 'vs previous 15 days',
    };
  })();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchUserStats(),
        refetchEngagement(),
        refetchCourses(),
        refetchDemographics(),
        refetchGrowth(),
      ]);
      setLastUpdatedAt(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownloadReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      userStats,
      engagementData,
      coursesData,
      demographicsData,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <BarChart3 className="text-primary h-7 w-7" />
            User Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive user engagement, growth, and platform usage analytics
          </p>
          {lastUpdatedAt && (
            <p className="text-muted-foreground mt-1 text-xs">
              Last updated at {lastUpdatedAt.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="courses">Learning</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {userStatsLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <StatsCard
                  title="Total Users"
                  value={userStats?.totalUsers || 0}
                  description="All registered users"
                  icon={<Users className="h-4 w-4" />}
                  trend={registrationTrend}
                />
                <StatsCard
                  title="Active (7 Days)"
                  value={userStats?.activeUsers.last7Days || 0}
                  description={`${(((userStats?.activeUsers.last7Days || 0) / (userStats?.totalUsers || 1)) * 100).toFixed(1)}% of total`}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <StatsCard
                  title="Active (30 Days)"
                  value={userStats?.activeUsers.last30Days || 0}
                  description={`${(((userStats?.activeUsers.last30Days || 0) / (userStats?.totalUsers || 1)) * 100).toFixed(1)}% of total`}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <StatsCard
                  title="Avg XP"
                  value={Math.round(userStats?.xpStats.avgXp || 0)}
                  description="Per user"
                  icon={<TrendingUp className="h-4 w-4" />}
                />
              </div>

              {/* User Distribution */}
              <div className="grid gap-4 md:grid-cols-2">
                <AnalyticsChart title="Users by Role" description="Distribution of user roles">
                  <div className="space-y-4">
                    {[
                      {
                        label: 'Regular Users',
                        value: userStats?.usersByRole.user || 0,
                        color: 'bg-blue-500',
                      },
                      {
                        label: 'Admins',
                        value: userStats?.usersByRole.admin || 0,
                        color: 'bg-green-500',
                      },
                      {
                        label: 'Super Admins',
                        value: userStats?.usersByRole.super_admin || 0,
                        color: 'bg-purple-500',
                      },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.label}</span>
                          <span className="font-bold">{item.value}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-2 rounded-full ${item.color}`}
                            style={{
                              width: `${((item.value / (userStats?.totalUsers || 1)) * 100).toFixed(1)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </AnalyticsChart>

                <AnalyticsChart title="Language Preference" description="Users by language setting">
                  <div className="space-y-4">
                    {userStats?.usersByLanguage.map((lang) => (
                      <div key={lang._id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{lang._id}</span>
                          <span className="font-bold">{lang.count}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-2 rounded-full bg-indigo-500"
                            style={{
                              width: `${((lang.count / (userStats?.totalUsers || 1)) * 100).toFixed(1)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </AnalyticsChart>
              </div>

              {/* Notification Preferences */}
              <div className="grid gap-4 md:grid-cols-2">
                <StatsCard
                  title="Email Notifications"
                  value={userStats?.notifications.emailEnabled || 0}
                  description={`${(((userStats?.notifications.emailEnabled || 0) / (userStats?.totalUsers || 1)) * 100).toFixed(1)}% enabled`}
                />
                <StatsCard
                  title="Push Notifications"
                  value={userStats?.notifications.pushEnabled || 0}
                  description={`${(((userStats?.notifications.pushEnabled || 0) / (userStats?.totalUsers || 1)) * 100).toFixed(1)}% enabled`}
                />
              </div>
            </>
          )}
        </TabsContent>

        {/* ENGAGEMENT TAB */}
        <TabsContent value="engagement" className="space-y-6">
          {engagementLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <StatsCard
                  title="Total Posts"
                  value={engagementData?.posts.total || 0}
                  icon={<MessageCircle className="h-4 w-4" />}
                />
                <StatsCard
                  title="Total Comments"
                  value={engagementData?.comments.total || 0}
                  icon={<MessageCircle className="h-4 w-4" />}
                />
                <StatsCard
                  title="Total Likes"
                  value={engagementData?.likes.total || 0}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <StatsCard
                  title="Engagement Rate"
                  value={`${(engagementData?.engagementMetrics.engagementRate || 0).toFixed(1)}%`}
                  description={`${engagementData?.engagementMetrics.totalEngagedUsers || 0} users engaged`}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <StatsCard title="Pinned Posts" value={engagementData?.posts.pinned || 0} />
                <StatsCard
                  title="Announcements"
                  value={engagementData?.posts.announcements || 0}
                />
                <StatsCard title="Discussions" value={engagementData?.posts.discussions || 0} />
              </div>

              {/* Last 7 Days Activity */}
              <div className="grid gap-4 md:grid-cols-3">
                <AnalyticsChart title="Activity (Last 7 Days)">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Posts</span>
                      <span className="font-bold">
                        {engagementData?.engagement.last7Days.posts}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Comments</span>
                      <span className="font-bold">
                        {engagementData?.engagement.last7Days.comments}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Likes</span>
                      <span className="font-bold">
                        {engagementData?.engagement.last7Days.likes}
                      </span>
                    </div>
                  </div>
                </AnalyticsChart>

                <AnalyticsChart title="Special Posts">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Pinned</span>
                      <span className="font-bold">{engagementData?.posts.pinned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Announcements</span>
                      <span className="font-bold">{engagementData?.posts.announcements}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Discussions</span>
                      <span className="font-bold">{engagementData?.posts.discussions}</span>
                    </div>
                  </div>
                </AnalyticsChart>

                <AnalyticsChart title="Top Categories">
                  <div className="space-y-2">
                    {engagementData?.posts.byCategory.slice(0, 3).map((cat) => (
                      <div key={cat._id} className="flex justify-between text-sm">
                        <span>{cat._id || 'Uncategorized'}</span>
                        <span className="font-bold">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </AnalyticsChart>
              </div>

              {/* Top Engaged Users */}
              {engagementData?.engagement.topEngagedUsers && (
                <AnalyticsTable
                  title="Top Engaged Users"
                  description="Users with highest engagement score"
                  columns={[
                    {
                      key: 'display_name',
                      label: 'User',
                    },
                    {
                      key: 'total_xp',
                      label: 'Total XP',
                    },
                    {
                      key: 'engagement',
                      label: 'Engagement Score',
                    },
                  ]}
                  data={engagementData.engagement.topEngagedUsers}
                />
              )}
            </>
          )}
        </TabsContent>

        {/* COURSES TAB */}
        <TabsContent value="courses" className="space-y-6">
          {coursesLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <StatsCard
                  title="Total Enrollments"
                  value={coursesData?.overview.totalEnrollments || 0}
                  icon={<BookOpen className="h-4 w-4" />}
                />
                <StatsCard
                  title="Completed Enrollments"
                  value={coursesData?.overview.completedEnrollments || 0}
                  description={`${coursesData?.overview.completionRate.toFixed(1)}% completion rate`}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <StatsCard
                  title="Certificates Issued"
                  value={coursesData?.overview.certificatesIssued || 0}
                  icon={<BookOpen className="h-4 w-4" />}
                />
                <StatsCard
                  title="Avg Lessons Completed"
                  value={Math.round(coursesData?.lessonStats.avgLessonsCompleted || 0)}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
              </div>

              {/* Course Stats */}
              <div className="grid gap-4 md:grid-cols-2">
                <AnalyticsChart title="XP Statistics">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Avg XP per Course</span>
                      <span className="font-bold">
                        {Math.round(coursesData?.xpStats.avgXpEarned || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total XP Distributed</span>
                      <span className="font-bold">
                        {Number(coursesData?.xpStats.totalXpEarned || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </AnalyticsChart>

                <AnalyticsChart title="Challenge Statistics">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Challenges Solved</span>
                      <span className="font-bold">
                        {Math.round(coursesData?.lessonStats.avgChallengesSolved || 0)}
                      </span>
                    </div>
                  </div>
                </AnalyticsChart>
              </div>

              {/* Top Learners */}
              {coursesData?.topLearners && (
                <AnalyticsTable
                  title="Top Learners"
                  description="Users with most course completions"
                  columns={[
                    {
                      key: 'user.display_name',
                      label: 'User',
                      render: (_, item: any) => item.user.display_name,
                    },
                    {
                      key: 'coursesCompleted',
                      label: 'Courses Completed',
                    },
                    {
                      key: 'totalEnrollments',
                      label: 'Total Enrollments',
                    },
                    {
                      key: 'totalXpEarned',
                      label: 'XP Earned',
                    },
                  ]}
                  data={coursesData.topLearners}
                />
              )}
            </>
          )}
        </TabsContent>

        {/* DEMOGRAPHICS TAB */}
        <TabsContent value="demographics" className="space-y-6">
          {demographicsLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <StatsCard
                  title="Total Users"
                  value={demographicsData?.totalUsers || 0}
                  icon={<Users className="h-4 w-4" />}
                />
                <StatsCard
                  title="30-Day Retention"
                  value={`${demographicsData?.retention.retention30Days.toFixed(1)}%`}
                  description={`${demographicsData?.retention.activeUsers30Days} active users`}
                />
                <StatsCard
                  title="Users with Location"
                  value={demographicsData?.location.withLocation || 0}
                  description={`${(((demographicsData?.location.withLocation || 0) / (demographicsData?.totalUsers || 1)) * 100).toFixed(1)}% of total`}
                />
                <StatsCard
                  title="Profile Visibility"
                  value={demographicsData?.preferences.profilePublic || 0}
                  description="Public profiles"
                  icon={<Globe className="h-4 w-4" />}
                />
              </div>

              {/* Language and Theme Distribution */}
              <div className="grid gap-4 md:grid-cols-2">
                <AnalyticsChart
                  title="Language Distribution"
                  description="Users by language preference"
                >
                  <div className="space-y-3">
                    {demographicsData?.language.distribution.map((lang) => (
                      <div key={lang._id}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="capitalize">{lang._id}</span>
                          <span className="font-bold">
                            {lang.count} ({lang.percentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${parseFloat(lang.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </AnalyticsChart>

                <AnalyticsChart title="Theme Preferences">
                  <div className="space-y-3">
                    {demographicsData?.theme.distribution.map((theme) => (
                      <div
                        key={theme._id}
                        className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-900"
                      >
                        <span className="capitalize">{theme._id}</span>
                        <span className="font-bold">{theme.count}</span>
                      </div>
                    ))}
                  </div>
                </AnalyticsChart>
              </div>

              {/* Top Locations */}
              {demographicsData?.location.topLocations && (
                <AnalyticsTable
                  title="Top Locations"
                  description="Users by location"
                  columns={[
                    {
                      key: '_id',
                      label: 'Location',
                    },
                    {
                      key: 'count',
                      label: 'User Count',
                    },
                  ]}
                  data={demographicsData.location.topLocations.slice(0, 10)}
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
