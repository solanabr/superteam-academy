'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Trophy,
  Shield,
  Users,
  Code2,
  Globe,
  Sparkles,
  Github,
  ArrowRight,
  Zap,
  GraduationCap,
  Target,
} from 'lucide-react';
import { learningPaths, testimonials, stats } from '@/lib/mock-data';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-4xl font-bold md:text-5xl">
      {count.toLocaleString()}
      {suffix}
    </div>
  );
}

const pathIcons: Record<string, typeof Target> = {
  'solana-fundamentals-path': BookOpen,
  'defi-developer': Zap,
  'security-auditor': Shield,
  'full-stack-solana': Code2,
};

export default function HomePage() {
  const t = useTranslations('home');

  const features = [
    { icon: Code2, titleKey: 'interactive' as const, descKey: 'interactiveDesc' as const },
    { icon: Shield, titleKey: 'credentials' as const, descKey: 'credentialsDesc' as const },
    { icon: Trophy, titleKey: 'gamified' as const, descKey: 'gamifiedDesc' as const },
    { icon: Globe, titleKey: 'multiLanguage' as const, descKey: 'multiLanguageDesc' as const },
    { icon: Users, titleKey: 'community' as const, descKey: 'communityDesc' as const },
    { icon: Github, titleKey: 'openSource' as const, descKey: 'openSourceDesc' as const },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-solana-purple/20 via-background to-solana-green/10 animate-pulse" />
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-solana-purple/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-solana-green/10 blur-3xl" />
        </div>

        <div className="container flex flex-col items-center justify-center gap-8 pb-20 pt-28 text-center md:pt-40 md:pb-28">
          <Badge variant="secondary" className="gap-1.5 px-4 py-1.5 text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            {t('hero.badge')}
          </Badge>

          <h1 className="max-w-4xl bg-gradient-to-r from-solana-purple via-foreground to-solana-green bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl">
            {t('hero.title')}
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/auth/signin">
              <Button variant="solana" size="lg" className="gap-2 px-8 text-base">
                <GraduationCap className="h-5 w-5" />
                {t('hero.ctaSignUp')}
              </Button>
            </Link>
            <Link href="/courses">
              <Button variant="outline" size="lg" className="gap-2 px-8 text-base">
                {t('hero.cta')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-card/50">
        <div className="container grid grid-cols-2 gap-8 py-12 md:grid-cols-4 md:py-16">
          <div className="flex flex-col items-center gap-2 text-center">
            <AnimatedCounter target={stats.students} suffix="+" />
            <p className="text-sm text-muted-foreground">{t('stats.students')}</p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <AnimatedCounter target={stats.courses} suffix="+" />
            <p className="text-sm text-muted-foreground">{t('stats.courses')}</p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <AnimatedCounter target={stats.challenges} suffix="+" />
            <p className="text-sm text-muted-foreground">{t('stats.challenges')}</p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <AnimatedCounter target={stats.countries} suffix="+" />
            <p className="text-sm text-muted-foreground">{t('stats.countries')}</p>
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="container py-20 md:py-28">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">{t('paths.title')}</h2>
          <p className="mt-3 text-muted-foreground">{t('paths.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {learningPaths.map((path) => {
            const Icon = pathIcons[path.id] ?? Target;
            return (
              <Link key={path.id} href="/courses">
                <Card className="group h-full cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="flex flex-col gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl transition-colors group-hover:bg-primary/20">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{path.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {path.description}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{path.courseCount} {t('paths.courses')}</span>
                      <Separator orientation="vertical" className="h-3" />
                      <span>{path.estimatedHours}h</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="bg-card/50 py-20 md:py-28">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">{t('features.title')}</h2>
            <p className="mt-3 text-muted-foreground">{t('features.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.titleKey}
                  className="transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                >
                  <CardContent className="flex flex-col gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{t(`features.${feature.titleKey}`)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`features.${feature.descKey}`)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-20 md:py-28">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">{t('testimonials.title')}</h2>
          <p className="mt-3 text-muted-foreground">{t('testimonials.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="transition-all duration-300 hover:-translate-y-1">
              <CardContent className="flex flex-col gap-4 p-6">
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <Separator />
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {testimonial.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-solana-purple/20 to-solana-green/20" />
        <div className="container flex flex-col items-center gap-6 py-20 text-center md:py-28">
          <h2 className="max-w-2xl text-3xl font-bold md:text-4xl">
            {t('cta.title')}
          </h2>
          <p className="max-w-xl text-muted-foreground">
            {t('cta.subtitle')}
          </p>
          <Link href="/auth/signin">
            <Button variant="solana" size="lg" className="gap-2 px-8 text-base">
              <Sparkles className="h-5 w-5" />
              {t('cta.button')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
