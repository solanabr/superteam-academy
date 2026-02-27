'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  BookOpen,
  MessageCircle,
  LogIn,
  LogOut,
  Target,
  MessageSquare,
  Heart,
  User as UserIcon,
  Settings,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ActivityRecord {
  _id: string;
  userId: string;
  username?: string;
  email?: string;
  activityType: string;
  description: string;
  resource: string;
  resourceId: string;
  resourceName?: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  timestamp: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ActivityBreakdown {
  _id: string;
  count: number;
}

interface TopUser {
  _id: string;
  username: string;
  email: string;
  count: number;
}

const ACTIVITY_TYPES = [
  'login',
  'logout',
  'course_view',
  'course_enrollment',
  'lesson_complete',
  'challenge_solve',
  'post_create',
  'comment_create',
  'like',
  'profile_update',
  'settings_update',
  'other',
];

const RESOURCES = ['user', 'course', 'lesson', 'challenge', 'community', 'profile', 'other'];

function getActivityIcon(activityType: string) {
  switch (activityType) {
    case 'login':
      return <LogIn className="h-4 w-4" />;
    case 'logout':
      return <LogOut className="h-4 w-4" />;
    case 'course_view':
      return <BookOpen className="h-4 w-4" />;
    case 'course_enrollment':
      return <BookOpen className="h-4 w-4" />;
    case 'lesson_complete':
      return <BookOpen className="h-4 w-4" />;
    case 'challenge_solve':
      return <Target className="h-4 w-4" />;
    case 'post_create':
      return <MessageCircle className="h-4 w-4" />;
    case 'comment_create':
      return <MessageSquare className="h-4 w-4" />;
    case 'like':
      return <Heart className="h-4 w-4" />;
    case 'profile_update':
      return <UserIcon className="h-4 w-4" />;
    case 'settings_update':
      return <Settings className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

function getActivityBadgeColor(activityType: string) {
  const baseType = activityType.split('_')[0];
  switch (baseType) {
    case 'login':
    case 'logout':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'course':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'challenge':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'post':
    case 'comment':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'like':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
    case 'profile':
    case 'settings':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

function formatActivityType(type: string) {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [summary, setSummary] = useState({
    totalActivities: 0,
    uniqueUserCount: 0,
    uniqueResourceCount: 0,
  });

  const [activityBreakdown, setActivityBreakdown] = useState<ActivityBreakdown[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [userIdFilter, setUserIdFilter] = useState('');

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      if (searchQuery.trim()) params.set('search', searchQuery);
      if (activityTypeFilter !== 'all') params.set('activityType', activityTypeFilter);
      if (resourceFilter !== 'all') params.set('resource', resourceFilter);
      if (userIdFilter.trim()) params.set('userId', userIdFilter);

      const response = await fetch(`/api/admin/activity?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch activities');
      }

      setActivities(data.activities);
      setPagination(data.pagination);
      setSummary(data.summary);
      setActivityBreakdown(data.activityBreakdown);
      setTopUsers(data.topUsers);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    searchQuery,
    activityTypeFilter,
    resourceFilter,
    userIdFilter,
  ]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchQuery, activityTypeFilter, resourceFilter, userIdFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleActivityTypeChange = (value: string) => {
    setActivityTypeFilter(value);
  };

  const handleResourceChange = (value: string) => {
    setResourceFilter(value);
  };

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page: Math.max(1, Math.min(page, prev.totalPages)) }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Activity</h1>
        <p className="text-muted-foreground mt-1">
          Track and analyze user activities across the platform
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                summary.totalActivities.toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-24" /> : summary.uniqueUserCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resource Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-24" /> : summary.uniqueResourceCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-24" /> : activityBreakdown.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Activity Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Breakdown</CardTitle>
            <CardDescription>By activity type</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : activityBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm">No activities yet</p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {activityBreakdown.map((item) => (
                  <div key={item._id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{formatActivityType(item._id)}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Most Active Users</CardTitle>
            <CardDescription>Top 10 users by activities</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : topUsers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No users yet</p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {topUsers.map((user, idx) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between border-b pb-1 text-sm last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{user.username || 'Unknown'}</p>
                      <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {user.count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Username, email, description..."
                value={searchQuery}
                onChange={handleSearch}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Activity Type</label>
              <Select value={activityTypeFilter} onValueChange={handleActivityTypeChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatActivityType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Resource</label>
              <Select value={resourceFilter} onValueChange={handleResourceChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {RESOURCES.map((resource) => (
                    <SelectItem key={resource} value={resource}>
                      {resource.charAt(0).toUpperCase() + resource.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="Filter by user ID..."
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setActivityTypeFilter('all');
                  setResourceFilter('all');
                  setUserIdFilter('');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Showing{' '}
            {loading
              ? '-'
              : `${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`}{' '}
            activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="py-8 text-center">
              <Activity className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">No activities found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActivityIcon(activity.activityType)}
                            <Badge
                              className={`${getActivityBadgeColor(activity.activityType)} font-normal`}
                            >
                              {formatActivityType(activity.activityType)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {activity.username || 'Unknown'}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {activity.email || activity.userId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-sm">{activity.description}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {activity.resource}
                          </Badge>
                          {activity.resourceName && (
                            <p className="text-muted-foreground mt-1 truncate text-xs">
                              {activity.resourceName}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {format(new Date(activity.timestamp), 'MMM d, HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
