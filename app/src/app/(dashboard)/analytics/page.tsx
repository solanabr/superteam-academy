'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Zap,
  Award,
  BookOpen,
  Calendar,
  Download,
  Flame,
} from 'lucide-react';

interface AnalyticsData {
  totalXP: number;
  totalCourses: number;
  completedCourses: number;
  activeCourses: number;
  totalLessons: number;
  averageTime: number;
  averageTimeDelta: number;
  rangeXP: number;
  xpDelta: number;
  streak: number;
  weeklyActivity: { day: string; xp: number; lessons: number }[];
  courseProgress: { name: string; progress: number; xp: number }[];
  skillRadar: { skill: string; level: number }[];
  insights: string[];
}

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [fetching, setFetching] = useState(false);
  const maxDailyXp = Math.max(1, ...(analytics?.weeklyActivity || []).map((day) => day.xp));

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      setFetching(true);
      try {
        const response = await fetch(`/api/analytics?range=${timeRange}`);
        if (!response.ok) throw new Error('Failed to fetch analytics');

        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchAnalytics();
  }, [user, timeRange]);

  if (isLoading || fetching) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-8 w-1/3 rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted h-32 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to view analytics</CardTitle>
            <CardDescription>Track your learning progress and performance metrics</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your progress and identify areas for improvement
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Time Range Selector */}
      <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
        <TabsList>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
        </TabsList>

        <TabsContent value={timeRange} className="mt-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total XP Earned</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalXP.toLocaleString()}</div>
                <p className="text-muted-foreground mt-1 text-xs">
                  <span
                    className={`font-medium ${
                      (analytics?.xpDelta || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {(analytics?.xpDelta || 0) >= 0 ? '+' : ''}
                    {analytics?.xpDelta || 0}
                  </span>{' '}
                  vs previous {timeRange}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Courses In Progress</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.activeCourses || 0}</div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {analytics?.completedCourses || 0} completed • {analytics?.totalLessons || 0}{' '}
                  lessons in {timeRange}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Session Time</CardTitle>
                <Clock className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.averageTime}m</div>
                <p className="text-muted-foreground mt-1 text-xs">
                  <span
                    className={`font-medium ${
                      (analytics?.averageTimeDelta || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {(analytics?.averageTimeDelta || 0) >= 0 ? '+' : ''}
                    {analytics?.averageTimeDelta || 0}m
                  </span>{' '}
                  vs previous {timeRange}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <Calendar className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.streak} days</div>
                <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                  Keep it up!
                  <Flame className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Weekly Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>XP earned and lessons completed per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.weeklyActivity.map((day) => (
                    <div key={day.day} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{day.day}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">{day.lessons} lessons</span>
                          <span className="font-semibold text-yellow-600">{day.xp} XP</span>
                        </div>
                      </div>
                      <div className="bg-muted h-2 overflow-hidden rounded-full">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                          style={{ width: `${(day.xp / maxDailyXp) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Course Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Course Progress</CardTitle>
                <CardDescription>Your current learning tracks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.courseProgress.map((course) => (
                    <div key={course.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{course.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{course.progress}%</span>
                          <span className="font-semibold text-yellow-600">{course.xp} XP</span>
                        </div>
                      </div>
                      <div className="bg-muted h-2 overflow-hidden rounded-full">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Assessment</CardTitle>
              <CardDescription>Your proficiency across different domains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.skillRadar.map((skill) => (
                  <div key={skill.skill} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{skill.skill}</span>
                      <span className="text-muted-foreground">{skill.level}/100</span>
                    </div>
                    <div className="bg-muted h-3 overflow-hidden rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.insights && analytics.insights.length > 0 ? (
                <ul className="space-y-3 text-sm">
                  {analytics.insights.map((insight, index) => {
                    const colors = [
                      'bg-green-600',
                      'bg-blue-600',
                      'bg-purple-600',
                      'bg-orange-600',
                    ];
                    const color = colors[index % colors.length];
                    return (
                      <li key={index} className="flex items-start gap-2">
                        <div className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />
                        <span>{insight}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Start learning to generate personalized insights based on your progress.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
