import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  GraduationCap, Trophy, Code2, Zap, Users, BookOpen,
  ArrowRight, Star, CheckCircle, Wallet, ChevronRight, Award, Quote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { localePath } from '@/lib/paths';
import { getFeaturedCourses } from '@/lib/content';
import AnimatedSection from '@/components/AnimatedSection';

const MOCK_COURSES = [
  {
    slug: 'intro-solana',
    title: { 'pt-BR': 'Introdução ao Solana', en: 'Introduction to Solana', es: 'Introducción a Solana' },
    level: 'Beginner',
    xp: 1000,
    lessons: 8,
    track: 'Solana',
    color: 'from-purple-600 to-indigo-600',
    students: 456,
    rating: 4.9,
  },
  {
    slug: 'anchor-basics',
    title: { 'pt-BR': 'Fundamentos do Anchor', en: 'Anchor Fundamentals', es: 'Fundamentos de Anchor' },
    level: 'Intermediate',
    xp: 1500,
    lessons: 10,
    track: 'Anchor',
    color: 'from-green-600 to-teal-600',
    students: 312,
    rating: 4.8,
  },
  {
    slug: 'defi-solana',
    title: { 'pt-BR': 'DeFi no Solana', en: 'DeFi on Solana', es: 'DeFi en Solana' },
    level: 'Advanced',
    xp: 2000,
    lessons: 12,
    track: 'DeFi',
    color: 'from-orange-600 to-red-600',
    students: 198,
    rating: 4.7,
  },
];

const FEATURES = [
  { icon: Award, titleKey: 'onchain_creds' as const, descKey: 'onchain_creds_desc' as const, color: 'from-purple-500 to-indigo-500' },
  { icon: Zap, titleKey: 'gamified_learning' as const, descKey: 'gamified_learning_desc' as const, color: 'from-yellow-500 to-orange-500' },
  { icon: Code2, titleKey: 'code_challenges' as const, descKey: 'code_challenges_desc' as const, color: 'from-green-500 to-teal-500' },
  { icon: Users, titleKey: 'superteam_community' as const, descKey: 'superteam_community_desc' as const, color: 'from-pink-500 to-rose-500' },
];

const STEPS = [
  { n: 1, titleKey: 'step1_title' as const, descKey: 'step1_desc' as const, icon: Wallet },
  { n: 2, titleKey: 'step2_title' as const, descKey: 'step2_desc' as const, icon: BookOpen },
  { n: 3, titleKey: 'step3_title' as const, descKey: 'step3_desc' as const, icon: Code2 },
  { n: 4, titleKey: 'step4_title' as const, descKey: 'step4_desc' as const, icon: Trophy },
];

