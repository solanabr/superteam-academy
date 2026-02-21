'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/providers/auth-provider'
import { learningProgressService } from '@/services/learning-progress.service'
import { courseService } from '@/services/course.service'
import type { Course, Progress as CourseProgress, StreakData, ActivityFeedItem, LeaderboardEntry } from '@/types'
import {
  BookOpen,
  TrendingUp,
  Trophy,
  Clock,
  Zap,
  Star,
  Calendar,
  Target,
  Award,
  ChevronRight,
  PlayCircle,
  CheckCircle,
  Flame,
  Users,
  Rocket,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatXP, calculateLevel, calculateXPForNextLevel, calculateXPProgress } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

interface CourseWithProgress extends Course {
  progress: CourseProgress
}

interface DashboardStats {
  totalXP: number
  currentLevel: number
  coursesInProgress: number
  coursesCompleted: number
  currentStreak: number
  totalHoursLearned: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalXP: 0,
    currentLevel: 0,
    coursesInProgress: 0,
    coursesCompleted: 0,
    currentStreak: 0,
    totalHoursLearned: 0
  })
  const [coursesInProgress, setCoursesInProgress] = useState<CourseWithProgress[]>([])
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([])
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/signin')
      return
    }
    loadDashboardData()
  }, [user, router])

  const loadDashboardData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Load user XP and calculate level
      const totalXP = await learningProgressService.getXP(user.id)
      const currentLevel = calculateLevel(totalXP)
      
      // Load user progress for all courses
      const userProgress = await learningProgressService.getUserProgress(user.id)
      
      // Load all courses to match with progress
      const allCourses = await courseService.getCourses()
      
      // Combine courses with progress
      const coursesWithProgress: CourseWithProgress[] = []
      let completedCourses = 0
      
      for (const progress of userProgress) {
        const course = allCourses.find(c => c.id === progress.courseId)
        if (course) {
          const isCompleted = progress.completedLessons.length === course.totalLessons
          if (isCompleted) {
            completedCourses++
          } else if (progress.completedLessons.length > 0) {
            coursesWithProgress.push({ ...course, progress })
          }
        }
      }

      // Load streak data
      const streakData = await learningProgressService.getStreak(user.id)
      
      // Load leaderboard
      const leaderboardData = await learningProgressService.getLeaderboard('alltime')

      // Get recommended courses (exclude already enrolled)
      const enrolledCourseIds = new Set(userProgress.map(p => p.courseId))
      const recommended = allCourses
        .filter(course => !enrolledCourseIds.has(course.id))
        .slice(0, 3)

      // Mock activity feed (in real app, this would come from the service)
      const mockActivityFeed: ActivityFeedItem[] = [
        {
          id: '1',
          userId: user.id,
          type: 'lesson_completed',
          title: 'Completed "Understanding Accounts"',
          description: 'Earned 30 XP in Solana Fundamentals',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          metadata: { xpGained: 30, courseId: 'solana-fundamentals' }
        },
        {
          id: '2',
          userId: user.id,
          type: 'achievement_unlocked',
          title: 'Achievement Unlocked: First Steps',
          description: 'Completed your first lesson',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          metadata: { achievementId: 0, xpGained: 25 }
        },
        {
          id: '3',
          userId: user.id,
          type: 'course_completed',
          title: 'Course Completed: Solana Fundamentals',
          description: 'Earned 1500 XP and a completion certificate',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          metadata: { xpGained: 1500, courseId: 'solana-fundamentals' }
        }
      ]

      // Calculate total hours learned (mock calculation)
      const totalMinutes = userProgress.reduce((total, progress) => total + progress.timeSpent, 0)
      const totalHoursLearned = Math.round(totalMinutes / 60)

      setStats({
        totalXP,
        currentLevel,
        coursesInProgress: coursesWithProgress.length,
        coursesCompleted: completedCourses,
        currentStreak: streakData.current,
        totalHoursLearned
      })
      
      setCoursesInProgress(coursesWithProgress)
      setRecommendedCourses(recommended)
      setStreakData(streakData)
      setActivityFeed(mockActivityFeed)
      setLeaderboard(leaderboardData.slice(0, 5))
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStreakCalendar = () => {
    if (!streakData) return null

    // Generate last 7 days
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const isActive = streakData.monthlyActivity[dateStr] > 0
      const isToday = i === 0

      days.push(
        <div
          key={dateStr}
          className={cn(
            'w-4 h-4 rounded-sm border transition-colors',
            isActive ? 'bg-gradient-solana border-primary' : 'bg-muted border-border',
            isToday && 'ring-2 ring-primary ring-offset-2'
          )}
          title={`${date.toLocaleDateString()}: ${isActive ? 'Active' : 'No activity'}`}
        />
      )
    }

    return <div className="flex gap-1">{days}</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-8">
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-muted rounded-lg" />
                <div className="h-48 bg-muted rounded-lg" />
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-muted rounded-lg" />
                <div className="h-48 bg-muted rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.displayName}! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Continue your Solana development journey
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                <Zap className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatXP(stats.totalXP)}</div>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="level-indicator text-sm">
                    {stats.currentLevel}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">
                      Level {stats.currentLevel} → {stats.currentLevel + 1}
                    </div>
                    <Progress 
                      value={calculateXPProgress(stats.totalXP, stats.currentLevel)} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.currentStreak} days</div>
                <div className="mt-3">
                  {renderStreakCalendar()}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Courses Progress</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.coursesInProgress + stats.coursesCompleted}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.coursesCompleted} completed, {stats.coursesInProgress} in progress
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Learned</CardTitle>
                <Clock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalHoursLearned}h</div>
                <p className="text-xs text-muted-foreground">
                  Across all courses
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Courses in Progress */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Continue Learning</CardTitle>
                  <CardDescription>
                    Pick up where you left off
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {coursesInProgress.length > 0 ? (
                    <div className="space-y-4">
                      {coursesInProgress.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-12 h-12 bg-gradient-solana rounded-lg flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{course.title}</h3>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="text-sm text-muted-foreground">
                                {course.progress.completedLessons.length}/{course.totalLessons} lessons
                              </div>
                              <div className="xp-badge text-xs">
                                <Zap className="h-2 w-2" />
                                {course.progress.xpEarned}/{course.xpReward} XP
                              </div>
                            </div>
                            <Progress 
                              value={(course.progress.completedLessons.length / course.totalLessons) * 100}
                              className="mt-2 h-2"
                            />
                          </div>
                          
                          <Button asChild>
                            <Link href={`/courses/${course.slug}`}>
                              Continue
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No courses in progress</h3>
                      <p className="text-muted-foreground mb-4">Start a new course to begin learning</p>
                      <Button asChild>
                        <Link href="/courses">Browse Courses</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recommended Courses */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Recommended for You</CardTitle>
                  <CardDescription>
                    Courses tailored to your learning journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendedCourses.map((course) => (
                      <div
                        key={course.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
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
                            <div className="xp-badge">
                              <Zap className="h-3 w-3" />
                              {formatXP(course.xpReward)} XP
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold line-clamp-1">{course.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {course.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{course.totalLessons} lessons</span>
                            <span>{course.duration}h</span>
                          </div>
                          
                          <Button size="sm" className="w-full" asChild>
                            <Link href={`/courses/${course.slug}`}>
                              Start Course
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-center">
                    <Button variant="outline" asChild>
                      <Link href="/courses">View All Courses</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your learning milestones and achievements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityFeed.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          item.type === 'lesson_completed' && 'bg-blue-100 dark:bg-blue-900',
                          item.type === 'achievement_unlocked' && 'bg-yellow-100 dark:bg-yellow-900',
                          item.type === 'course_completed' && 'bg-green-100 dark:bg-green-900'
                        )}>
                          {item.type === 'lesson_completed' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                          {item.type === 'achievement_unlocked' && <Trophy className="h-4 w-4 text-yellow-600" />}
                          {item.type === 'course_completed' && <Award className="h-4 w-4 text-green-600" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Global Rank</span>
                    <span className="font-semibold">#1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Achievements</span>
                    <span className="font-semibold">3/50</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Study Streak</span>
                    <span className="font-semibold">{stats.currentStreak} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Certificates</span>
                    <span className="font-semibold">{stats.coursesCompleted}</span>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                    <Link href="/profile">View Profile</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Leaderboard Preview */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div key={entry.userId} className="flex items-center space-x-3">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        index === 0 && 'bg-yellow-500 text-white',
                        index === 1 && 'bg-gray-400 text-white',
                        index === 2 && 'bg-orange-500 text-white',
                        index > 2 && 'bg-muted text-muted-foreground'
                      )}>
                        {index + 1}
                      </div>
                      
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={entry.avatar} alt={entry.displayName} />
                        <AvatarFallback className="text-xs">
                          {entry.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {entry.displayName}
                        </p>
                      </div>
                      
                      <div className="text-xs font-medium">
                        {formatXP(entry.xp)}
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                    <Link href="/leaderboard">View Full Leaderboard</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Study Goal */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    Daily Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">30 min study time</span>
                      <span className="text-sm font-semibold">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      20 minutes completed today
                    </p>
                    
                    <Button size="sm" className="w-full mt-3" asChild>
                      <Link href="/courses">Continue Learning</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}