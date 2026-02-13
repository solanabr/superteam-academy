'use client';

import Link from 'next/link';
import { Trophy, Zap, GraduationCap, Sparkles } from 'lucide-react';
import { useI18n } from '@/components/i18n/i18n-provider';
import { CourseCard } from '@/components/courses/course-card';
import { CourseSummary } from '@/lib/types';

export function HomePage({ courses }: { courses: CourseSummary[] }): JSX.Element {
  const { dictionary } = useI18n();
  const featuredCourses = courses.slice(0, 3);
  const stats = [
    { label: dictionary.home.stats.submissions, value: '52+' },
    { label: dictionary.home.stats.learningTracks, value: '12' },
    { label: dictionary.home.stats.onchainCredentials, value: '3k+' }
  ];
  const features = [
    {
      icon: GraduationCap,
      title: dictionary.home.features.projectLearningTitle,
      text: dictionary.home.features.projectLearningText
    },
    {
      icon: Zap,
      title: dictionary.home.features.gamificationTitle,
      text: dictionary.home.features.gamificationText
    },
    {
      icon: Trophy,
      title: dictionary.home.features.credentialEvolutionTitle,
      text: dictionary.home.features.credentialEvolutionText
    },
    {
      icon: Sparkles,
      title: dictionary.home.features.openSourceTitle,
      text: dictionary.home.features.openSourceText
    }
  ];

  return (
    <div data-testid="home-page" className="space-y-12 md:space-y-14">
      <section data-testid="home-hero" className="panel relative overflow-hidden p-7 md:p-8">
        <div className="absolute inset-0 -z-10 bg-hero opacity-95" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="max-w-3xl space-y-4">
            <p className="chip border-primary/30 bg-primary/15 text-primary">{dictionary.home.badge}</p>
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">{dictionary.hero.title}</h1>
            <p className="text-base text-foreground/75 md:text-lg">{dictionary.hero.subtitle}</p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/register" className="btn-primary px-5 py-3">
                {dictionary.actions.signUp}
              </Link>
              <Link href="/courses" className="btn-secondary px-5 py-3">
                {dictionary.actions.exploreCourses}
              </Link>
            </div>
          </div>

          <div className="panel-soft space-y-3 bg-background/42">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">{dictionary.home.momentumTitle}</p>
            <div className="grid gap-2">
              {stats.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/55 px-3 py-2">
                  <p className="text-xs text-foreground/65">{item.label}</p>
                  <p className="text-lg font-bold text-primary">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-testid="home-featured-courses" className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{dictionary.home.pathsTitle}</h2>
          <p className="text-sm text-foreground/70">{dictionary.home.pathsSubtitle}</p>
        </div>
        {featuredCourses.length === 0 ? (
          <p className="panel-soft text-sm text-foreground/75">{dictionary.home.noCourses}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} progressPercentage={0} />
            ))}
          </div>
        )}
      </section>

      <section data-testid="home-features" className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <article key={feature.title} className="panel-soft bg-card/70 p-5">
            <feature.icon className="mb-3 text-accent" size={18} />
            <h3 className="text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-foreground/75">{feature.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
