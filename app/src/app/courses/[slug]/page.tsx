'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/providers/auth-provider'
import { courseService } from '@/services/course.service'
import { learningProgressService } from '@/services/learning-progress.service'
import type { Course, Progress as CourseProgress, Module, Lesson } from '@/types'
import {
  Play,
  Lock,
  CheckCircle,
  Clock,
  BookOpen,
  Zap,
  Users,
  Star,
  ChevronDown,
  ChevronRight,
  Trophy,
  Target,
  Globe,
  Code,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatXP, calculateLevel } from '@/lib/utils'
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

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [openModules, setOpenModules] = useState<Set<string>>(new Set())
  const [isEnrolled, setIsEnrolled] = useState(false)

  useEffect(() => {
    if (params.slug) {
      loadCourseData(params.slug as string)
    }
  }, [params.slug, user])

  const loadCourseData = async (slug: string) => {
    setLoading(true)
    try {
      const courseData = await courseService.getCourse(slug)
      if (!courseData) {
        router.push('/courses')
        return
      }
      
      setCourse(courseData)

      // Load progress if user is signed in
      if (user) {
        try {
          const progressData = await learningProgressService.getProgress(user.id, courseData.id)
          setProgress(progressData)
          setIsEnrolled(progressData.completedLessons.length > 0 || progressData.xpEarned > 0)
          
          // Open first module by default
          setOpenModules(new Set([courseData.modules[0]?.id]))
        } catch (error) {
          console.error('Failed to load progress:', error)
        }
      }
    } catch (error) {
      console.error('Failed to load course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!user || !course) return

    try {
      // Create initial progress
      await learningProgressService.updateProgress({
        userId: user.id,
        courseId: course.id,
        completedLessons: [],
        completedChallenges: [],
        score: 0,
        xpEarned: 0,
        startedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        timeSpent: 0
      })

      setIsEnrolled(true)
      
      // Navigate to first lesson
      const firstLesson = course.modules[0]?.lessons[0]
      if (firstLesson) {
        router.push(`/courses/${course.slug}/lessons/${firstLesson.id}`)
      }
    } catch (error) {
      console.error('Failed to enroll:', error)
    }
  }

  const toggleModule = (moduleId: string) => {
    const newOpenModules = new Set(openModules)
    if (newOpenModules.has(moduleId)) {
      newOpenModules.delete(moduleId)
    } else {
      newOpenModules.add(moduleId)
    }
    setOpenModules(newOpenModules)
  }

  const isLessonCompleted = (lessonId: string) => {
    return progress?.completedLessons.includes(lessonId) || false
  }

  const getModuleProgress = (module: Module) => {
    if (!progress) return 0
    const completedInModule = module.lessons.filter(lesson => 
      progress.completedLessons.includes(lesson.id)
    ).length
    return (completedInModule / module.lessons.length) * 100
  }

  const getOverallProgress = () => {
    if (!progress || !course) return 0
    return (progress.completedLessons.length / course.totalLessons) * 100
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Course not found</h2>
            <p className="text-muted-foreground mb-8">The course you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/courses">Browse Courses</Link>
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
        {/* Breadcrumb */}
        <motion.div
          className="mb-6"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <Link href="/courses" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={stagger}
            >
              <motion.div variants={fadeInUp}>
                <div className="aspect-video bg-gradient-solana rounded-lg flex items-center justify-center mb-6">
                  <BookOpen className="h-20 w-20 text-white" />
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="space-y-4">
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
                  <Badge variant="outline">{course.category}</Badge>
                  {isEnrolled && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">
                      Enrolled
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {course.title}
                </h1>

                <p className="text-xl text-muted-foreground">
                  {course.description}
                </p>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.totalLessons} lessons
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course.duration}h duration
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    12.5K students
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    4.8 rating
                  </div>
                </div>

                {progress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Course Progress</span>
                      <span>{Math.round(getOverallProgress())}% complete</span>
                    </div>
                    <Progress value={getOverallProgress()} className="h-2" />
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle>About This Course</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-line">{course.longDescription}</div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Learning Outcomes */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    What You'll Learn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.learningOutcomes.map((outcome, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Prerequisites */}
            {course.prerequisites.length > 0 && (
              <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Prerequisites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {course.prerequisites.map((prereq, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                          <span className="text-sm">{prereq}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Course Curriculum */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Course Curriculum</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.modules.map((module, moduleIndex) => (
                    <div key={module.id} className="border rounded-lg">
                      <Collapsible
                        open={openModules.has(module.id)}
                        onOpenChange={() => toggleModule(module.id)}
                      >
                        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="level-indicator text-sm">
                              {moduleIndex + 1}
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold">{module.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {module.lessons.length} lessons • {module.estimatedDuration}min
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {progress && (
                              <div className="text-sm text-muted-foreground">
                                {Math.round(getModuleProgress(module))}%
                              </div>
                            )}
                            {openModules.has(module.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="px-4 pb-4 space-y-2">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <div
                                key={lesson.id}
                                className={cn(
                                  'flex items-center justify-between p-3 rounded-lg border',
                                  'hover:bg-muted/50 transition-colors',
                                  isLessonCompleted(lesson.id) && 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center">
                                    {isLessonCompleted(lesson.id) ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : isEnrolled || moduleIndex === 0 ? (
                                      <span className="text-xs font-semibold">
                                        {lessonIndex + 1}
                                      </span>
                                    ) : (
                                      <Lock className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-sm font-medium">{lesson.title}</h4>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        {lesson.type === 'challenge' ? (
                                          <Code className="h-3 w-3" />
                                        ) : (
                                          <Play className="h-3 w-3" />
                                        )}
                                        {lesson.type}
                                      </span>
                                      <span>{lesson.estimatedDuration}min</span>
                                      <div className="xp-badge text-xs">
                                        <Zap className="h-2 w-2" />
                                        {lesson.xpReward} XP
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {(isEnrolled || moduleIndex === 0) && (
                                  <Button
                                    size="sm"
                                    variant={isLessonCompleted(lesson.id) ? "outline" : "default"}
                                    asChild
                                  >
                                    <Link href={`/courses/${course.slug}/lessons/${lesson.id}`}>
                                      {isLessonCompleted(lesson.id) ? 'Review' : 'Start'}
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInUp}
            >
              <Card className="sticky top-6">
                <CardHeader>
                  <div className="text-center">
                    <div className="xp-badge text-lg mb-2">
                      <Zap className="h-4 w-4" />
                      {formatXP(course.xpReward)} XP
                    </div>
                    <CardTitle>
                      {isEnrolled ? 'Continue Learning' : 'Start Learning'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user ? (
                    <>
                      {isEnrolled ? (
                        <Button className="w-full" size="lg" asChild>
                          <Link href={`/courses/${course.slug}/lessons/${course.modules[0]?.lessons[0]?.id}`}>
                            Continue Course
                          </Link>
                        </Button>
                      ) : (
                        <Button onClick={handleEnroll} className="w-full" size="lg">
                          Enroll Now - Free
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <Button className="w-full" size="lg" asChild>
                        <Link href="/signup">Sign Up to Enroll</Link>
                      </Button>
                      <p className="text-center text-sm text-muted-foreground">
                        Create a free account to track progress and earn XP
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-semibold">What's Included:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {course.totalLessons} interactive lessons
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {course.totalChallenges} coding challenges
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Completion certificate
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Lifetime access
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Instructor */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Instructor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={course.instructor.avatar} alt={course.instructor.name} />
                      <AvatarFallback>
                        {course.instructor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{course.instructor.name}</h3>
                      <p className="text-sm text-muted-foreground">{course.instructor.bio}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Course Stats */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Course Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Language</span>
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm font-medium">English</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Updated</span>
                    <span className="text-sm font-medium">
                      {new Date(course.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Students</span>
                    <span className="text-sm font-medium">12,543</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tags */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
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