const LEVEL_COLORS: Record<string, string> = {
  Beginner: 'bg-green-900/60 text-green-300 border border-green-700',
  Intermediate: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
  Advanced: 'bg-red-900/60 text-red-300 border border-red-700',
};

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('landing');

  // Fetch featured courses from Sanity CMS (falls back to inline data if unavailable)
  const cmsCourses = await getFeaturedCourses();
  const tc = await getTranslations('courses');

  const L = (obj: Record<string, string>) => obj[locale] ?? obj['pt-BR'];

  const LEVEL_LABELS: Record<string, string> = {
    Beginner: tc('level_badge_beginner'),
    Intermediate: tc('level_badge_intermediate'),
    Advanced: tc('level_badge_advanced'),
  };

  return (
    <div className="bg-gray-950 text-gray-100">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-purple-900/30 blur-3xl" />
          <div className="absolute top-20 right-1/4 h-80 w-80 rounded-full bg-indigo-900/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-700 bg-purple-900/30 px-4 py-1.5 text-sm font-medium text-purple-300"
          >
            <Star className="h-3.5 w-3.5 fill-current" />
            {t('official_platform')}
          </div>

          <h1
            className="mb-6 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight"
          >
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              {t('learn_solana')}
            </span>
            <br />
            <span className="text-white">{t('earn_credentials')}</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t('onchain')}
            </span>
          </h1>

          <p
            className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 leading-relaxed"
          >
            {t('hero_subtitle')}
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href={localePath(locale, '/courses')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-purple-900/30 hover:from-purple-500 hover:to-indigo-500 transition-all hover:shadow-purple-800/40 hover:scale-105"
            >
              <BookOpen className="h-5 w-5" />
              {t('explore_courses')}
            </Link>
            <Link
              href={localePath(locale, '/dashboard')}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-8 py-3.5 text-base font-semibold text-gray-100 hover:bg-gray-700 hover:border-gray-600 transition-all"
            >
              <Wallet className="h-5 w-5" />
              {t('connect_wallet')}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <AnimatedSection>
      <section className="border-y border-gray-800 bg-gray-900/50 py-10 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '1,247', labelKey: 'stats_learners' as const, icon: Users, color: 'text-purple-400' },
              { value: '24', labelKey: 'stats_courses' as const, icon: BookOpen, color: 'text-indigo-400' },
              { value: '2.1M', labelKey: 'stats_xp' as const, icon: Zap, color: 'text-yellow-400' },
              { value: '847', labelKey: 'stats_nft_creds' as const, icon: Award, color: 'text-green-400' },
            ].map(({ value, labelKey, icon: Icon, color }) => (
              <div
                key={labelKey}
                className="text-center"
              >
                <Icon className={cn('mx-auto mb-2 h-6 w-6', color)} />
                <div className="text-3xl font-extrabold text-white">{value}</div>
                <div className="text-sm text-gray-400">{t(labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </AnimatedSection>

      {/* Features */}
      <AnimatedSection>
      <section className="py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              {t('features_title')}
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              {t('not_just_learning')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, titleKey, descKey, color }) => (
              <div
                key={titleKey}
                className="group rounded-2xl border border-gray-800 bg-gray-900/60 p-6 hover:border-gray-700 hover:bg-gray-900 transition-all"
              >
                <div className={cn('mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br', color)}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{t(titleKey)}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </AnimatedSection>

      {/* Featured courses */}
      <AnimatedSection>
      <section className="bg-gray-900/40 py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">{t('featured_courses')}</h2>
              <p className="text-gray-400">{t('most_popular')}</p>
            </div>
            <Link
              href={localePath(locale, '/courses')}
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
            >
              {t('view_all')} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(cmsCourses ?? MOCK_COURSES).map((course) => (
              <div key={course.slug}>
                <Link href={localePath(locale, `/courses/${course.slug}`)}>
                  <div className="group relative rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden hover:border-gray-700 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-gray-900/50">
                    {/* Card gradient header */}
                    <div className={cn('h-32 bg-gradient-to-br', course.color, 'relative overflow-hidden')}>
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute bottom-3 left-4">
                        <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                          {course.track}
                        </span>
                      </div>
                      <GraduationCap className="absolute top-3 right-3 h-8 w-8 text-white/30" />
                    </div>

                    <div className="p-5">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-purple-300 transition-colors">
                          {L(course.title)}
                        </h3>
                        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', LEVEL_COLORS[course.level])}>
                          {LEVEL_LABELS[course.level]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className={cn('h-3.5 w-3.5', j < Math.floor(course.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600')} />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">{course.rating} ({course.students})</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{t('n_lessons', { count: course.lessons })}</span>
                        <span className="font-semibold text-yellow-400">+{course.xp.toLocaleString()} XP</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href={localePath(locale, '/courses')}
              className="inline-flex items-center gap-1 text-sm font-medium text-purple-400 hover:text-purple-300"
            >
              {t('view_all_courses')} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      </AnimatedSection>

      {/* Testimonials */}
      <AnimatedSection>
      <section className="py-24 px-4 border-t border-gray-800">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-bold text-white mb-2">{t('testimonials_title')}</h2>
            <p className="text-gray-400">{t('testimonials_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Rafael Mendes',
                role: { 'pt-BR': 'Desenvolvedor Solana', 'en': 'Solana Developer', 'es': 'Desarrollador Solana' },
                quote: {
                  'pt-BR': 'A melhor plataforma para aprender Solana. Os desafios pr\u00e1ticos e credenciais on-chain me ajudaram a conseguir meu primeiro emprego em Web3.',
                  'en': 'The best platform to learn Solana. The hands-on challenges and on-chain credentials helped me land my first Web3 job.',
                  'es': 'La mejor plataforma para aprender Solana. Los desaf\u00edos pr\u00e1cticos y credenciales on-chain me ayudaron a conseguir mi primer empleo en Web3.',
                },
                xp: '12,500',
              },
              {
                name: 'Ana Costa',
                role: { 'pt-BR': 'Pesquisadora DeFi', 'en': 'DeFi Researcher', 'es': 'Investigadora DeFi' },
                quote: {
                  'pt-BR': 'O sistema de gamifica\u00e7\u00e3o me manteve motivada. Completei 4 cursos em 2 meses e ganhei credenciais verificadas na blockchain.',
                  'en': 'The gamification system kept me motivated. I completed 4 courses in 2 months and earned verified credentials on the blockchain.',
                  'es': 'El sistema de gamificaci\u00f3n me mantuvo motivada. Complet\u00e9 4 cursos en 2 meses y gan\u00e9 credenciales verificadas en la blockchain.',
                },
                xp: '8,200',
              },
              {
                name: 'Lucas Oliveira',
                role: { 'pt-BR': 'Engenheiro de Smart Contracts', 'en': 'Smart Contract Engineer', 'es': 'Ingeniero de Smart Contracts' },
                quote: {
                  'pt-BR': 'Dos cursos de Anchor ao deploy em devnet, cada aula foi objetiva e pr\u00e1tica. Recomendo para qualquer dev que quer entrar no ecossistema Solana.',
                  'en': 'From Anchor courses to devnet deployment, every lesson was focused and practical. Highly recommend for any dev wanting to join the Solana ecosystem.',
                  'es': 'Desde los cursos de Anchor hasta el deploy en devnet, cada lecci\u00f3n fue objetiva y pr\u00e1ctica. Recomiendo a cualquier dev que quiera entrar al ecosistema Solana.',
                },
                xp: '15,300',
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6 flex flex-col"
              >
                <Quote className="h-6 w-6 text-purple-500/40 mb-3" />
                <p className="text-sm text-gray-300 leading-relaxed flex-1 mb-4">
                  {L(testimonial.quote)}
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{testimonial.name}</div>
                    <div className="text-xs text-gray-400">{L(testimonial.role)}</div>
                  </div>
                  <div className="text-xs font-bold text-yellow-400">{testimonial.xp} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </AnimatedSection>

      {/* Trusted by / Partner logos */}
      <section className="border-y border-gray-800 bg-gray-900/30 py-10 px-4">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-medium text-gray-400 uppercase tracking-widest mb-6">{t('trusted_by')}</p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-60">
            {[
              { name: 'Solana', gradient: 'from-purple-400 to-indigo-400' },
              { name: 'Metaplex', gradient: 'from-pink-400 to-purple-400' },
              { name: 'Helius', gradient: 'from-orange-400 to-red-400' },
              { name: 'Jupiter', gradient: 'from-green-400 to-teal-400' },
              { name: 'Superteam', gradient: 'from-blue-400 to-indigo-400' },
            ].map((partner) => (
              <div key={partner.name} className="flex items-center gap-2 group hover:opacity-100 transition-opacity">
                <div className={cn('h-6 w-6 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold', partner.gradient)}>
                  {partner.name[0]}
                </div>
                <span className={cn('text-sm font-bold bg-gradient-to-r bg-clip-text text-transparent', partner.gradient)}>
                  {partner.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <AnimatedSection>
      <section className="py-24 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">{t('how_it_works')}</h2>
            <p className="text-gray-400">{t('four_steps')}</p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute top-8 left-8 right-8 hidden lg:block h-0.5 bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-800" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map(({ n, titleKey, descKey, icon: Icon }) => (
                <div
                  key={n}
                  className="relative text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-purple-700 bg-gray-900 relative z-10">
                    <Icon className="h-7 w-7 text-purple-400" />
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                      {n}
                    </span>
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-white">{t(titleKey)}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{t(descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection>
      <section className="py-20 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-indigo-900/80 to-gray-900" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent" />
            <div className="relative border border-purple-800/50 rounded-3xl p-10 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-700/60 bg-purple-900/30 px-3 py-1 text-xs font-medium text-purple-300">
                <CheckCircle className="h-3 w-3" />
                {t('free_to_start')}
              </div>
              <h2 className="mb-4 text-3xl sm:text-4xl font-extrabold text-white">
                {t('cta_title')}
              </h2>
              <p className="mb-8 text-gray-300 max-w-md mx-auto">
                {t('cta_subtitle')}
              </p>
              <Link
                href={localePath(locale, '/courses')}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-gray-900 hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
              >
                {t('hero_cta')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      </AnimatedSection>
    </div>
  );
}
