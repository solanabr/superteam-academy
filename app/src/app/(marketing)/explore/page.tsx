'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks';
import {
  Search,
  Clock,
  BookOpen,
  Zap,
  Filter,
  ArrowRight,
  PlayCircle,
  Loader2,
  Wrench,
  CreditCard,
  Palette,
  Coins,
  Target,
  BookMarked,
  Check,
  GraduationCap,
  Eye,
} from 'lucide-react';
import type { CourseCatalogItem } from '@/types/course';

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

// Duration filter options (in minutes)
const durationFilters = [
  { value: 'all', label: 'Any Duration' },
  { value: '0-15', label: 'Under 15 min' },
  { value: '15-30', label: '15-30 min' },
  { value: '30-60', label: '30-60 min' },
  { value: '60-180', label: '1-3 hours' },
  { value: '180+', label: '3+ hours' },
];

interface CourseWithEnrollmentStatus extends CourseCatalogItem {
  enrolled: boolean;
}

export default function PublicCoursesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [courses, setCourses] = useState<CourseWithEnrollmentStatus[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Fetch all courses
        const coursesResponse = await fetch('/api/courses', { cache: 'no-store' });
        if (!coursesResponse.ok) {
          throw new Error('Failed to fetch courses');
        }

        const coursesData = await coursesResponse.json();
        let allCourses: CourseWithEnrollmentStatus[] = (coursesData.courses || []).map(
          (course: CourseCatalogItem) => ({
            ...course,
            enrolled: false,
          })
        );

        // If user is logged in, fetch their enrolled courses
        if (user) {
          try {
            const profileResponse = await fetch('/api/profile');
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              const enrolledCourseSlugs = new Set(
                (profileData.coursesEnrolled || []).map(
                  (enrollment: any) => enrollment.courseId?.slug
                )
              );

              // Mark enrolled courses
              allCourses = allCourses.map((course) => ({
                ...course,
                enrolled: enrolledCourseSlugs.has(course.slug),
              }));
            }
          } catch (error) {
            console.error('Error fetching enrollment data:', error);
          }
        }

        setCourses(allCourses);
        setTracks(coursesData.tracks || []);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  const handleEnrollCourse = async (courseSlug: string) => {
    if (!user) {
      return;
    }

    setEnrollingCourseId(courseSlug);
    try {
      const response = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug }),
      });

      if (!response.ok) {
        throw new Error('Failed to enroll in course');
      }

      // Update the course as enrolled
      setCourses((prev) =>
        prev.map((course) => (course.slug === courseSlug ? { ...course, enrolled: true } : course))
      );
    } catch (error) {
      console.error('Error enrolling in course:', error);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDifficulty =
        selectedDifficulty === 'all' || course.difficulty === selectedDifficulty;
      const matchesTrack = selectedTrack === 'all' || course.track === selectedTrack;

      // Duration filter (course.duration is in minutes)
      let matchesDuration = true;
      if (selectedDuration !== 'all') {
        const duration = course.duration || 0;
        switch (selectedDuration) {
          case '0-15':
            matchesDuration = duration < 15;
            break;
          case '15-30':
            matchesDuration = duration >= 15 && duration < 30;
            break;
          case '30-60':
            matchesDuration = duration >= 30 && duration < 60;
            break;
          case '60-180':
            matchesDuration = duration >= 60 && duration < 180;
            break;
          case '180+':
            matchesDuration = duration >= 180;
            break;
        }
      }

      return matchesSearch && matchesDifficulty && matchesTrack && matchesDuration;
    });
  }, [courses, searchQuery, selectedDifficulty, selectedTrack, selectedDuration]);

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <Badge variant="secondary" className="mb-4">
          <BookMarked className="mr-1 h-3 w-3" />
          Free Course Previews
        </Badge>
        <h1 className="mb-4 text-4xl font-bold">Explore Our Courses</h1>
        <p className="text-muted-foreground text-lg">
          Browse our comprehensive curriculum and preview any course before signing up. Start your
          Solana development journey today.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Duration Filter */}
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger className="w-[140px]">
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                {durationFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Learning Path Filter */}
            <Select value={selectedTrack} onValueChange={setSelectedTrack}>
              <SelectTrigger className="w-[160px]">
                <GraduationCap className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Learning Path" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Paths</SelectItem>
                {tracks.map((track) => (
                  <SelectItem key={track} value={track}>
                    {track}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Difficulty Tabs */}
        <Tabs value={selectedDifficulty} onValueChange={setSelectedDifficulty} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Levels</TabsTrigger>
            <TabsTrigger value="beginner">Beginner</TabsTrigger>
            <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const isEnrolling = enrollingCourseId === course.slug;

            return (
              <Card
                key={course.slug}
                className="group hover:border-primary/50 relative h-full transition-all hover:shadow-lg"
              >
                {/* Course Thumbnail */}
                <div className="relative h-40 overflow-hidden rounded-t-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  {course.thumbnail ? (
                    <Image
                      src={course.thumbnail}
                      alt={course.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-50">
                      {course.track === 'Core' && <Target className="h-14 w-14" />}
                      {course.track === 'Development' && <Wrench className="h-14 w-14" />}
                      {course.track === 'Payments' && <CreditCard className="h-14 w-14" />}
                      {course.track === 'NFTs' && <Palette className="h-14 w-14" />}
                      {course.track === 'DeFi' && <Coins className="h-14 w-14" />}
                      {!course.track && <BookOpen className="h-14 w-14" />}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {course.enrolled && (
                      <Badge className="border border-green-500/30 bg-green-500/20 text-green-700 backdrop-blur-sm">
                        <Check className="mr-1 h-3 w-3" /> Enrolled
                      </Badge>
                    )}
                    {!course.enrolled && (
                      <Badge className="bg-background/80 text-foreground backdrop-blur-sm">
                        Available
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
                      {course.difficulty}
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
                        {course.lessonsCount} lessons
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {Math.floor(course.duration / 60)}h {course.duration % 60}m
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        {course.xpReward} XP
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

                  {/* Action Buttons */}
                  <div className="mt-4">
                    {course.enrolled ? (
                      <Link href={`/courses/${course.slug}`} className="block">
                        <Button size="sm" className="w-full gap-2">
                          <PlayCircle className="h-4 w-4" />
                          Continue Learning
                        </Button>
                      </Link>
                    ) : user ? (
                      <Button
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleEnrollCourse(course.slug)}
                        disabled={isEnrolling}
                      >
                        {isEnrolling ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4" />
                            Enroll Now
                          </>
                        )}
                      </Button>
                    ) : (
                      <Link href="/auth/signin" className="w-full">
                        <Button size="sm" variant="outline" className="w-full gap-2">
                          <PlayCircle className="h-4 w-4" />
                          Sign In to Enroll
                        </Button>
                      </Link>
                    )}
                    <Link href={`/explore/${course.slug}`} className="mt-2 block">
                      <Button size="sm" variant="ghost" className="w-full gap-2">
                        <Eye className="h-4 w-4" />
                        View Details
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
          <h3 className="mb-2 text-lg font-semibold">No courses found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter to find what you&apos;re looking for.
          </p>
        </div>
      )}

      {/* CTA Section */}
      <div className="mt-16 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-8 text-center md:p-12">
        <h2 className="mb-4 text-2xl font-bold md:text-3xl">Ready to Start Learning?</h2>
        <p className="text-muted-foreground mx-auto mb-6 max-w-2xl">
          Connect your wallet to track progress, earn XP, unlock achievements, and receive on-chain
          credentials when you complete courses.
        </p>
        <Button size="lg" asChild>
          <Link href="/auth/signin">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
