'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Zap,
  Star,
  Clock,
  Users,
  BookOpen,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MOCK_COURSES } from '@/services/mock-data';
import { DIFFICULTY_CONFIG, TRACK_INFO } from '@/config/constants';
import { Course, LearningTrack } from '@/types';

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');

  const filteredCourses = useMemo(() => {
    let courses = [...MOCK_COURSES];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      courses = courses.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.includes(q))
      );
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      courses = courses.filter((c) => c.difficulty === selectedDifficulty);
    }

    // Track filter
    if (selectedTrack !== 'all') {
      courses = courses.filter((c) => c.track === selectedTrack);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        courses.sort((a, b) => b.enrollmentCount - a.enrollmentCount);
        break;
      case 'newest':
        courses.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'rating':
        courses.sort((a, b) => b.rating - a.rating);
        break;
      case 'difficulty':
        const diffOrder = { beginner: 0, intermediate: 1, advanced: 2, legendary: 3 };
        courses.sort(
          (a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty]
        );
        break;
    }

    return courses;
  }, [searchQuery, selectedDifficulty, selectedTrack, sortBy]);

  const hasFilters =
    searchQuery || selectedDifficulty !== 'all' || selectedTrack !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty('all');
    setSelectedTrack('all');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-border/40 gradient-quest">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge variant="outline" className="mb-4">
              Quest Board
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Explore Quests
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Choose your next adventure. Each quest levels up your skills and
              earns you XP and on-chain credentials.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tracks</SelectItem>
                  {Object.entries(TRACK_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.icon} {info.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters */}
          {hasFilters && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">
                {filteredCourses.length} results
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-7 gap-1"
              >
                <X className="h-3 w-3" />
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No quests found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your filters or search query
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const diffConfig = DIFFICULTY_CONFIG[course.difficulty];
  const trackInfo = TRACK_INFO[course.track];
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/courses/${course.slug}`}>
        <Card className="group cursor-pointer border-border/50 hover:border-primary/30 transition-all hover:shadow-lg overflow-hidden h-full">
          {/* Thumbnail */}
          <div
            className="h-44 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${trackInfo.color}25, ${trackInfo.color}08)`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl opacity-20 group-hover:scale-110 transition-transform duration-500">
                {trackInfo.icon}
              </span>
            </div>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge
                variant="secondary"
                className="text-xs backdrop-blur-sm"
                style={{
                  backgroundColor: `${diffConfig.color}20`,
                  color: diffConfig.color,
                  borderColor: `${diffConfig.color}30`,
                }}
              >
                {diffConfig.icon} {diffConfig.label}
              </Badge>
            </div>
            <div className="absolute top-3 right-3">
              <Badge
                variant="secondary"
                className="text-xs gap-1 backdrop-blur-sm"
              >
                <Zap className="h-3 w-3 text-quest-gold" />
                {course.totalXP.toLocaleString()} XP
              </Badge>
            </div>

            {/* Enrollment count */}
            <div className="absolute bottom-3 left-3">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {course.enrollmentCount.toLocaleString()} enrolled
              </span>
            </div>
          </div>

          <CardContent className="p-5">
            {/* Track */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{trackInfo.icon}</span>
              <span className="text-xs text-muted-foreground font-medium">
                {trackInfo.name}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {course.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {course.shortDescription}
            </p>

            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {totalLessons} lessons
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-quest-gold fill-quest-gold" />
                <span>{course.rating}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
