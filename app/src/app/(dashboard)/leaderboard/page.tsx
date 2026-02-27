'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/hooks';
import { useWalletContext } from '@/components/providers';
import {
  Trophy,
  Flame,
  Star,
  Medal,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  Zap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';

interface Course {
  _id: string;
  title: string;
  slug: string;
}

interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  address: string;
  username?: string;
  avatar?: string;
  xp: number;
  level: number;
  streak?: number;
  coursesCompleted?: number;
  challengesSolved?: number;
}

function mapDatabaseEntries(entries: any[]): LeaderboardEntry[] {
  return entries.map((entry: any) => ({
    rank: entry.rank,
    previousRank: entry.rank,
    address: entry.walletAddress || entry.userId,
    username: entry.displayName || entry.username || `User ${entry.rank}`,
    avatar: entry.avatarUrl,
    xp: entry.totalXp,
    level: entry.level,
    streak: entry.currentStreak || 0,
    coursesCompleted: entry.coursesCompleted || 0,
    challengesSolved: 0,
  }));
}

function mapOnChainEntries(entries: any[]): LeaderboardEntry[] {
  return entries.map((entry: any) => ({
    rank: entry.rank,
    previousRank: entry.rank,
    address: entry.wallet,
    username: `Wallet ${entry.rank}`,
    avatar: undefined,
    xp: entry.xpBalance,
    level: entry.level,
    streak: 0,
    coursesCompleted: 0,
    challengesSolved: 0,
  }));
}

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const { connected, address } = useWalletContext();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  // Fetch courses for filter dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const wallet = address || '';
        const timeframeMap: Record<string, string> = {
          all: 'all-time',
          month: 'monthly',
          week: 'weekly',
        };
        const timeframeParam = timeframeMap[timeFilter] || 'all-time';
        const courseParam = selectedCourse !== 'all' ? `&courseId=${selectedCourse}` : '';

        const shouldUseOnChainDefault = timeFilter === 'all' && selectedCourse === 'all';

        if (shouldUseOnChainDefault) {
          try {
            const onChainResponse = await fetch(
              `/api/leaderboard/onchain?limit=100${wallet ? `&wallet=${wallet}` : ''}`
            );

            if (!onChainResponse.ok) {
              throw new Error('On-chain leaderboard request failed');
            }

            const onChainData = await onChainResponse.json();
            const onChainEntries = mapOnChainEntries(onChainData.entries || []);

            if (onChainEntries.length > 0) {
              setLeaderboard(onChainEntries);
              return;
            }
          } catch (onChainError) {
            console.warn('On-chain leaderboard unavailable, falling back to database:', onChainError);
          }
        }

        const response = await fetch(
          `/api/leaderboard?limit=100&timeframe=${timeframeParam}${courseParam}${wallet ? `&userId=${wallet}` : ''}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const data = await response.json();
        setLeaderboard(mapDatabaseEntries(data.entries || []));
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeFilter, address, selectedCourse]);

  // Get current user's rank from the leaderboard
  const currentUserRank = leaderboard.find(
    (entry) => address && entry.address.toLowerCase() === address.toLowerCase()
  ) || {
    rank: 0,
    previousRank: 0,
    address: address || '',
    username: 'You',
    avatar: '',
    xp: 0,
    level: 1,
    streak: 0,
    coursesCompleted: 0,
    challengesSolved: 0,
  };

  const itemsPerPage = 10;

  const filteredLeaderboard = leaderboard.filter(
    (user) =>
      searchQuery === '' ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage);

  const paginatedLeaderboard = filteredLeaderboard.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRankChange = (current: number, previous: number) => {
    if (current < previous)
      return { icon: TrendingUp, color: 'text-green-500', change: previous - current };
    if (current > previous)
      return { icon: TrendingDown, color: 'text-red-500', change: current - previous };
    return { icon: Minus, color: 'text-muted-foreground', change: 0 };
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-muted-foreground text-lg font-bold">#{rank}</span>;
    }
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-bold">
          <Trophy className="h-8 w-8 text-yellow-500" />
          {t('leaderboard.title')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('leaderboard.subtitle')}</p>
      </div>

      {/* Top 3 Podium */}
      {loading ? (
        <div className="mb-8 text-center">
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      ) : leaderboard.length < 3 ? (
        <div className="mb-8 text-center">
          <p className="text-muted-foreground">Not enough participants yet</p>
        </div>
      ) : (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {/* Second Place */}
          <Card className="order-2 md:order-1 md:mt-8">
            <CardContent className="pt-6 text-center">
              <div className="relative inline-block">
                <Avatar className="mx-auto h-20 w-20">
                  <AvatarImage src={leaderboard[1]?.avatar || ''} />
                  <AvatarFallback className="text-xl">
                    {leaderboard[1]?.username?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-gray-400 font-bold text-white">
                  2
                </div>
              </div>
              <h3 className="mt-4 font-bold">{leaderboard[1]?.username || 'Unknown'}</h3>
              <p className="text-primary mt-1 text-2xl font-bold">
                {(leaderboard[1]?.xp || 0).toLocaleString()} XP
              </p>
              <div className="mt-2 flex justify-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3" />
                  Lv {leaderboard[1]?.level || 1}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {leaderboard[1]?.streak || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* First Place */}
          <Card className="order-1 border-yellow-500/50 bg-gradient-to-b from-yellow-500/10 md:order-2">
            <CardContent className="pt-6 text-center">
              <Crown className="mx-auto mb-2 h-8 w-8 text-yellow-500" />
              <div className="relative inline-block">
                <Avatar className="mx-auto h-24 w-24 ring-4 ring-yellow-500/50">
                  <AvatarImage src={leaderboard[0]?.avatar || ''} />
                  <AvatarFallback className="text-2xl">
                    {leaderboard[0]?.username?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-yellow-500 font-bold text-white">
                  1
                </div>
              </div>
              <h3 className="mt-4 text-lg font-bold">{leaderboard[0]?.username || 'Unknown'}</h3>
              <p className="mt-1 text-3xl font-bold text-yellow-500">
                {(leaderboard[0]?.xp || 0).toLocaleString()} XP
              </p>
              <div className="mt-2 flex justify-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3" />
                  Lv {leaderboard[0]?.level || 1}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {leaderboard[0]?.streak || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Third Place */}
          <Card className="order-3 md:mt-12">
            <CardContent className="pt-6 text-center">
              <div className="relative inline-block">
                <Avatar className="mx-auto h-18 w-18">
                  <AvatarImage src={leaderboard[2]?.avatar || ''} />
                  <AvatarFallback className="text-lg">
                    {leaderboard[2]?.username?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-amber-600 font-bold text-white">
                  3
                </div>
              </div>
              <h3 className="mt-4 font-bold">{leaderboard[2]?.username || 'Unknown'}</h3>
              <p className="text-primary mt-1 text-2xl font-bold">
                {(leaderboard[2]?.xp || 0).toLocaleString()} XP
              </p>
              <div className="mt-2 flex justify-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3" />
                  Lv {leaderboard[2]?.level || 1}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {leaderboard[2]?.streak || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current User Rank (if connected) */}
      {connected && (
        <Card className="border-primary/50 bg-primary/5 mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 text-center">{getRankBadge(currentUserRank.rank)}</div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{address?.slice(0, 2).toUpperCase() || 'ME'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t('leaderboard.you')}</span>
                    <Badge variant="outline">{t('leaderboard.yourRank')}</Badge>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span>{currentUserRank.xp.toLocaleString()} XP</span>
                    <span>•</span>
                    <span>Lv {currentUserRank.level}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {(() => {
                  const change = getRankChange(
                    currentUserRank.rank,
                    currentUserRank.previousRank ?? currentUserRank.rank
                  );
                  const Icon = change.icon;
                  return (
                    <div className={`flex items-center gap-1 ${change.color}`}>
                      <Icon className="h-4 w-4" />
                      {change.change > 0 && <span>{change.change}</span>}
                    </div>
                  );
                })()}
                <div className="hidden items-center gap-4 text-sm md:flex">
                  <span className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {currentUserRank.streak}
                  </span>
                  <span>
                    {currentUserRank.coursesCompleted} {t('leaderboard.courses')}
                  </span>
                  <span>
                    {currentUserRank.challengesSolved} {t('leaderboard.challenges')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t('leaderboard.searchPlaceholder')}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <BookOpen className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t('leaderboard.allCourses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('leaderboard.allCourses')}</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course._id} value={course._id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tabs
          value={timeFilter}
          onValueChange={(v) => setTimeFilter(v as 'all' | 'week' | 'month')}
        >
          <TabsList>
            <TabsTrigger value="all">{t('leaderboard.allTime')}</TabsTrigger>
            <TabsTrigger value="month">{t('leaderboard.thisMonth')}</TabsTrigger>
            <TabsTrigger value="week">{t('leaderboard.thisWeek')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('leaderboard.rankings')}</CardTitle>
          <CardDescription>
            {t('leaderboard.totalParticipants', { count: filteredLeaderboard.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Header */}
            <div className="text-muted-foreground hidden grid-cols-12 gap-4 border-b px-4 py-2 text-sm font-medium md:grid">
              <div className="col-span-1">{t('leaderboard.rank')}</div>
              <div className="col-span-4">{t('leaderboard.user')}</div>
              <div className="col-span-2 text-right">{t('leaderboard.xp')}</div>
              <div className="col-span-1 text-center">{t('leaderboard.level')}</div>
              <div className="col-span-1 text-center">{t('leaderboard.streak')}</div>
              <div className="col-span-2 text-center">{t('leaderboard.courses')}</div>
              <div className="col-span-1 text-center">{t('leaderboard.change')}</div>
            </div>

            {/* Rows */}
            {paginatedLeaderboard.map((user) => {
              const change = getRankChange(user.rank, user.previousRank ?? user.rank);
              const Icon = change.icon;

              return (
                <div
                  key={user.address}
                  className="hover:bg-muted/50 grid grid-cols-12 items-center gap-4 rounded-lg px-4 py-3 transition-colors"
                >
                  <div className="col-span-1">{getRankBadge(user.rank)}</div>
                  <div className="col-span-11 flex items-center gap-3 md:col-span-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {(user.username || 'User').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{user.username || 'Unknown'}</div>
                      <div className="text-muted-foreground text-xs md:hidden">
                        {user.xp.toLocaleString()} XP • Lv {user.level}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 hidden text-right font-semibold md:block">
                    <span className="flex items-center justify-end gap-1">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      {user.xp.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-1 hidden justify-center md:flex">
                    <Badge variant="secondary">{user.level}</Badge>
                  </div>
                  <div className="col-span-1 hidden items-center justify-center gap-1 md:flex">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {user.streak}
                  </div>
                  <div className="col-span-2 hidden text-center md:block">
                    {user.coursesCompleted}
                  </div>
                  <div
                    className={`col-span-1 hidden items-center justify-center gap-1 md:flex ${change.color}`}
                  >
                    <Icon className="h-4 w-4" />
                    {change.change > 0 && <span className="text-sm">{change.change}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="text-muted-foreground text-sm">
              {t('leaderboard.showing', {
                from: (currentPage - 1) * itemsPerPage + 1,
                to: Math.min(currentPage * itemsPerPage, filteredLeaderboard.length),
                total: filteredLeaderboard.length,
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
