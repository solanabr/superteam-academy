// app/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Code2, Trophy, Award, Sparkles } from 'lucide-react';
import { getCourseService, getAnalyticsService } from '@/lib/services';
import { Course } from '@/lib/types/domain';
import { getDifficultyVariant, formatDuration } from '@/lib/utils';

export default function HomePage() {
  const { connected } = useWallet();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    // Track page view
    const analytics = getAnalyticsService();
    analytics.pageView('/', 'Home');

    // Load featured courses
    async function loadCourses() {
      const courseService = getCourseService();
      const allCourses = await courseService.getAllCourses();
      setCourses(allCourses.slice(0, 3)); // Featured courses
    }
    loadCourses();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <Badge variant="secondary" className="gap-2">
            <Sparkles className="h-3 w-3" />
            Powered by Solana
          </Badge>
          
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Learn Solana.
            <br />
            <span className="text-primary">Earn XP.</span>
            <br />
            Get Hired.
          </h1>
          
          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
            The interactive learning platform for Solana developers in Latin America. 
            Master blockchain development through hands-on challenges and earn verifiable credentials.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {connected ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/courses">
                <Button size="lg" className="gap-2">
                  Start Learning
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/50">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold">2,500+</div>
              <div className="text-muted-foreground">Active Learners</div>
            </div>
            <div>
              <div className="text-4xl font-bold">12</div>
              <div className="text-muted-foreground">Courses Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold">1.2M</div>
              <div className="text-muted-foreground">XP Earned</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Why Superteam Academy?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We combine interactive learning with on-chain gamification to create 
            the most engaging Solana education experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Code2 className="h-10 w-10 mb-4 text-primary" />
              <CardTitle>Interactive Code Editor</CardTitle>
              <CardDescription>
                Write and test Solana programs directly in your browser with Monaco Editor.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Trophy className="h-10 w-10 mb-4 text-yellow-500" />
              <CardTitle>Gamified Learning</CardTitle>
              <CardDescription>
                Earn XP, level up, and maintain streaks as you progress through courses.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Award className="h-10 w-10 mb-4 text-green-500" />
              <CardTitle>On-Chain Credentials</CardTitle>
              <CardDescription>
                Receive verifiable NFT certificates upon course completion.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Featured Courses */}
      {courses.length > 0 && (
        <section className="container py-24">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                Featured Courses
              </h2>
              <p className="text-muted-foreground">
                Start your Solana development journey today
              </p>
            </div>
            <Link href="/courses">
              <Button variant="outline" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={getDifficultyVariant(course.difficulty) as any}>
                        {course.difficulty}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(course.durationMinutes)}
                      </span>
                    </div>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
                      </span>
                      <Badge variant="secondary" className="gap-1">
                        <Trophy className="h-3 w-3" />
                        {course.xpReward} XP
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="border-t bg-muted/50">
        <div className="container py-24">
          <div className="mx-auto max-w-2xl text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to Start Your Journey?
            </h2>
            <p className="text-muted-foreground text-lg">
              Join thousands of developers learning Solana the right way.
            </p>
            <Link href="/courses">
              <Button size="lg" className="gap-2">
                Explore Courses
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
