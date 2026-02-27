'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import {
  Code2,
  Award,
  Zap,
  Users,
  ArrowRight,
  Star,
  BookOpen,
  Trophy,
  Flame,
  Rocket,
  Anchor,
  Coins,
  User,
  Sparkles,
} from 'lucide-react';

import type {
  LandingPageData,
  LandingPath,
  LandingTestimonial,
  LandingPartner,
} from '@/app/api/landing/route';

// Icon mapping for learning paths
const difficultyIcons = {
  beginner: Rocket,
  intermediate: Anchor,
  advanced: Coins,
};

// Fallback data for learning paths (used when platform has < 100 users)
const fallbackLearningPaths = [
  {
    id: 'solana-fundamentals',
    title: 'Solana Fundamentals',
    description: 'Master the basics of Solana blockchain and start building dApps',
    courses: 5,
    duration: '20 hours',
    difficulty: 'beginner',
    icon: Rocket,
  },
  {
    id: 'anchor-development',
    title: 'Anchor Development',
    description: 'Build smart contracts using the Anchor framework',
    courses: 6,
    duration: '25 hours',
    difficulty: 'intermediate',
    icon: Anchor,
  },
  {
    id: 'defi-developer',
    title: 'DeFi Developer',
    description: 'Create decentralized finance applications on Solana',
    courses: 8,
    duration: '40 hours',
    difficulty: 'advanced',
    icon: Coins,
  },
];

// Fallback stats (used when platform has < 100 users)
const fallbackStats = [
  { label: 'Active Learners', value: 5000, suffix: '+', icon: Users },
  { label: 'Courses', value: 25, suffix: '+', icon: BookOpen },
  { label: 'Completions', value: 12000, suffix: '+', icon: Trophy },
  { label: 'XP Awarded', value: 2, suffix: 'M+', icon: Flame },
];

// CountUp component
function CountUp({
  end,
  suffix,
  duration = 2000,
}: {
  end: number;
  suffix: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (end - startValue) * easeOutQuart);

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [hasStarted, end, duration]);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <span ref={ref}>
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

// Fallback testimonials (used when platform has < 100 users or no testimonials in DB)
const fallbackTestimonials: LandingTestimonial[] = [
  {
    id: 'fallback-1',
    name: 'Lucas Silva',
    role: 'Solana Developer',
    content:
      'CapySolBuild Academy transformed my career. The hands-on challenges made learning Solana development engaging and practical.',
    rating: 5,
  },
  {
    id: 'fallback-2',
    name: 'Maria Santos',
    role: 'DeFi Builder',
    content:
      'The on-chain credentials are a game-changer. Employers can verify my skills directly on the blockchain.',
    rating: 5,
  },
  {
    id: 'fallback-3',
    name: 'Pedro Costa',
    role: 'Full Stack Developer',
    content:
      'From zero blockchain knowledge to deploying my first dApp in weeks. The gamification kept me motivated throughout.',
    rating: 5,
  },
];

// Fallback partners (used when platform has < 100 users or no partners in DB)
const fallbackPartners: LandingPartner[] = [
  { id: 'solana', name: 'Solana Foundation', logo_url: '/partners/solana.svg' },
  { id: 'superteam', name: 'Superteam', logo_url: '/partners/superteam.svg' },
  { id: 'metaplex', name: 'Metaplex', logo_url: '/partners/metaplex.svg' },
  { id: 'helius', name: 'Helius', logo_url: '/partners/helius.svg' },
  { id: 'anchor', name: 'Anchor Framework', logo_url: '/partners/anchor.svg' },
];

