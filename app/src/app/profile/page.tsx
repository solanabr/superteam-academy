'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/providers/auth-provider'
import { learningProgressService } from '@/services/learning-progress.service'
import { courseService } from '@/services/course.service'
import type { Course, Progress as CourseProgress, User } from '@/types'
import {
  MapPin,
  Calendar,
  Award,
  Trophy,
  BookOpen,
  Zap,
  Github,
  Globe,
  Mail,
  Edit,
  Share2,
  Download,
  ExternalLink,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Star,
  Flame
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatXP, calculateLevel, calculateXPForNextLevel, calculateXPProgress } from '@/lib/utils'
import Link from 'next/link'

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

interface ProfileStats {
  totalXP: number
  currentLevel: number
  coursesCompleted: number
  coursesInProgress: number
  achievementsUnlocked: number
  currentStreak: number
  longestStreak: number
  totalHoursLearned: number
  globalRank: number
}

interface CompletedCourse extends Course {
  completedAt: string
  finalScore: number
  timeSpent: number
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ProfileStats>({
    totalXP: 0,
    currentLevel: 0,
    coursesCompleted: 0,
    coursesInProgress: 0,
    achievementsUnlocked: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalHoursLearned: 0,
    globalRank: 0
  })
  const [completedCourses, setCompletedCourses] = useState<CompletedCourse[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (user) {
      loadProfileData()
    }
  }, [user])

  const loadProfileData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Load user XP and calculate level
      const totalXP = await learningProgressService.getXP(user.id)
      const currentLevel = calculateLevel(totalXP)

      // Load user progress
      const userProgress = await learningProgressService.getUserProgress(user.id)

      // Load streak data
      const streakData = await learningProgressService.getStreak(user.id)

      // Load all courses to match with progress
      const allCourses = await courseService.getCourses()

      // Calculate completed courses
      const completedCoursesList: CompletedCourse[] = []
      let coursesInProgress = 0

      for (const progress of userProgress) {
        const course = allCourses.find(c => c.id === progress.courseId)
        if (course) {
          const isCompleted = progress.completedLessons.length === course.totalLessons
          if (isCompleted && progress.completedAt) {
            completedCoursesList.push({
              ...course,
              completedAt: progress.completedAt,
              finalScore: progress.score,
              timeSpent: progress.timeSpent
            })
          } else if (progress.completedLessons.length > 0) {
            coursesInProgress++
          }
        }
      }

      // Mock some additional stats
      const achievementsUnlocked = 3 // Would be calculated from user.achievements bitmap
      const totalMinutes = userProgress.reduce((total, p) => total + p.timeSpent, 0)
      const totalHoursLearned = Math.round(totalMinutes / 60)
      const globalRank = 1247 // Would come from leaderboard

      setStats({
        totalXP,
        currentLevel,
        coursesCompleted: completedCoursesList.length,
        coursesInProgress,
        achievementsUnlocked,
        currentStreak: streakData.current,
        longestStreak: streakData.longest,
        totalHoursLearned,
        globalRank
      })

      setCompletedCourses(completedCoursesList)
    } catch (error) {
      console.error('Failed to load profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const achievements = [
    { id: 1, name: 'First Steps', description: 'Complete your first lesson', icon: '👶', unlocked: true },
    { id: 2, name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', unlocked: true },
    { id: 3, name: 'Code Crusher', description: 'Complete your first challenge', icon: '⚡', unlocked: true },
    { id: 4, name: 'Knowledge Seeker', description: 'Complete 5 courses', icon: '📚', unlocked: false },
    { id: 5, name: 'Master Builder', description: 'Complete an advanced course', icon: '🏗️', unlocked: false },
    { id: 6, name: 'Community Helper', description: 'Help 10 other learners', icon: '🤝', unlocked: false },
  ]

  const skills = [
    { name: 'Solana Development', level: 85 },
    { name: 'Rust Programming', level: 72 },
    { name: 'Blockchain Architecture', level: 68 },
    { name: 'Smart Contracts', level: 45 },
    { name: 'Web3 Integration', level: 38 },
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Please sign in to view your profile</h2>
            <Button asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container py-8">
        {/* Profile Header */}
        <motion.div
          className="mb-8"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <Card className="relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10" />
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
            
            <CardContent className="relative pt-8 pb-6">
              <motion.div variants={fadeInUp}>
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                    <AvatarImage src={user.avatar} alt={user.displayName} />
                    <AvatarFallback className="text-2xl">
                      {user.displayName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                      <h1 className="text-3xl font-bold">{user.displayName}</h1>
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <div className="level-indicator">
                          {stats.currentLevel}
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          #{stats.globalRank}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4">@{user.username}</p>
                    
                    {user.bio && (
                      <p className="text-sm mb-4 max-w-2xl">{user.bio}</p>
                    )}

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Joined {new Date(user.joinDate).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </div>
                      {user.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
                      <div className="xp-badge">
                        <Zap className="h-3 w-3" />
                        {formatXP(stats.totalXP)} XP
                      </div>
                      <div className="achievement-badge">
                        <Flame className="h-3 w-3" />
                        {stats.currentStreak} day streak
                      </div>
                      <Badge variant="outline">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {stats.coursesCompleted} courses completed
                      </Badge>
                    </div>

                    {/* XP Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Level Progress</span>
                        <span>
                          Level {stats.currentLevel} → {stats.currentLevel + 1}
                        </span>
                      </div>
                      <Progress 
                        value={calculateXPProgress(stats.totalXP, stats.currentLevel)} 
                        className="h-3" 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatXP(stats.currentLevel * stats.currentLevel * 100)} XP</span>
                        <span>{formatXP(calculateXPForNextLevel(stats.currentLevel))} XP</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button size="sm" asChild>
                      <Link href="/settings">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Tabs */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {stats.coursesCompleted}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Completed
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-500">
                          {stats.coursesInProgress}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          In Progress
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-500">
                          {stats.totalHoursLearned}h
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Time Learned
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-500">
                          {stats.achievementsUnlocked}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Achievements
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Courses */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Courses</CardTitle>
                      <CardDescription>
                        Your latest completed courses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {completedCourses.length > 0 ? (
                        <div className="space-y-4">
                          {completedCourses.slice(0, 3).map((course) => (
                            <div
                              key={course.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-solana rounded-lg flex items-center justify-center">
                                  <BookOpen className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{course.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Completed {new Date(course.completedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-green-600">
                                  {course.finalScore}%
                                </div>
                                <div className="xp-badge text-xs">
                                  <Zap className="h-2 w-2" />
                                  {course.xpReward} XP
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-2" />
                          <p>No completed courses yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Learning Streak */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-orange-500" />
                        Learning Streak
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-500 mb-2">
                          {stats.currentStreak}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Current streak (days)
                        </p>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Best: </span>
                          <span className="font-semibold">{stats.longestStreak} days</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Download Certificates
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Profile
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Public Profile
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Courses</CardTitle>
                  <CardDescription>
                    All courses you've successfully completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {completedCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {completedCourses.map((course) => (
                        <Card key={course.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <Badge
                                  variant="outline"
                                  className="difficulty-beginner capitalize"
                                >
                                  {course.difficulty}
                                </Badge>
                                <div className="text-right text-sm">
                                  <div className="font-bold text-green-600">
                                    {course.finalScore}%
                                  </div>
                                  <div className="text-muted-foreground">Score</div>
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="font-semibold line-clamp-1">
                                  {course.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Completed {new Date(course.completedAt).toLocaleDateString()}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <div className="xp-badge">
                                  <Zap className="h-3 w-3" />
                                  {course.xpReward} XP
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {Math.round(course.timeSpent / 60)}h
                                </div>
                              </div>

                              <Button size="sm" variant="outline" className="w-full">
                                <Award className="h-4 w-4 mr-2" />
                                View Certificate
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="h-16 w-16 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No completed courses</h3>
                      <p className="mb-4">Start learning to see your achievements here</p>
                      <Button asChild>
                        <Link href="/courses">Browse Courses</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                  <CardDescription>
                    Your learning milestones and accomplishments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map((achievement) => (
                      <Card
                        key={achievement.id}
                        className={cn(
                          'transition-all',
                          achievement.unlocked 
                            ? 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20' 
                            : 'opacity-60'
                        )}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-3xl mb-2">{achievement.icon}</div>
                          <h3 className="font-semibold mb-1">{achievement.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {achievement.description}
                          </p>
                          {achievement.unlocked ? (
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Unlocked
                            </Badge>
                          ) : (
                            <Badge variant="outline">Locked</Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Skill Levels</CardTitle>
                  <CardDescription>
                    Your expertise across different technologies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {skills.map((skill, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{skill.name}</h3>
                          <span className="text-sm font-semibold">{skill.level}%</span>
                        </div>
                        <Progress value={skill.level} className="h-3" />
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Skills are automatically updated based on your course completions
                    </p>
                    <Button variant="outline" asChild>
                      <Link href="/courses">Continue Learning</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}