'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import {
  Search, BookOpen, Clock, Users, Zap, Star, SlidersHorizontal, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { localePath } from '@/lib/paths';

const L = (obj: Record<string, string>, locale: string) => obj[locale] ?? obj['pt-BR'];

const MOCK_COURSES = [
  {
    slug: 'intro-solana',
    title: {
      'pt-BR': 'Introdução ao Solana',
      'en': 'Introduction to Solana',
      'es': 'Introducción a Solana',
    },
    desc: {
      'pt-BR': 'Aprenda os fundamentos da blockchain Solana: arquitetura, contas, transações e programas.',
      'en': 'Learn the fundamentals of the Solana blockchain: architecture, accounts, transactions, and programs.',
      'es': 'Aprende los fundamentos de la blockchain Solana: arquitectura, cuentas, transacciones y programas.',
    },
    level: 'Beginner' as const,
    xp: 1000,
    lessons: 8,
    hours: 4,
    track: 'Solana',
    color: 'from-purple-600 to-indigo-600',
    students: 456,
    rating: 4.9,
  },
  {
    slug: 'anchor-basics',
    title: {
      'pt-BR': 'Fundamentos do Anchor',
      'en': 'Anchor Fundamentals',
      'es': 'Fundamentos de Anchor',
    },
    desc: {
      'pt-BR': 'Domine o framework Anchor para escrever smart contracts Solana em Rust de forma produtiva.',
      'en': 'Master the Anchor framework for writing Solana smart contracts in Rust productively.',
      'es': 'Domina el framework Anchor para escribir smart contracts de Solana en Rust de forma productiva.',
    },
    level: 'Intermediate' as const,
    xp: 1500,
    lessons: 10,
    hours: 6,
    track: 'Anchor',
    color: 'from-green-600 to-teal-600',
    students: 312,
    rating: 4.8,
  },
  {
    slug: 'defi-solana',
    title: {
      'pt-BR': 'DeFi no Solana',
      'en': 'DeFi on Solana',
      'es': 'DeFi en Solana',
    },
    desc: {
      'pt-BR': 'Construa protocolos DeFi: AMMs, lending, staking e yield farming na Solana.',
      'en': 'Build DeFi protocols: AMMs, lending, staking, and yield farming on Solana.',
      'es': 'Construye protocolos DeFi: AMMs, lending, staking y yield farming en Solana.',
    },
    level: 'Advanced' as const,
    xp: 2000,
    lessons: 12,
    hours: 8,
    track: 'DeFi',
    color: 'from-orange-600 to-red-600',
    students: 198,
    rating: 4.7,
  },
  {
    slug: 'nft-metaplex',
    title: {
      'pt-BR': 'NFTs com Metaplex',
      'en': 'NFTs with Metaplex',
      'es': 'NFTs con Metaplex',
    },
    desc: {
      'pt-BR': 'Crie coleções NFT, royalties e marketplaces usando o padrão Metaplex na Solana.',
      'en': 'Create NFT collections, royalties, and marketplaces using the Metaplex standard on Solana.',
      'es': 'Crea colecciones NFT, regalías y marketplaces usando el estándar Metaplex en Solana.',
    },
    level: 'Intermediate' as const,
    xp: 1800,
    lessons: 9,
    hours: 5,
    track: 'NFTs',
    color: 'from-pink-600 to-purple-600',
    students: 287,
    rating: 4.8,
  },
  {
    slug: 'solana-security',
    title: {
      'pt-BR': 'Segurança em Contratos Solana',
      'en': 'Solana Contract Security',
      'es': 'Seguridad en Contratos Solana',
    },
    desc: {
      'pt-BR': 'Identifique e corrija vulnerabilidades comuns em programas Solana. Auditorias e melhores práticas.',
      'en': 'Identify and fix common vulnerabilities in Solana programs. Audits and best practices.',
      'es': 'Identifica y corrige vulnerabilidades comunes en programas Solana. Auditorías y mejores prácticas.',
    },
    level: 'Advanced' as const,
    xp: 2500,
    lessons: 11,
    hours: 9,
    track: 'Security',
    color: 'from-red-600 to-orange-600',
    students: 143,
    rating: 4.9,
  },
  {
    slug: 'token-extensions',
    title: {
      'pt-BR': 'Token Extensions (Token-2022)',
      'en': 'Token Extensions (Token-2022)',
      'es': 'Token Extensions (Token-2022)',
    },
    desc: {
      'pt-BR': 'Explore o novo padrão Token-2022: transfer fees, confidential transfers, interest-bearing tokens.',
      'en': 'Explore the new Token-2022 standard: transfer fees, confidential transfers, interest-bearing tokens.',
      'es': 'Explora el nuevo estándar Token-2022: comisiones de transferencia, transferencias confidenciales, tokens con interés.',
    },
    level: 'Intermediate' as const,
    xp: 1600,
    lessons: 8,
    hours: 5,
    track: 'Tokens',
    color: 'from-blue-600 to-cyan-600',
    students: 221,
    rating: 4.7,
  },
  {
    slug: 'solana-mobile',
    title: {
      'pt-BR': 'Solana Mobile (dApp Store)',
      'en': 'Solana Mobile (dApp Store)',
      'es': 'Solana Mobile (dApp Store)',
    },
    desc: {
      'pt-BR': 'Construa aplicativos móveis Web3 para Android usando Mobile Wallet Adapter e Solana Pay.',
      'en': 'Build Web3 mobile apps for Android using Mobile Wallet Adapter and Solana Pay.',
      'es': 'Construye aplicaciones móviles Web3 para Android usando Mobile Wallet Adapter y Solana Pay.',
    },
    level: 'Intermediate' as const,
    xp: 1700,
    lessons: 9,
    hours: 6,
    track: 'Mobile',
    color: 'from-cyan-600 to-blue-600',
    students: 167,
    rating: 4.6,
  },
  {
    slug: 'solana-pay',
    title: {
      'pt-BR': 'Solana Pay & Commerce',
      'en': 'Solana Pay & Commerce',
      'es': 'Solana Pay & Commerce',
    },
    desc: {
      'pt-BR': 'Integre pagamentos Solana em aplicações web e POS físicos. Checkout, QR codes e confirmações.',
      'en': 'Integrate Solana payments into web apps and physical POS. Checkout, QR codes, and confirmations.',
      'es': 'Integra pagos de Solana en aplicaciones web y POS físicos. Checkout, códigos QR y confirmaciones.',
    },
    level: 'Beginner' as const,
    xp: 800,
    lessons: 6,
    hours: 3,
    track: 'Solana',
    color: 'from-indigo-600 to-purple-600',
    students: 389,
    rating: 4.8,
  },
];

