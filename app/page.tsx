import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CourseCard } from '@/components/course/course-card';
import { ArrowRight, BookOpen, Trophy, Users } from 'lucide-react';
import { courseService } from '@/lib/services/course.service';

export default async function HomePage() {
  const featuredCourses = await courseService.getCourses({ difficulty: 'beginner' });
  const topCourses = featuredCourses.slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center space-y-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-balance">
              Master Solana Development
            </h1>
            <p className="text-xl text-muted-foreground text-balance leading-relaxed">
              Learn blockchain development with interactive courses, earn credentials as NFTs, and join a thriving community of Solana builders.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/courses">
                  Start Learning
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/leaderboard">View Leaderboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold">50+ Courses</h3>
              <p className="text-sm text-muted-foreground">From beginner to advanced</p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold">10k+ Students</h3>
              <p className="text-sm text-muted-foreground">Learning together</p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold">NFT Credentials</h3>
              <p className="text-sm text-muted-foreground">On-chain achievements</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="container py-16 md:py-24">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Featured Courses</h2>
            <p className="mt-2 text-muted-foreground">Start your Solana journey with these beginner-friendly courses</p>
          </div>
          <Button variant="outline" asChild className="hidden md:flex">
            <Link href="/courses">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {topCourses.length > 0 ? (
            topCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))
          ) : (
            <div className="col-span-full rounded-lg border border-dashed border-border p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No courses available yet. Check back soon!</p>
            </div>
          )}
        </div>
        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link href="/courses">
              View All Courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/50">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Ready to start building?</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of developers learning Solana. Earn XP, unlock achievements, and get certified with on-chain credentials.
            </p>
            <Button size="lg" asChild>
              <Link href="/courses">
                Browse Courses
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
