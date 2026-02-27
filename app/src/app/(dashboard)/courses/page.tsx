'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/hooks/use-translation';
import {
  Search,
  Clock,
  BookOpen,
  Zap,
  Filter,
  CheckCircle2,
  PlayCircle,
  ChevronRight,
  Wrench,
  CreditCard,
  Palette,
  Coins,
  Target,
  Trophy,
} from 'lucide-react';
import type { CourseCatalogItem } from '@/types/course';

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

interface EnrolledCourse extends CourseCatalogItem {
  enrollmentId: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  status: 'in-progress' | 'completed';
  lastAccessedAt: string;
  certificateIssued: boolean;
}

export default function MyCoursesPage() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch enrolled courses');
        }

        const data = await response.json();
        const enrolledCourses = data.coursesEnrolled || [];

        // Transform enrolled courses to include progress data
        const formattedCourses: EnrolledCourse[] = enrolledCourses.map((enrollment: any) => ({
          id: enrollment.courseId?._id || '',
          slug: enrollment.courseId?.slug || '',
          title: enrollment.courseId?.title || 'Unknown Course',
          description: enrollment.courseId?.description || '',
          difficulty: enrollment.courseId?.difficulty || 'beginner',
          track: enrollment.courseId?.track || '',
          tags: enrollment.courseId?.tags || [],
          duration: enrollment.courseId?.duration || 0,
          lessonsCount: enrollment.total_lessons || 0,
          xpReward: enrollment.courseId?.xpReward || 0,
          enrollmentId: enrollment._id,
          progress: enrollment.progress_percentage || 0,
          lessonsCompleted: enrollment.lessons_completed || 0,
          totalLessons: enrollment.total_lessons || 0,
          status: enrollment.completed_at ? 'completed' : 'in-progress',
          lastAccessedAt: new Date(enrollment.last_accessed_at).toLocaleDateString(),
          certificateIssued: enrollment.certificate_issued || false,
        }));

        setCourses(formattedCourses);

        // Extract unique tracks
        const uniqueTracks = [...new Set(formattedCourses.map((c) => c.track).filter(Boolean))];
        setTracks(uniqueTracks as string[]);
      } catch (error) {
        console.error('Error loading enrolled courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDifficulty =
        selectedDifficulty === 'all' || course.difficulty === selectedDifficulty;
      const matchesTrack = selectedTrack === 'all' || course.track === selectedTrack;
      const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
      return matchesSearch && matchesDifficulty && matchesTrack && matchesStatus;
    });
  }, [courses, searchQuery, selectedDifficulty, selectedTrack, filterStatus]);

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">
          {courses.length === 0
            ? "You haven't enrolled in any courses yet. Visit Explore Courses to get started."
            : `You're enrolled in ${courses.length} course${courses.length !== 1 ? 's' : ''}. Continue where you left off.`}
        </p>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/discover">
              <ChevronRight className="mr-2 h-4 w-4" />
              Explore More Courses
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      {courses.length > 0 && (
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search your courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs
              value={selectedDifficulty}
              onValueChange={setSelectedDifficulty}
              className="w-full md:w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">All Levels</TabsTrigger>
                <TabsTrigger value="beginner">Beginner</TabsTrigger>
                <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      {/* Course Grid */}
      {loading ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Loading your courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-xl font-semibold">No courses yet</h3>
            <p className="text-muted-foreground mb-6">
              Start learning by exploring our course catalog
            </p>
            <Button asChild>
              <Link href="/explore">
                Explore Courses
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredCourses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card key={course.slug} className="group h-full transition-all hover:shadow-lg">
                {/* Thumbnail */}
                <div className="relative h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <div className="absolute inset-0 flex items-center justify-center opacity-50">
                    {course.track === 'Core' && <Target className="h-14 w-14" />}
                    {course.track === 'Development' && <Wrench className="h-14 w-14" />}
                    {course.track === 'Payments' && <CreditCard className="h-14 w-14" />}
                    {course.track === 'NFTs' && <Palette className="h-14 w-14" />}
                    {course.track === 'DeFi' && <Coins className="h-14 w-14" />}
                    {!course.track && <BookOpen className="h-14 w-14" />}
                  </div>
                  {course.status === 'completed' && (
                    <div className="absolute top-3 right-3">
                      <Badge className="gap-1 bg-green-500 text-white">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`capitalize ${difficultyColors[course.difficulty as keyof typeof difficultyColors]}`}
                    >
                      {course.difficulty}
                    </Badge>
                    {course.track && (
                      <Badge variant="secondary" className="text-xs">
                        {course.track}
                      </Badge>
                    )}
                    {course.certificateIssued && (
                      <Badge variant="outline" className="bg-purple-500/10 text-xs text-purple-600">
                        <Trophy className="mr-1 h-3 w-3" />
                        Certificate
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="group-hover:text-primary line-clamp-2 text-lg">
                    {course.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    <p className="text-muted-foreground text-xs">
                      {course.lessonsCompleted} of {course.totalLessons} lessons
                    </p>
                  </div>

                  <div className="text-muted-foreground flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last accessed {course.lastAccessedAt}
                    </div>
                  </div>

                  <Button className="w-full" size="sm" asChild>
                    <Link href={`/courses/${course.slug}`}>
                      {course.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          View Course
                        </>
                      ) : (
                        <>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Continue Learning
                        </>
                      )}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No courses found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter to find what you&apos;re looking for.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
