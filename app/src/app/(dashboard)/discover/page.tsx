'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Clock,
  BookOpen,
  Zap,
  Filter,
  ArrowRight,
  PlayCircle,
  Loader2,
  CheckCircle,
  Wrench,
  CreditCard,
  Palette,
  Coins,
  Target,
  Check,
  Bookmark,
  BookmarkCheck,
  Eye,
} from 'lucide-react';
import type { CourseCatalogItem } from '@/types/course';
import { useTranslation } from '@/hooks';

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

interface DiscoverCourse extends CourseCatalogItem {
  enrolled: boolean;
  bookmarked: boolean;
  enrollmentProgress?: number;
  enrollmentId?: string;
}

export default function DiscoverCoursesPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const enrollSlug = searchParams.get('enroll');
  const trackFromQuery = searchParams.get('track');
  const autoEnrollAttempted = useRef(false);

  const [courses, setCourses] = useState<DiscoverCourse[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [bookmarkingCourseId, setBookmarkingCourseId] = useState<string | null>(null);
  const [enrollmentSuccessId, setEnrollmentSuccessId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/discover/courses', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to fetch discover courses');
        }

        const data = await response.json();
        setCourses(data.courses || []);
        setTracks(data.tracks || []);
      } catch (error) {
        console.error('Error loading discover courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (!trackFromQuery || tracks.length === 0) return;

    if (tracks.includes(trackFromQuery)) {
      setSelectedTrack(trackFromQuery);
    }
  }, [trackFromQuery, tracks]);

  // Auto-enroll if enroll query param is present
  useEffect(() => {
    if (enrollSlug && !loading && courses.length > 0 && !autoEnrollAttempted.current) {
      const courseToEnroll = courses.find((c) => c.slug === enrollSlug);
      if (courseToEnroll && !courseToEnroll.enrolled) {
        autoEnrollAttempted.current = true;
        handleEnrollCourse(enrollSlug);
      }
    }
  }, [enrollSlug, loading, courses]);

  const handleEnrollCourse = async (courseSlug: string) => {
    setEnrollingCourseId(courseSlug);
    try {
      const response = await fetch('/api/discover/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug }),
      });

      if (!response.ok) {
        throw new Error('Failed to enroll in course');
      }

      const data = await response.json();

      setCourses((prev) =>
        prev.map((course) =>
          course.slug === courseSlug
            ? {
                ...course,
                enrolled: true,
                enrollmentId: data.enrollment?.id,
                enrollmentProgress: data.enrollment?.progress || 0,
              }
            : course
        )
      );

      setEnrollmentSuccessId(courseSlug);
      setTimeout(() => setEnrollmentSuccessId(null), 3000);
    } catch (error) {
      console.error('Error enrolling in course:', error);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleToggleBookmark = async (courseSlug: string, bookmarked: boolean) => {
    setBookmarkingCourseId(courseSlug);
    try {
      const response = await fetch('/api/discover/bookmarks', {
        method: bookmarked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bookmark');
      }

      setCourses((prev) =>
        prev.map((course) =>
          course.slug === courseSlug ? { ...course, bookmarked: !bookmarked } : course
        )
      );
    } catch (error) {
      console.error('Error updating bookmark:', error);
    } finally {
      setBookmarkingCourseId(null);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDifficulty =
        selectedDifficulty === 'all' || course.difficulty === selectedDifficulty;
      const matchesTrack = selectedTrack === 'all' || course.track === selectedTrack;

      // Duration filter
      let matchesDuration = true;
      if (selectedDuration !== 'all') {
        const durationMinutes = course.duration || 0;
        switch (selectedDuration) {
          case 'under-15':
            matchesDuration = durationMinutes < 15;
            break;
          case '15-30':
            matchesDuration = durationMinutes >= 15 && durationMinutes <= 30;
            break;
          case '30-60':
            matchesDuration = durationMinutes > 30 && durationMinutes <= 60;
            break;
          case '1-3h':
            matchesDuration = durationMinutes > 60 && durationMinutes <= 180;
            break;
          case '3h+':
            matchesDuration = durationMinutes > 180;
            break;
        }
      }

      return matchesSearch && matchesDifficulty && matchesTrack && matchesDuration;
    });
  }, [courses, searchQuery, selectedDifficulty, selectedTrack, selectedDuration]);

  return (
    <div className="container space-y-8 py-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Discover Courses</h1>
          <p className="text-muted-foreground mt-2">
            {t('discover.subtitle')}
          </p>
        </div>

        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder={t('courses.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <Tabs
            value={selectedDifficulty}
            onValueChange={setSelectedDifficulty}
            className="w-full md:w-auto"
          >
            <TabsList>
              <TabsTrigger value="all">{t('discover.allLevels')}</TabsTrigger>
              <TabsTrigger value="beginner">{t('courses.filters.beginner')}</TabsTrigger>
              <TabsTrigger value="intermediate">{t('courses.filters.intermediate')}</TabsTrigger>
              <TabsTrigger value="advanced">{t('courses.filters.advanced')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={selectedTrack} onValueChange={setSelectedTrack} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">{t('discover.allTracks')}</TabsTrigger>
              {tracks.map((track) => (
                <TabsTrigger key={track} value={track}>
                  {track}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Select value={selectedDuration} onValueChange={setSelectedDuration}>
            <SelectTrigger className="w-[160px]">
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t('courses.detail.duration')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('discover.allDurations')}</SelectItem>
              <SelectItem value="under-15">{t('discover.durationUnder15')}</SelectItem>
              <SelectItem value="15-30">{t('discover.duration15to30')}</SelectItem>
              <SelectItem value="30-60">{t('discover.duration30to60')}</SelectItem>
              <SelectItem value="1-3h">{t('discover.duration1to3h')}</SelectItem>
              <SelectItem value="3h+">{t('discover.duration3hPlus')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
          <p className="text-muted-foreground mt-4">{t('discover.loadingCourses')}</p>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const isEnrolling = enrollingCourseId === course.slug;
            const isBookmarking = bookmarkingCourseId === course.slug;
            const isSuccessful = enrollmentSuccessId === course.slug;

            return (
              <Card
                key={course.slug}
                className="group hover:border-primary/50 relative h-full transition-all hover:shadow-lg"
              >
                <div className="relative h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <button
                    type="button"
                    className="bg-background/90 hover:bg-background absolute top-3 left-3 rounded-md border p-1.5"
                    onClick={() => handleToggleBookmark(course.slug, course.bookmarked)}
                    disabled={isBookmarking}
                    aria-label={
                      course.bookmarked
                        ? t('discover.removeBookmark')
                        : t('discover.bookmarkCourse')
                    }
                  >
                    {course.bookmarked ? (
                      <BookmarkCheck className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </button>

                  <div className="absolute inset-0 flex items-center justify-center opacity-50">
                    {course.track === 'Core' && <Target className="h-14 w-14" />}
                    {course.track === 'Development' && <Wrench className="h-14 w-14" />}
                    {course.track === 'Payments' && <CreditCard className="h-14 w-14" />}
                    {course.track === 'NFTs' && <Palette className="h-14 w-14" />}
                    {course.track === 'DeFi' && <Coins className="h-14 w-14" />}
                    {!course.track && <BookOpen className="h-14 w-14" />}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    {course.enrolled ? (
                      <Badge className="border border-green-500/30 bg-green-500/20 text-green-700 backdrop-blur-sm">
                        <Check className="mr-1 h-3 w-3" /> {t('discover.enrolled')}
                      </Badge>
                    ) : (
                      <Badge className="border border-blue-500/30 bg-blue-500/20 text-blue-700 backdrop-blur-sm">
                        {t('discover.available')}
                      </Badge>
                    )}
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`capitalize ${difficultyColors[course.difficulty as keyof typeof difficultyColors]}`}
                    >
                      {t(`courses.filters.${course.difficulty}`)}
                    </Badge>
                    {course.track && (
                      <Badge variant="secondary" className="text-xs">
                        {course.track}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="group-hover:text-primary line-clamp-2 text-lg transition-colors">
                    {course.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex h-full flex-col justify-between">
                  <div>
                    <CardDescription className="mb-4 line-clamp-2">
                      {course.description}
                    </CardDescription>

                    <div className="text-muted-foreground mb-4 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.lessonsCount} {t('courses.card.lessons')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {Math.floor(course.duration / 60)}h {course.duration % 60}m
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        {course.xpReward} {t('dashboard.xp')}
                      </div>
                    </div>

                    {course.tags && course.tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-1">
                        {course.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {isSuccessful && (
                      <div className="flex items-center gap-2 rounded-md bg-green-50 p-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        {t('discover.enrolledSuccess')}
                      </div>
                    )}

                    {course.enrolled ? (
                      <div className="space-y-2">
                        {typeof course.enrollmentProgress === 'number' && (
                          <div className="mb-2">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{t('dashboard.progress')}</span>
                              <span className="font-semibold">{course.enrollmentProgress}%</span>
                            </div>
                            <Progress value={course.enrollmentProgress} className="h-2" />
                          </div>
                        )}
                        <Link href={`/courses/${course.slug}`} className="block">
                          <Button size="sm" className="w-full gap-2">
                            <PlayCircle className="h-4 w-4" />
                            {t('dashboard.continueLearning')}
                          </Button>
                        </Link>
                        <Link href="/courses" className="block">
                          <Button size="sm" variant="outline" className="w-full">
                            {t('discover.goToMyCourses')}
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleEnrollCourse(course.slug)}
                        disabled={isEnrolling}
                      >
                        {isEnrolling ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('learningPaths.enrolling')}
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4" />
                            {t('courses.detail.enroll')}
                          </>
                        )}
                      </Button>
                    )}
                    <Link href={`/courses/${course.slug}`} className="mt-2 block">
                      <Button size="sm" variant="ghost" className="w-full gap-2">
                        <Eye className="h-4 w-4" />
                        {t('learningPaths.viewDetails')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Filter className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">{t('discover.noCoursesFound')}</h3>
          <p className="text-muted-foreground">
            {t('discover.adjustSearchFilter')}
          </p>
        </div>
      )}
    </div>
  );
}
