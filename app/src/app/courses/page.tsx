'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/providers/auth-provider'
import { courseService } from '@/services/course.service'
import { learningProgressService } from '@/services/learning-progress.service'
import type { Course, Progress, CourseFilters } from '@/types'
import {
  Search,
  BookOpen,
  Clock,
  Zap,
  Users,
  Filter,
  Grid,
  List,
  Star,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatXP } from '@/lib/utils'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
}

interface CourseWithProgress extends Course {
  progress?: Progress
}

export default function CoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<CourseFilters>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'difficulty' | 'duration'>('popular')

  useEffect(() => {
    loadCourses()
  }, [filters, user])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const coursesData = await courseService.getCourses(filters)
      
      // Load progress for signed-in users
      if (user) {
        const coursesWithProgress = await Promise.all(
          coursesData.map(async (course) => {
            try {
              const progress = await learningProgressService.getProgress(user.id, course.id)
              return { ...course, progress }
            } catch {
              return course
            }
          })
        )
        setCourses(coursesWithProgress)
      } else {
        setCourses(coursesData)
      }
    } catch (error) {
      console.error('Failed to load courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.tags.some(tag => tag.toLowerCase().includes(query)) ||
        course.category.toLowerCase().includes(query)
      )
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        break
      case 'popular':
        // Mock popularity based on XP reward (would be actual enrollment numbers)
        filtered.sort((a, b) => b.xpReward - a.xpReward)
        break
      case 'difficulty':
        const difficultyOrder = { 'beginner': 0, 'intermediate': 1, 'advanced': 2 }
        filtered.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty])
        break
      case 'duration':
        filtered.sort((a, b) => a.duration - b.duration)
        break
    }

    return filtered
  }, [courses, searchQuery, sortBy])

  const categories = ['All', 'Blockchain Development', 'Framework', 'NFTs', 'DeFi', 'Smart Contracts']
  const difficulties = ['All', 'beginner', 'intermediate', 'advanced']

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
            Explore Courses
          </h1>
          <p className="text-lg text-muted-foreground">
            Master Solana development with hands-on courses designed by experts
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="mb-8 space-y-4"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select
                value={filters.category || 'All'}
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, category: value === 'All' ? undefined : value }))
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.difficulty || 'All'}
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, difficulty: value === 'All' ? undefined : value as any }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty === 'All' ? 'All Levels' : 
                       difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as any)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground">
                {filteredAndSortedCourses.length} course{filteredAndSortedCourses.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Courses Grid */}
        <motion.div
          className={cn(
            'grid gap-6',
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1 max-w-4xl mx-auto'
          )}
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="h-full">
                  <div className="aspect-video bg-muted animate-pulse rounded-t-lg" />
                  <CardHeader>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-6 bg-muted animate-pulse rounded" />
                      <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-10 bg-muted animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            filteredAndSortedCourses.map((course) => (
              <motion.div key={course.id} variants={fadeInUp}>
                <Card className={cn(
                  'course-card h-full',
                  viewMode === 'list' && 'flex flex-row'
                )}>
                  <div className={cn(
                    'bg-gradient-solana flex items-center justify-center',
                    viewMode === 'grid' 
                      ? 'aspect-video rounded-t-lg' 
                      : 'w-48 rounded-l-lg'
                  )}>
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn(
                                'capitalize',
                                course.difficulty === 'beginner' && 'difficulty-beginner',
                                course.difficulty === 'intermediate' && 'difficulty-intermediate',
                                course.difficulty === 'advanced' && 'difficulty-advanced'
                              )}
                            >
                              {course.difficulty}
                            </Badge>
                            {course.progress && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                {Math.round((course.progress.completedLessons.length / course.totalLessons) * 100)}% Complete
                              </Badge>
                            )}
                          </div>
                          <CardTitle className={cn(
                            viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1'
                          )}>
                            {course.title}
                          </CardTitle>
                        </div>
                        <div className="xp-badge shrink-0">
                          <Zap className="h-3 w-3" />
                          {formatXP(course.xpReward)} XP
                        </div>
                      </div>
                      
                      <CardDescription className={cn(
                        viewMode === 'grid' ? 'line-clamp-3' : 'line-clamp-2'
                      )}>
                        {course.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {course.totalLessons} lessons
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {course.duration}h
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>4.8</span>
                          </div>
                        </div>

                        {course.progress ? (
                          <div className="space-y-2">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{
                                  width: `${(course.progress.completedLessons.length / course.totalLessons) * 100}%`
                                }}
                              />
                            </div>
                            <Button className="w-full" asChild>
                              <Link href={`/courses/${course.slug}`}>
                                Continue Course
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          <Button className="w-full" asChild>
                            <Link href={`/courses/${course.slug}`}>
                              {user ? 'Start Course' : 'View Course'}
                            </Link>
                          </Button>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {course.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>

        {!loading && filteredAndSortedCourses.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters to find more courses.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setFilters({})
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}