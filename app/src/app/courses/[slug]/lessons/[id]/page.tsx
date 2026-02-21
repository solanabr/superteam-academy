'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/providers/auth-provider'
import { courseService } from '@/services/course.service'
import { learningProgressService } from '@/services/learning-progress.service'
import type { Course, Lesson, Progress as CourseProgress, CodeChallenge } from '@/types'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Play,
  RotateCcw,
  Zap,
  Clock,
  BookOpen,
  Code,
  Trophy,
  Lightbulb,
  AlertCircle,
  Terminal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
        <Code className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }
)

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [code, setCode] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<{ passed: boolean; message: string }[]>([])
  const [showHints, setShowHints] = useState(false)
  const [currentHintIndex, setCurrentHintIndex] = useState(0)

  useEffect(() => {
    if (params.slug && params.id) {
      loadLessonData(params.slug as string, params.id as string)
    }
  }, [params.slug, params.id, user])

  const loadLessonData = async (courseSlug: string, lessonId: string) => {
    setLoading(true)
    try {
      const courseData = await courseService.getCourse(courseSlug)
      if (!courseData) {
        router.push('/courses')
        return
      }

      setCourse(courseData)

      // Find the lesson in the course modules
      let foundLesson: Lesson | null = null
      for (const module of courseData.modules) {
        const lessonInModule = module.lessons.find(l => l.id === lessonId)
        if (lessonInModule) {
          foundLesson = lessonInModule
          break
        }
      }

      if (!foundLesson) {
        router.push(`/courses/${courseSlug}`)
        return
      }

      setLesson(foundLesson)

      // Set initial code for code challenges
      if (foundLesson.codeChallenge) {
        setCode(foundLesson.codeChallenge.starterCode)
      }

      // Load progress if user is signed in
      if (user) {
        try {
          const progressData = await learningProgressService.getProgress(user.id, courseData.id)
          setProgress(progressData)
          setIsCompleted(progressData.completedLessons.includes(lessonId))
        } catch (error) {
          console.error('Failed to load progress:', error)
        }
      }
    } catch (error) {
      console.error('Failed to load lesson:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteLesson = async () => {
    if (!user || !course || !lesson) return

    try {
      // Find lesson index in the course
      let lessonIndex = 0
      for (const module of course.modules) {
        for (let i = 0; i < module.lessons.length; i++) {
          if (module.lessons[i].id === lesson.id) {
            await learningProgressService.completeLesson(user.id, course.id, lessonIndex)
            setIsCompleted(true)
            
            // Reload progress to get updated data
            const updatedProgress = await learningProgressService.getProgress(user.id, course.id)
            setProgress(updatedProgress)
            return
          }
          lessonIndex++
        }
      }
    } catch (error) {
      console.error('Failed to complete lesson:', error)
    }
  }

  const runCode = useCallback(async () => {
    if (!lesson?.codeChallenge || !code) return

    setIsRunning(true)
    setTestResults([])

    try {
      // Simulate code execution and testing
      // In a real implementation, this would call a backend service
      await new Promise(resolve => setTimeout(resolve, 1000))

      const challenge = lesson.codeChallenge
      const results = challenge.testCases.map(testCase => {
        // Simple mock testing logic
        const passed = code.includes('std::str::from_utf8') && code.includes('msg!')
        return {
          passed,
          message: passed ? 
            `✅ Test passed: ${testCase.description}` : 
            `❌ Test failed: ${testCase.description}`
        }
      })

      setTestResults(results)

      // If all tests pass and lesson isn't completed, mark it as complete
      const allPassed = results.every(r => r.passed)
      if (allPassed && !isCompleted) {
        await handleCompleteLesson()
      }
    } catch (error) {
      console.error('Failed to run code:', error)
    } finally {
      setIsRunning(false)
    }
  }, [lesson, code, isCompleted, handleCompleteLesson])

  const resetCode = () => {
    if (lesson?.codeChallenge) {
      setCode(lesson.codeChallenge.starterCode)
      setTestResults([])
    }
  }

  const getNextLesson = (): Lesson | null => {
    if (!course || !lesson) return null

    let foundCurrent = false
    for (const module of course.modules) {
      for (const moduleLesson of module.lessons) {
        if (foundCurrent) {
          return moduleLesson
        }
        if (moduleLesson.id === lesson.id) {
          foundCurrent = true
        }
      }
    }
    return null
  }

  const getPreviousLesson = (): Lesson | null => {
    if (!course || !lesson) return null

    let previousLesson: Lesson | null = null
    for (const module of course.modules) {
      for (const moduleLesson of module.lessons) {
        if (moduleLesson.id === lesson.id) {
          return previousLesson
        }
        previousLesson = moduleLesson
      }
    }
    return null
  }

  const nextLesson = getNextLesson()
  const previousLesson = getPreviousLesson()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="h-[calc(100vh-4rem)] flex">
          <div className="flex-1 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="h-8 bg-muted rounded w-2/3" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </div>
            </div>
          </div>
          <div className="flex-1 bg-muted" />
        </div>
      </div>
    )
  }

  if (!course || !lesson) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Lesson not found</h2>
            <p className="text-muted-foreground mb-8">The lesson you're looking for doesn't exist.</p>
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
      
      {/* Lesson Navigation Bar */}
      <motion.div
        className="lesson-nav border-b px-6 py-3"
        initial="initial"
        animate="animate"
        variants={fadeInUp}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href={`/courses/${course.slug}`}
              className="flex items-center text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {course.title}
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center space-x-2">
              {lesson.type === 'challenge' ? (
                <Code className="h-4 w-4 text-primary" />
              ) : (
                <BookOpen className="h-4 w-4 text-primary" />
              )}
              <span className="font-medium">{lesson.title}</span>
              {isCompleted && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {progress && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>
                  {progress.completedLessons.length}/{course.totalLessons} lessons
                </span>
                <Progress 
                  value={(progress.completedLessons.length / course.totalLessons) * 100} 
                  className="w-20 h-2" 
                />
              </div>
            )}
            
            <div className="xp-badge">
              <Zap className="h-3 w-3" />
              {lesson.xpReward} XP
            </div>
          </div>
        </div>
      </motion.div>

      {/* Split Layout */}
      <div className="h-[calc(100vh-8rem)] flex">
        {/* Content Panel */}
        <motion.div
          className="flex-1 overflow-y-auto p-6"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Lesson Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="capitalize">
                    {lesson.type}
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {lesson.estimatedDuration}min
                  </Badge>
                </div>
                
                {!isCompleted && lesson.type === 'lesson' && (
                  <Button onClick={handleCompleteLesson} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Mark Complete
                  </Button>
                )}
              </div>

              <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
              
              {lesson.description && (
                <p className="text-lg text-muted-foreground">{lesson.description}</p>
              )}
            </div>

            {/* Lesson Content */}
            <Card>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      code({ className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code className="bg-muted px-2 py-1 rounded text-sm" {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {lesson.content}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Code Challenge Instructions */}
            {lesson.codeChallenge && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Coding Challenge
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{lesson.codeChallenge.prompt}</p>
                  
                  {lesson.codeChallenge.testCases.filter(tc => !tc.isHidden).map((testCase, index) => (
                    <div key={testCase.id} className="bg-muted p-3 rounded-lg">
                      <h4 className="text-sm font-medium mb-1">Test Case {index + 1}:</h4>
                      <p className="text-sm text-muted-foreground">{testCase.description}</p>
                      <div className="mt-2 text-xs font-mono">
                        <div>Input: <code>{testCase.input}</code></div>
                        <div>Expected: <code>{testCase.expectedOutput}</code></div>
                      </div>
                    </div>
                  ))}

                  {/* Hints */}
                  {lesson.codeChallenge.hints.length > 0 && (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHints(!showHints)}
                        className="gap-2"
                      >
                        <Lightbulb className="h-4 w-4" />
                        {showHints ? 'Hide Hints' : 'Show Hints'}
                      </Button>
                      
                      {showHints && (
                        <div className="space-y-2">
                          {lesson.codeChallenge.hints.slice(0, currentHintIndex + 1).map((hint, index) => (
                            <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
                              <p className="text-sm">💡 {hint}</p>
                            </div>
                          ))}
                          
                          {currentHintIndex < lesson.codeChallenge.hints.length - 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCurrentHintIndex(currentHintIndex + 1)}
                            >
                              Show Next Hint
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Test Results */}
            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={cn(
                          'p-3 rounded-lg font-mono text-sm',
                          result.passed 
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                        )}
                      >
                        {result.message}
                      </div>
                    ))}
                    
                    {testResults.every(r => r.passed) && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500 mt-4">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-green-600" />
                          <div>
                            <h4 className="font-semibold text-green-800 dark:text-green-200">
                              Challenge Complete! 🎉
                            </h4>
                            <p className="text-sm text-green-600 dark:text-green-300">
                              You earned {lesson.xpReward} XP!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <div>
                {previousLesson && (
                  <Button variant="outline" asChild>
                    <Link href={`/courses/${course.slug}/lessons/${previousLesson.id}`}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Link>
                  </Button>
                )}
              </div>
              
              <div>
                {nextLesson && (
                  <Button asChild>
                    <Link href={`/courses/${course.slug}/lessons/${nextLesson.id}`}>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Code Editor Panel (only for challenges) */}
        {lesson.codeChallenge && (
          <motion.div
            className="flex-1 border-l bg-card"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="h-full flex flex-col">
              {/* Editor Header */}
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Code Editor
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetCode}
                      className="gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </Button>
                    
                    <Button
                      onClick={runCode}
                      disabled={isRunning}
                      size="sm"
                      className="gap-1"
                    >
                      {isRunning ? (
                        <>
                          <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          Run Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 p-4">
                <div className="h-full rounded-lg border overflow-hidden">
                  <MonacoEditor
                    height="100%"
                    defaultLanguage={lesson.codeChallenge.language}
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      insertSpaces: true,
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}