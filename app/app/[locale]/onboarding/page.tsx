'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Rocket, Wallet, BookOpen, CheckCircle, ChevronRight,
  ChevronLeft, Zap, Award, Globe, ArrowRight,
} from 'lucide-react';
import GoogleSignIn, { useGoogleUser } from '@/components/GoogleSignIn';
import { cn } from '@/lib/utils';
import { localePath } from '@/lib/paths';

const L = (obj: Record<string, string>, locale: string) => obj[locale] ?? obj['pt-BR'];

const STARTER_COURSES = [
  {
    id: 'intro-solana',
    slug: 'intro-solana',
    title: {
      'pt-BR': 'Introdução ao Solana',
      en: 'Introduction to Solana',
      es: 'Introducción a Solana',
    },
    desc: {
      'pt-BR': 'Aprenda os fundamentos do Solana: carteiras, transações, contas e PDAs.',
      en: 'Learn Solana fundamentals: wallets, transactions, accounts, and PDAs.',
      es: 'Aprende los fundamentos de Solana: billeteras, transacciones, cuentas y PDAs.',
    },
    lessons: 8,
    xp: 1200,
    level: { 'pt-BR': 'Iniciante', en: 'Beginner', es: 'Principiante' },
    color: 'from-purple-600 to-indigo-600',
    icon: Rocket,
  },
  {
    id: 'anchor-basics',
    slug: 'anchor-basics',
    title: {
      'pt-BR': 'Fundamentos do Anchor',
      en: 'Anchor Fundamentals',
      es: 'Fundamentos de Anchor',
    },
    desc: {
      'pt-BR': 'Construa programas Solana com Anchor: structs, constraints e testes.',
      en: 'Build Solana programs with Anchor: structs, constraints, and testing.',
      es: 'Construye programas Solana con Anchor: structs, constraints y pruebas.',
    },
    lessons: 10,
    xp: 1800,
    level: { 'pt-BR': 'Intermediário', en: 'Intermediate', es: 'Intermedio' },
    color: 'from-green-600 to-teal-600',
    icon: BookOpen,
  },
  {
    id: 'defi-solana',
    slug: 'defi-solana',
    title: {
      'pt-BR': 'DeFi no Solana',
      en: 'DeFi on Solana',
      es: 'DeFi en Solana',
    },
    desc: {
      'pt-BR': 'Explore DeFi: AMMs, lending, staking e protocolos avançados.',
      en: 'Explore DeFi: AMMs, lending, staking, and advanced protocols.',
      es: 'Explora DeFi: AMMs, préstamos, staking y protocolos avanzados.',
    },
    lessons: 12,
    xp: 2200,
    level: { 'pt-BR': 'Avançado', en: 'Advanced', es: 'Avanzado' },
    color: 'from-orange-600 to-red-600',
    icon: Zap,
  },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            i === current ? 'w-8 bg-purple-500' : i < current ? 'w-2 bg-purple-700' : 'w-2 bg-gray-700',
          )}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const locale = useLocale();
  const t = useTranslations('onboarding');
  const router = useRouter();
  const { connected } = useWallet();
  const googleUser = useGoogleUser();
  const [step, setStep] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // If user has completed onboarding before, redirect to dashboard
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('onboarding_complete')) {
      router.replace(localePath(locale, '/dashboard'));
    }
  }, [locale, router]);

  // Auto-advance past wallet step if already connected
  useEffect(() => {
    if ((connected || googleUser) && step === 1) {
      const timer = setTimeout(() => setStep(2), 1500);
      return () => clearTimeout(timer);
    }
  }, [connected, googleUser, step]);

  function completeOnboarding() {
    localStorage.setItem('onboarding_complete', '1');
    if (selectedCourse) {
      router.push(localePath(locale, `/courses/${selectedCourse}`));
    } else {
      router.push(localePath(locale, '/dashboard'));
    }
  }

  const STEPS = [
    // Step 0: Welcome
    <div key="welcome" className="text-center max-w-lg mx-auto">
      <div className="mb-8 flex justify-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-2xl shadow-purple-900/50">
            <Rocket className="h-12 w-12 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 border-2 border-gray-950">
            <Globe className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-4 leading-tight">
        {t('welcome_title')}
      </h1>
      <p className="text-gray-400 text-sm leading-relaxed mb-10">
        {t('welcome_subtitle')}
      </p>
      <button
        onClick={() => setStep(1)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-900/30"
      >
        {t('welcome_cta')}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>,

    // Step 1: Connect Wallet
    <div key="wallet" className="text-center max-w-lg mx-auto">
      <div className="mb-8 flex justify-center">
        <div className={cn(
          'flex h-24 w-24 items-center justify-center rounded-3xl shadow-2xl transition-all duration-500',
          (connected || googleUser)
            ? 'bg-gradient-to-br from-green-600 to-emerald-600 shadow-green-900/50'
            : 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-purple-900/50',
        )}>
          {(connected || googleUser) ? (
            <CheckCircle className="h-12 w-12 text-white" />
          ) : (
            <Wallet className="h-12 w-12 text-white" />
          )}
        </div>
      </div>
      {(connected || googleUser) ? (
        <>
          <h2 className="text-2xl font-extrabold text-white mb-2">{t('step_wallet_connected')}</h2>
          <p className="text-green-400 text-sm">Redirecting...</p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-extrabold text-white mb-3">{t('step_wallet_title')}</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            {t('step_wallet_subtitle')}
          </p>
          <div className="space-y-4">
            <WalletMultiButton
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                padding: '0.75rem 2rem',
                height: '3rem',
                width: '100%',
                justifyContent: 'center',
              }}
            />
            <p className="text-xs text-gray-600">{t('step_wallet_phantom')}</p>
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-xs text-gray-600 uppercase tracking-widest">ou</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>
            <div className="flex justify-center">
              <GoogleSignIn
                onSuccess={() => window.location.reload()}
                theme="filled_black"
                size="large"
                text="continue_with"
              />
            </div>
            <p className="text-xs text-gray-600">{t('step_wallet_skip_note')}</p>
          </div>
          <button
            onClick={() => setStep(2)}
            className="mt-6 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {t('skip')} →
          </button>
        </>
      )}
    </div>,

    // Step 2: Choose Course
    <div key="course" className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-white mb-3">{t('step_course_title')}</h2>
        <p className="text-gray-400 text-sm">{t('step_course_subtitle')}</p>
      </div>
      <div className="space-y-3">
        {STARTER_COURSES.map((course) => {
          const Icon = course.icon;
          const isSelected = selectedCourse === course.slug;
          return (
            <button
              key={course.id}
              onClick={() => setSelectedCourse(isSelected ? null : course.slug)}
              className={cn(
                'w-full text-left rounded-2xl border p-5 transition-all',
                isSelected
                  ? 'border-purple-600 bg-purple-900/20 ring-1 ring-purple-600/50'
                  : 'border-gray-800 bg-gray-900/60 hover:border-gray-700',
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br', course.color)}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">{L(course.title, locale)}</h3>
                    {isSelected && <CheckCircle className="h-5 w-5 text-purple-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{L(course.desc, locale)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">{course.lessons} lessons</span>
                    <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                      <Zap className="h-3 w-3" />
                      {course.xp} XP
                    </span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      course.id === 'intro-solana' ? 'bg-green-900/50 text-green-300' :
                      course.id === 'anchor-basics' ? 'bg-blue-900/50 text-blue-300' :
                      'bg-orange-900/50 text-orange-300',
                    )}>
                      {L(course.level, locale)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('back')}
        </button>
        <button
          onClick={() => setStep(3)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:from-purple-500 hover:to-indigo-500 transition-all"
        >
          {t('next')}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>,

    // Step 3: Ready
    <div key="ready" className="text-center max-w-lg mx-auto">
      <div className="mb-8 flex justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-green-600 to-emerald-600 shadow-2xl shadow-green-900/50">
          <Award className="h-12 w-12 text-white" />
        </div>
      </div>
      <h2 className="text-3xl font-extrabold text-white mb-4">{t('step_ready_title')}</h2>
      <p className="text-gray-400 text-sm leading-relaxed mb-10">
        {t('step_ready_subtitle')}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={completeOnboarding}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-900/30"
        >
          {selectedCourse ? t('step_ready_cta') : t('step_ready_cta')}
          <ArrowRight className="h-4 w-4" />
        </button>
        <Link
          href={localePath(locale, '/courses')}
          onClick={() => localStorage.setItem('onboarding_complete', '1')}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-6 py-3 text-sm text-gray-300 hover:border-gray-600 hover:text-white transition-all"
        >
          {t('step_ready_explore')}
        </Link>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-10">
        <StepIndicator current={step} total={4} />
      </div>
      <div className="w-full max-w-2xl">
        {STEPS[step]}
      </div>
      {step > 0 && step < 3 && (
        <p className="mt-8 text-xs text-gray-600">
          {t('step')} {step + 1} {t('of')} 4
        </p>
      )}
    </div>
  );
}
