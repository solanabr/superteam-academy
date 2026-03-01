'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  BookOpen,
  Code2,
  Layers,
  Shield,
  Zap,
} from 'lucide-react';

interface CourseCardData {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: number;
  xp: number;
  track: string;
  trackColor: string;
  gradientFrom: string;
  gradientTo: string;
  icon: React.ElementType;
  slug: string;
  image: string;
}

const FEATURED_COURSES: CourseCardData[] = [
  {
    title: 'Solana Fundamentals',
    description: 'Understand accounts, transactions, and the Solana runtime from first principles.',
    difficulty: 'Beginner',
    lessons: 5,
    xp: 250,
    track: 'Solana Core',
    trackColor: 'bg-primary/10 text-primary',
    gradientFrom: 'from-primary/20',
    gradientTo: 'to-primary/5',
    icon: Layers,
    slug: 'solana-101',
    image: '/images/courses/solana-101.svg',
  },
  {
    title: 'Building a DEX with Anchor',
    description: 'Create a fully functional decentralized exchange with order books and AMM pools.',
    difficulty: 'Intermediate',
    lessons: 8,
    xp: 600,
    track: 'DeFi',
    trackColor: 'bg-accent/10 text-accent',
    gradientFrom: 'from-accent/20',
    gradientTo: 'to-accent/5',
    icon: Code2,
    slug: 'defi-201',
    image: '/images/courses/defi-201.svg',
  },
  {
    title: 'NFT Collections with Metaplex',
    description: 'Mint, manage, and trade NFT collections using the Metaplex Core standard.',
    difficulty: 'Intermediate',
    lessons: 7,
    xp: 525,
    track: 'NFT & Metaplex',
    trackColor: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    gradientFrom: 'from-yellow-500/20',
    gradientTo: 'to-yellow-500/5',
    icon: BookOpen,
    slug: 'nft-201',
    image: '/images/courses/nft-201.svg',
  },
  {
    title: 'Smart Contract Auditing',
    description: 'Master security patterns and learn to identify common Solana program vulnerabilities.',
    difficulty: 'Advanced',
    lessons: 8,
    xp: 800,
    track: 'Security',
    trackColor: 'bg-red-500/10 text-red-600 dark:text-red-400',
    gradientFrom: 'from-red-500/20',
    gradientTo: 'to-red-500/5',
    icon: Shield,
    slug: 'sec-301',
    image: '/images/courses/sec-301.svg',
  },
];

const DIFFICULTY_VARIANT: Record<CourseCardData['difficulty'], 'secondary' | 'default' | 'destructive'> = {
  Beginner: 'secondary',
  Intermediate: 'default',
  Advanced: 'destructive',
};

export function FeaturedCourses() {
  const t = useTranslations('landing');

  return (
    <section
      className="py-16 md:py-24"
      aria-labelledby="featured-courses-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Curated Curriculum
          </Badge>
          <h2
            id="featured-courses-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            {t('featured_courses')}
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            Hands-on courses designed by Solana ecosystem builders. Each course
            rewards you with on-chain XP and verifiable credentials.
          </p>
        </div>

        {/* Course grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_COURSES.map((course) => (
            <Link
              key={course.title}
              href={`/courses/${course.slug}`}
              className="group block"
            >
              <Card className="relative overflow-hidden transition-shadow hover:shadow-lg hover:border-primary/20 dark:hover:border-primary/30 group-hover:scale-[1.01] transition-all duration-200">
                {/* Gradient image placeholder */}
                <div
                  className={`h-32 bg-gradient-to-br ${course.gradientFrom} ${course.gradientTo} relative flex items-center justify-center overflow-hidden`}
                >
                  {course.image ? (
                    <Image
                      src={course.image}
                      alt=""
                      width={800}
                      height={128}
                      className="absolute inset-0 h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <course.icon className="h-10 w-10 text-foreground/20" />
                  )}
                  {/* XP badge */}
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                    <Zap className="h-3 w-3 text-accent" />
                    {course.xp.toLocaleString()} XP
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={DIFFICULTY_VARIANT[course.difficulty]}
                      className="text-[10px]"
                    >
                      {course.difficulty}
                    </Badge>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${course.trackColor}`}>
                      {course.track}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2 text-base">
                    {course.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pb-2">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {course.description}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {course.lessons} lessons
                  </p>
                </CardContent>

                <CardFooter>
                  <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-primary">
                    Start Course
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>

        {/* View all link */}
        <div className="mt-10 flex justify-center">
          <Button variant="outline" size="lg" className="gap-2" asChild>
            <Link href="/courses">
              View All Courses
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
