'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { ArrowRight, GraduationCap } from 'lucide-react';

export function CtaBanner() {
  const t = useTranslations('landing');

  return (
    <section
      className="relative overflow-hidden py-16 md:py-24"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-8 sm:p-12 lg:p-16">
          {/* Decorative elements */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          <div className="relative flex flex-col items-center gap-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>

            <h2
              id="cta-heading"
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              {t('cta_title')}
            </h2>

            <p className="max-w-lg text-lg text-white/80">
              {t('cta_subtitle')}
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="gap-2 bg-white text-primary hover:bg-white/90"
                asChild
              >
                <Link href="/courses">
                  {t('hero_cta')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/leaderboard">
                  View Leaderboard
                </Link>
              </Button>
            </div>

            {/* Social proof line */}
            <p className="mt-4 text-sm text-white/60">
              2,500+ developers already learning. No cost to start.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