export default function HomePage() {
  const { t } = useTranslation();
  const [apiData, setApiData] = useState<LandingPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLandingData() {
      try {
        const response = await fetch('/api/landing');
        if (response.ok) {
          const data: LandingPageData = await response.json();
          setApiData(data);
        }
      } catch (error) {
        console.error('Failed to fetch landing data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLandingData();
  }, []);

  // Use API data only when platform has 100+ users, otherwise use fallback
  const useApiData = apiData?.useApiData ?? false;

  const activeStats =
    useApiData && apiData
      ? [
          { label: 'Active Learners', value: apiData.stats.activeUsers, suffix: '+', icon: Users },
          { label: 'Courses', value: apiData.stats.totalCourses, suffix: '+', icon: BookOpen },
          {
            label: 'Completions',
            value: apiData.stats.totalCompletions,
            suffix: '+',
            icon: Trophy,
          },
          {
            label: 'XP Awarded',
            value: Math.floor(apiData.stats.totalXP / 1000),
            suffix: 'K+',
            icon: Flame,
          },
        ]
      : fallbackStats;

  const activeLearningPaths =
    apiData && apiData.learningPaths.length > 0
      ? apiData.learningPaths.map((path) => ({
          ...path,
          icon: difficultyIcons[path.difficulty] || Rocket,
        }))
      : fallbackLearningPaths;

  // Use API testimonials if available, otherwise fallback
  const activeTestimonials =
    useApiData && apiData && apiData.testimonials.length >= 3
      ? apiData.testimonials
      : fallbackTestimonials;

  // Use API partners if available, otherwise fallback
  const activePartners =
    useApiData && apiData && apiData.partners.length >= 3 ? apiData.partners : fallbackPartners;

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="from-background to-background/80 relative overflow-hidden bg-gradient-to-b py-20 md:py-32">
        <div className="bg-grid-white/5 absolute inset-0 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative container">
          <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
            {/* Left: Content */}
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <Badge variant="secondary" className="animate-fade-in mb-4">
                <Sparkles className="mr-2 h-3 w-3" />
                Now with on-chain credentials
              </Badge>
              <h1 className="animate-slide-up mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                Master{' '}
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Solana Development
                </span>
              </h1>
              <p className="text-muted-foreground animate-slide-up animation-delay-100 mb-8 text-lg md:text-xl">
                The ultimate learning platform for Solana-native developers. From zero to deploying
                production-ready dApps with gamified progression and on-chain credentials.
              </p>
              <div className="animate-slide-up animation-delay-200 flex flex-col items-center gap-4 sm:flex-row md:items-start">
                <Button size="lg" className="transition-transform hover:scale-105" asChild>
                  <Link href="/explore">
                    Start Learning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="transition-transform hover:scale-105"
                  asChild
                >
                  <Link href="/explore">Explore Courses</Link>
                </Button>
              </div>
            </div>
            {/* Right: Logo */}
            <div className="flex justify-center md:justify-end">
              <div className="animate-float relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-3xl" />
                <Image
                  src="/logo.png"
                  alt="CapySolBuild Academy"
                  width={280}
                  height={280}
                  sizes="(max-width: 768px) 220px, 280px"
                  fetchPriority="high"
                  className="relative drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/30 border-y py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {activeStats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center transition-all duration-300 hover:scale-110"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <stat.icon className="text-primary mx-auto mb-2 h-6 w-6" />
                <div className="text-3xl font-bold">
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Logos Section */}
      <section className="overflow-hidden py-12">
        <div className="container">
          <h2 className="mb-8 text-center text-3xl font-bold">
            Trusted by leading Web3 organizations
          </h2>
        </div>
        <div className="relative">
          {/* Gradient overlays for fade effect */}
          <div className="from-background pointer-events-none absolute top-0 left-0 z-10 h-full w-20 bg-gradient-to-r to-transparent" />
          <div className="from-background pointer-events-none absolute top-0 right-0 z-10 h-full w-20 bg-gradient-to-l to-transparent" />

          {/* Scrolling container */}
          <div className="animate-scroll-left flex">
            {/* First set of logos */}
            <div className="flex shrink-0 items-center gap-12 px-6">
              {activePartners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex h-10 shrink-0 items-center gap-2 opacity-70 grayscale transition-all hover:scale-110 hover:opacity-100 hover:grayscale-0"
                >
                  {partner.website_url ? (
                    <a href={partner.website_url} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={partner.logo_url}
                        alt={partner.name}
                        width={120}
                        height={32}
                        className="h-8 w-auto dark:invert"
                      />
                    </a>
                  ) : (
                    <Image
                      src={partner.logo_url}
                      alt={partner.name}
                      width={120}
                      height={32}
                      className="h-8 w-auto dark:invert"
                    />
                  )}
                </div>
              ))}
            </div>
            {/* Duplicate set for seamless loop */}
            <div className="flex shrink-0 items-center gap-12 px-6">
              {activePartners.map((partner) => (
                <div
                  key={`${partner.id}-dup`}
                  className="flex h-10 shrink-0 items-center gap-2 opacity-70 grayscale transition-all hover:scale-110 hover:opacity-100 hover:grayscale-0"
                >
                  {partner.website_url ? (
                    <a href={partner.website_url} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={partner.logo_url}
                        alt={partner.name}
                        width={120}
                        height={32}
                        className="h-8 w-auto dark:invert"
                      />
                    </a>
                  ) : (
                    <Image
                      src={partner.logo_url}
                      alt={partner.name}
                      width={120}
                      height={32}
                      className="h-8 w-auto dark:invert"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Why CapySolBuild Academy?</h2>
            <p className="text-muted-foreground">
              Built by developers, for developers. Everything you need to become a Solana expert.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <CardHeader>
                <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110">
                  <Code2 className="text-primary h-6 w-6" />
                </div>
                <CardTitle>Interactive Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Learn by doing with hands-on coding challenges and real Solana projects.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <CardHeader>
                <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110">
                  <Award className="text-primary h-6 w-6" />
                </div>
                <CardTitle>On-Chain Credentials</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Earn verifiable NFT credentials that prove your skills to employers.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <CardHeader>
                <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110">
                  <Zap className="text-primary h-6 w-6" />
                </div>
                <CardTitle>Gamified Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Stay motivated with XP, streaks, achievements, and leaderboards.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <CardHeader>
                <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110">
                  <Users className="text-primary h-6 w-6" />
                </div>
                <CardTitle>Community Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Learn alongside other builders in the CapySolBuild community.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Learning Paths Section */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Learning Paths</h2>
            <p className="text-muted-foreground">
              Structured paths to take you from beginner to expert
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {activeLearningPaths.map((path, index) => (
              <Card
                key={path.id}
                className="group transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="mb-4 text-4xl transition-transform duration-300 group-hover:scale-110">
                    <path.icon className="h-10 w-10" />
                  </div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{path.title}</CardTitle>
                    <Badge variant="outline" className="capitalize">
                      {path.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{path.description}</CardDescription>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{path.courses} courses</span>
                    <span className="text-muted-foreground">{path.duration}</span>
                  </div>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button className="w-full" variant="secondary" asChild>
                    <Link href={`/courses?path=${path.id}`}>
                      View Path
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="overflow-hidden py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">What Developers Say</h2>
            <p className="text-muted-foreground">
              Join thousands of developers who have leveled up their Solana skills
            </p>
          </div>
        </div>
        {/* Scrolling container */}
        <div className="relative">
          {/* Left fade gradient */}
          <div className="from-background pointer-events-none absolute top-0 left-0 z-10 h-full w-16 bg-gradient-to-r to-transparent" />
          {/* Right fade gradient */}
          <div className="from-background pointer-events-none absolute top-0 right-0 z-10 h-full w-16 bg-gradient-to-l to-transparent" />
          <div className="animate-scroll-left-slow flex gap-6">
            {/* Duplicate testimonials for seamless loop */}
            {[...activeTestimonials, ...activeTestimonials].map((testimonial, index) => (
              <Card
                key={`${testimonial.id}-${index}`}
                className="w-[350px] flex-shrink-0 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center gap-1">
                    {[...Array(testimonial.rating || 5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 line-clamp-4">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="bg-muted flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-xl">
                      {testimonial.avatar_url ? (
                        <Image
                          src={testimonial.avatar_url}
                          alt={testimonial.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-muted-foreground text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-20">
        <div className="container">
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:items-center">
            {/* Left: Logo and Features */}
            <div className="flex flex-col items-center md:items-start">
              <Image
                src="/logo.png"
                alt="CapySolBuild Academy"
                width={80}
                height={80}
                className="mb-6"
              />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="text-muted-foreground">Earn XP & Certificates</span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-purple-500" />
                  <span className="text-muted-foreground">On-Chain Achievements</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-pink-500" />
                  <span className="text-muted-foreground">Join the Community</span>
                </div>
              </div>
            </div>

            {/* Right: CTA */}
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <h2 className="mb-4 text-3xl font-bold">Ready to Start Building?</h2>
              <p className="text-muted-foreground mb-8">
                Join CapySolBuild Academy today and begin your journey to becoming a Solana
                developer.
              </p>
              <Button size="lg" asChild>
                <Link href="/courses">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
