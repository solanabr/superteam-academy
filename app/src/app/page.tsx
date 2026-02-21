'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/providers/auth-provider'
import { courseService } from '@/services/course.service'
import type { Course } from '@/types'
import {
  ArrowRight,
  BookOpen,
  Code,
  Trophy,
  Users,
  Zap,
  Star,
  PlayCircle,
  CheckCircle,
  Globe,
  Rocket,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function HomePage() {
  const { user } = useAuth()
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([])
  const [stats, setStats] = useState({
    totalCourses: 15,
    totalStudents: 12500,
    totalXP: 2500000,
    avgRating: 4.8
  })

  useEffect(() => {
    const loadFeaturedCourses = async () => {
      const courses = await courseService.getCourses()
      setFeaturedCourses(courses.slice(0, 3))
    }
    loadFeaturedCourses()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background" />
        
        <div className="container relative">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="outline" className="mb-4 px-4 py-2">
                🚀 New Course: Advanced Solana DeFi
              </Badge>
            </motion.div>

            <motion.h1
              className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
              variants={fadeInUp}
            >
              Master{' '}
              <span className="text-gradient">Solana Development</span>
              <br />
              Build the Future
            </motion.h1>

            <motion.p
              className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl"
              variants={fadeInUp}
            >
              Join thousands of developers learning to build on Solana. Interactive courses,
              hands-on projects, and real-world challenges designed by industry experts.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={fadeInUp}
            >
              {user ? (
                <Button size="lg" className="group" asChild>
                  <Link href="/dashboard">
                    Continue Learning
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="group" asChild>
                  <Link href="/signup">
                    Start Learning Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              )}
              
              <Button variant="outline" size="lg" className="group" asChild>
                <Link href="/courses">
                  <PlayCircle className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  Browse Courses
                </Link>
              </Button>
            </motion.div>

            <motion.div
              className="mt-16 flex items-center justify-center space-x-8 text-sm text-muted-foreground"
              variants={fadeInUp}
            >
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                {stats.totalStudents.toLocaleString()}+ students
              </div>
              <div className="flex items-center">
                <Star className="mr-2 h-4 w-4 fill-yellow-400 text-yellow-400" />
                {stats.avgRating}/5 rating
              </div>
              <div className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                {stats.totalCourses}+ courses
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="container">
          <motion.div
            className="mx-auto max-w-2xl text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Choose Superteam Academy?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The most comprehensive platform for learning Solana development
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              {
                icon: Code,
                title: 'Interactive Code Editor',
                description: 'Write and test Solana programs directly in the browser with our Monaco-based editor'
              },
              {
                icon: Zap,
                title: 'Gamified Learning',
                description: 'Earn XP, unlock achievements, and climb leaderboards while mastering new skills'
              },
              {
                icon: Trophy,
                title: 'Real-world Projects',
                description: 'Build actual DeFi protocols, NFT collections, and Web3 applications'
              },
              {
                icon: Users,
                title: 'Community Support',
                description: 'Join a vibrant community of Solana developers and get help when you need it'
              },
              {
                icon: Shield,
                title: 'Security First',
                description: 'Learn security best practices and common pitfalls from industry experts'
              },
              {
                icon: Globe,
                title: 'Multi-language Support',
                description: 'Available in English, Portuguese, and Spanish for global accessibility'
              }
            ].map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <feature.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 sm:py-24 bg-muted/50">
        <div className="container">
          <motion.div
            className="flex items-center justify-between mb-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Featured Courses</h2>
              <p className="mt-2 text-muted-foreground">
                Start your journey with our most popular courses
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/courses">View All Courses</Link>
            </Button>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            {featuredCourses.map((course) => (
              <motion.div key={course.id} variants={fadeInUp}>
                <Card className="course-card h-full">
                  <div className="aspect-video bg-gradient-solana rounded-t-lg flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
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
                        {course.xpReward} XP
                      </div>
                    </div>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span>{course.totalLessons} lessons</span>
                      <span>{course.duration}h duration</span>
                    </div>
                    <Button className="w-full" asChild>
                      <Link href={`/courses/${course.slug}`}>
                        Start Course
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Learning Path Preview */}
      <section className="py-16 sm:py-24">
        <div className="container">
          <motion.div
            className="mx-auto max-w-4xl"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Your Learning Journey
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Follow our structured path from beginner to expert
              </p>
            </motion.div>

            <motion.div className="space-y-6" variants={stagger}>
              {[
                {
                  step: 1,
                  title: 'Fundamentals',
                  description: 'Learn Solana basics, accounts, and transactions',
                  courses: 3,
                  xp: 800
                },
                {
                  step: 2,
                  title: 'Program Development',
                  description: 'Build your first Solana programs with Rust',
                  courses: 5,
                  xp: 2000
                },
                {
                  step: 3,
                  title: 'Advanced Topics',
                  description: 'DeFi protocols, NFTs, and complex architectures',
                  courses: 7,
                  xp: 3500
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-center space-x-6 p-6 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="level-indicator text-lg">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {step.courses} courses
                      </span>
                      <div className="xp-badge">
                        <Zap className="h-3 w-3" />
                        {step.xp} XP
                      </div>
                    </div>
                  </div>
                  <CheckCircle className="h-6 w-6 text-muted-foreground" />
                </motion.div>
              ))}
            </motion.div>

            <motion.div className="text-center mt-12" variants={fadeInUp}>
              <Button size="lg" variant="outline" asChild>
                <Link href="/courses">
                  <Rocket className="mr-2 h-4 w-4" />
                  Start Your Journey
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-solana">
        <div className="container">
          <motion.div
            className="mx-auto max-w-2xl text-center text-white"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Build the Future?
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Join thousands of developers building on the fastest blockchain. 
              Start your journey today with our free courses.
            </p>
            <div className="mt-8">
              <Button size="lg" variant="outline" className="bg-white text-gray-900 hover:bg-gray-100" asChild>
                <Link href={user ? '/dashboard' : '/signup'}>
                  {user ? 'Continue Learning' : 'Get Started Free'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}