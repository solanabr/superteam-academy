'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import {
  Search, BookOpen, Clock, Users, Zap, Star, SlidersHorizontal, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MOCK_COURSES = [
  {
    slug: 'intro-solana',
    title: 'Introdução ao Solana',
    desc: 'Aprenda os fundamentos da blockchain Solana: arquitetura, contas, transações e programas.',
    level: 'Iniciante',
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
    title: 'Fundamentos do Anchor',
    desc: 'Domine o framework Anchor para escrever smart contracts Solana em Rust de forma produtiva.',
    level: 'Intermediário',
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
    title: 'DeFi no Solana',
    desc: 'Construa protocolos DeFi: AMMs, lending, staking e yield farming na Solana.',
    level: 'Avançado',
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
    title: 'NFTs com Metaplex',
    desc: 'Crie coleções NFT, royalties e marketplaces usando o padrão Metaplex na Solana.',
    level: 'Intermediário',
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
    title: 'Segurança em Contratos Solana',
    desc: 'Identifique e corrija vulnerabilidades comuns em programas Solana. Auditorias e melhores práticas.',
    level: 'Avançado',
    xp: 2500,
    lessons: 11,
    hours: 9,
    track: 'Segurança',
    color: 'from-red-600 to-orange-600',
    students: 143,
    rating: 4.9,
  },
  {
    slug: 'token-extensions',
    title: 'Token Extensions (Token-2022)',
    desc: 'Explore o novo padrão Token-2022: transfer fees, confidential transfers, interest-bearing tokens.',
    level: 'Intermediário',
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
    title: 'Solana Mobile (dApp Store)',
    desc: 'Construa aplicativos móveis Web3 para Android usando Mobile Wallet Adapter e Solana Pay.',
    level: 'Intermediário',
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
    title: 'Solana Pay & Commerce',
    desc: 'Integre pagamentos Solana em aplicações web e POS físicos. Checkout, QR codes e confirmações.',
    level: 'Iniciante',
    xp: 800,
    lessons: 6,
    hours: 3,
    track: 'Solana',
    color: 'from-indigo-600 to-purple-600',
    students: 389,
    rating: 4.8,
  },
];

const LEVEL_OPTIONS = ['Todos', 'Iniciante', 'Intermediário', 'Avançado'];
const TRACK_OPTIONS = ['Todos os Tracks', 'Solana', 'DeFi', 'NFTs', 'Anchor', 'Tokens', 'Segurança', 'Mobile'];
const SORT_OPTIONS = [
  { value: 'popular', label: 'Mais Popular' },
  { value: 'newest', label: 'Mais Recente' },
  { value: 'xp', label: 'Mais XP' },
];

const LEVEL_COLORS: Record<string, string> = {
  Iniciante: 'bg-green-900/60 text-green-300 border border-green-700/50',
  Intermediário: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50',
  Avançado: 'bg-red-900/60 text-red-300 border border-red-700/50',
};

export default function CoursesPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('Todos');
  const [trackFilter, setTrackFilter] = useState('Todos os Tracks');
  const [sortBy, setSortBy] = useState('popular');

  const filtered = useMemo(() => {
    let result = [...MOCK_COURSES];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.title.toLowerCase().includes(q) || c.track.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
      );
    }
    if (levelFilter !== 'Todos') {
      result = result.filter((c) => c.level === levelFilter);
    }
    if (trackFilter !== 'Todos os Tracks') {
      result = result.filter((c) => c.track === trackFilter);
    }

    if (sortBy === 'popular') result.sort((a, b) => b.students - a.students);
    if (sortBy === 'xp') result.sort((a, b) => b.xp - a.xp);
    if (sortBy === 'newest') result.reverse();

    return result;
  }, [search, levelFilter, trackFilter, sortBy]);

  const hasFilters = levelFilter !== 'Todos' || trackFilter !== 'Todos os Tracks' || search.trim();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60 py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-2 text-4xl font-extrabold text-white">Catálogo de Cursos</h1>
          <p className="text-gray-400">
            Explore nossa biblioteca Web3 — {MOCK_COURSES.length} cursos disponíveis
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Search + Sort row */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar cursos, tracks, tópicos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-gray-500 hover:text-gray-300" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-500" />
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
          {LEVEL_OPTIONS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium border transition-all',
                levelFilter === lvl
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-gray-200'
              )}
            >
              {lvl}
            </button>
          ))}
          <div className="h-6 w-px bg-gray-700 self-center mx-1" />
          {TRACK_OPTIONS.map((track) => (
            <button
              key={track}
              onClick={() => setTrackFilter(track)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium border transition-all',
                trackFilter === track
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-gray-200'
              )}
            >
              {track === 'Todos os Tracks' ? 'Todos' : track}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={() => { setLevelFilter('Todos'); setTrackFilter('Todos os Tracks'); setSearch(''); }}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-red-400 border border-red-800/50 bg-red-900/20 hover:bg-red-900/30 transition-all"
            >
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="mb-6 text-sm text-gray-500">
          {filtered.length === MOCK_COURSES.length
            ? `${MOCK_COURSES.length} cursos disponíveis`
            : `${filtered.length} curso${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
        </div>

        {/* Course grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="mx-auto h-12 w-12 text-gray-700 mb-3" />
            <p className="text-gray-500 text-lg">Nenhum curso encontrado.</p>
            <button
              onClick={() => { setLevelFilter('Todos'); setTrackFilter('Todos os Tracks'); setSearch(''); }}
              className="mt-4 text-sm text-purple-400 hover:text-purple-300"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((course) => (
              <Link key={course.slug} href={`/${locale}/cursos/${course.slug}`}>
                <div className="group relative rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden hover:border-gray-600 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-gray-950/50 h-full flex flex-col">
                  {/* Gradient header */}
                  <div className={cn('h-28 bg-gradient-to-br', course.color, 'relative overflow-hidden flex-shrink-0')}>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-2 left-3 flex items-center gap-2">
                      <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        {course.track}
                      </span>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', LEVEL_COLORS[course.level])}>
                        {course.level}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="mb-1.5 text-sm font-semibold text-white leading-snug group-hover:text-purple-300 transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="mb-3 text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">
                      {course.desc}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={cn('h-3 w-3', j < Math.floor(course.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700')} />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">{course.rating}</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-1 text-xs text-gray-500 border-t border-gray-800 pt-3">
                      <div className="flex flex-col items-center gap-0.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{course.lessons} aulas</span>
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
            {MOCK_COURSES.reduce((a, c) => a + c.students, 0).toLocaleString()} aprendizes matriculados nos cursos
          </span>
        </div>
      </div>
    </div>
  );
}