// Internal level keys — locale-independent for filter logic
type LevelKey = 'Beginner' | 'Intermediate' | 'Advanced';

const LEVEL_COLORS: Record<LevelKey, string> = {
  Beginner:     'bg-green-900/60 text-green-300 border border-green-700/50',
  Intermediate: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50',
  Advanced:     'bg-red-900/60 text-red-300 border border-red-700/50',
};

// Track display names keyed by internal value — tracks are shown in original language except the "all" option
const FIXED_TRACKS = ['Solana', 'DeFi', 'NFTs', 'Anchor', 'Tokens', 'Security', 'Mobile'] as const;

export default function CoursesPage() {
  const locale = useLocale();
  const t = useTranslations('courses');

  const LEVEL_OPTIONS: { key: string; label: string }[] = [
    { key: 'all',          label: t('filter_all') },
    { key: 'Beginner',     label: t('filter_beginner') },
    { key: 'Intermediate', label: t('filter_intermediate') },
    { key: 'Advanced',     label: t('filter_advanced') },
  ];

  const TRACK_OPTIONS: { key: string; label: string }[] = [
    { key: 'all',      label: t('track_all') },
    { key: 'Solana',   label: 'Solana' },
    { key: 'DeFi',     label: 'DeFi' },
    { key: 'NFTs',     label: 'NFTs' },
    { key: 'Anchor',   label: t('track_anchor') },
    { key: 'Tokens',   label: t('track_tokens') },
    { key: 'Security', label: t('track_security') },
    { key: 'Mobile',   label: t('track_mobile') },
  ];

  const SORT_OPTIONS = [
    { value: 'popular', label: t('sort_popular') },
    { value: 'newest',  label: t('sort_recent') },
    { value: 'xp',      label: t('sort_xp') },
  ];

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [trackFilter, setTrackFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  const filtered = useMemo(() => {
    let result = [...MOCK_COURSES];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          L(c.title, locale).toLowerCase().includes(q) ||
          c.track.toLowerCase().includes(q) ||
          L(c.desc, locale).toLowerCase().includes(q)
      );
    }
    if (levelFilter !== 'all') {
      result = result.filter((c) => c.level === levelFilter);
    }
    if (trackFilter !== 'all') {
      result = result.filter((c) => c.track === trackFilter);
    }

    if (sortBy === 'popular') result.sort((a, b) => b.students - a.students);
    if (sortBy === 'xp') result.sort((a, b) => b.xp - a.xp);
    if (sortBy === 'newest') result.reverse();

    return result;
  }, [search, levelFilter, trackFilter, sortBy, locale]);

  const hasFilters = levelFilter !== 'all' || trackFilter !== 'all' || search.trim();

  const levelBadgeLabel = (level: LevelKey): string => {
    if (level === 'Beginner')     return t('level_badge_beginner');
    if (level === 'Intermediate') return t('level_badge_intermediate');
    return t('level_badge_advanced');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60 py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-2 text-4xl font-extrabold text-white">{t('catalog_title')}</h1>
          <p className="text-gray-400">
            {t('catalog_subtitle')} — {t('available_count', { count: MOCK_COURSES.length })}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Search + Sort row */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-gray-400 hover:text-gray-300" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter pills — Level */}
        <div className="mb-4 flex flex-wrap gap-2">
          {LEVEL_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setLevelFilter(key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium border transition-all',
                levelFilter === key
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-gray-200'
              )}
            >
              {label}
            </button>
          ))}
          <div className="h-6 w-px bg-gray-700 self-center mx-1" />
          {TRACK_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTrackFilter(key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium border transition-all',
                trackFilter === key
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-gray-200'
              )}
            >
              {label}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={() => { setLevelFilter('all'); setTrackFilter('all'); setSearch(''); }}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-red-400 border border-red-800/50 bg-red-900/20 hover:bg-red-900/30 transition-all"
            >
              <X className="h-3 w-3" /> {t('clear')}
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="mb-6 text-sm text-gray-400">
          {t('available_count', { count: filtered.length })}
        </div>

        {/* Course grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="mx-auto h-12 w-12 text-gray-700 mb-3" />
            <p className="text-gray-400 text-lg">{t('no_results')}</p>
            <button
              onClick={() => { setLevelFilter('all'); setTrackFilter('all'); setSearch(''); }}
              className="mt-4 text-sm text-purple-400 hover:text-purple-300"
            >
              {t('clear_filters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((course) => (
              <Link key={course.slug} href={localePath(locale, `/courses/${course.slug}`)}>
                <div className="group relative rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden hover:border-gray-600 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-gray-950/50 h-full flex flex-col">
                  {/* Gradient header */}
                  <div className={cn('h-28 bg-gradient-to-br', course.color, 'relative overflow-hidden flex-shrink-0')}>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-2 left-3 flex items-center gap-2">
                      <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        {course.track}
                      </span>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', LEVEL_COLORS[course.level])}>
                        {levelBadgeLabel(course.level)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="mb-1.5 text-sm font-semibold text-white leading-snug group-hover:text-purple-300 transition-colors line-clamp-2">
                      {L(course.title, locale)}
                    </h3>
                    <p className="mb-3 text-xs text-gray-400 leading-relaxed line-clamp-2 flex-1">
                      {L(course.desc, locale)}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={cn('h-3 w-3', j < Math.floor(course.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700')} />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">{course.rating}</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-1 text-xs text-gray-400 border-t border-gray-800 pt-3">
                      <div className="flex flex-col items-center gap-0.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{course.lessons} {t('lessons')}</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{course.hours}h</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <Zap className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="text-yellow-400 font-medium">+{course.xp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Students online */}
        <div className="mt-12 flex items-center justify-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>
            {MOCK_COURSES.reduce((a, c) => a + c.students, 0).toLocaleString()} {t('enrolled_learners')}
          </span>
        </div>
      </div>
    </div>
  );
}
