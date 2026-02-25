import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  Trophy,
  Award,
  BookOpen,
  Zap,
  Flame,
  Star,
  Share2,
  Calendar,
  ExternalLink,
  CheckCircle,
  Lock,
  BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const L = (obj: Record<string, string>, locale: string) => obj[locale] ?? obj['pt-BR'];

// ---------- mock data ----------

const SKILLS = [
  { name: 'Solana',    pct: 90, color: 'from-purple-500 to-indigo-500' },
  { name: 'Anchor',   pct: 75, color: 'from-green-500 to-teal-500' },
  { name: 'DeFi',     pct: 60, color: 'from-blue-500 to-cyan-500' },
  { name: 'NFTs',     pct: 70, color: 'from-pink-500 to-rose-500' },
  {
    name: {
      'pt-BR': 'Segurança',
      'en': 'Security',
      'es': 'Seguridad',
    },
    pct: 45,
    color: 'from-orange-500 to-red-500',
  },
];

const CREDENTIALS = [
  {
    id: 'cred-1',
    name: {
      'pt-BR': 'Introdução ao Solana',
      'en': 'Introduction to Solana',
      'es': 'Introducción a Solana',
    },
    track: 'Solana',
    color: 'from-purple-600 to-indigo-600',
    xp: 1000,
    issuedDate: '10 Jan 2025',
    mintAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    mintShort: '7xKX...sAsU',
  },
  {
    id: 'cred-2',
    name: {
      'pt-BR': 'NFTs com Metaplex',
      'en': 'NFTs with Metaplex',
      'es': 'NFTs con Metaplex',
    },
    track: 'NFTs',
    color: 'from-pink-600 to-purple-600',
    xp: 1800,
    issuedDate: '05 Fev 2025',
    mintAddress: 'Ap9Stg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosg7kLm',
    mintShort: 'Ap9S...7kLm',
  },
];

const ACHIEVEMENTS = [
  {
    emoji: '🚀',
    name: { 'pt-BR': 'Primeiro Voo',  'en': 'First Flight',    'es': 'Primer Vuelo'    },
    desc: { 'pt-BR': 'Completou a primeira aula', 'en': 'Completed the first lesson', 'es': 'Completó la primera lección' },
    unlocked: true,
  },
  {
    emoji: '🔥',
    name: { 'pt-BR': 'Em Chamas',     'en': 'On Fire',          'es': 'En Llamas'       },
    desc: { 'pt-BR': '7 dias de sequência', 'en': '7-day streak', 'es': 'Racha de 7 días' },
    unlocked: true,
  },
  {
    emoji: '💻',
    name: { 'pt-BR': 'Coder',         'en': 'Coder',            'es': 'Programador'     },
    desc: { 'pt-BR': 'Primeiro desafio concluído', 'en': 'First challenge completed', 'es': 'Primer desafío completado' },
    unlocked: true,
  },
  {
    emoji: '🏆',
    name: { 'pt-BR': 'Top 10',        'en': 'Top 10',           'es': 'Top 10'          },
    desc: { 'pt-BR': 'Entre no top 10 do ranking', 'en': 'Make the top 10 leaderboard', 'es': 'Entra al top 10 del ranking' },
    unlocked: false,
  },
  {
    emoji: '🎓',
    name: { 'pt-BR': 'Diplomado',     'en': 'Graduate',         'es': 'Graduado'        },
    desc: { 'pt-BR': 'Complete um curso completo', 'en': 'Complete a full course', 'es': 'Completa un curso completo' },
    unlocked: false,
  },
  {
    emoji: '⚡',
    name: { 'pt-BR': 'Velocista',     'en': 'Speed Runner',     'es': 'Velocista'       },
    desc: { 'pt-BR': '5 aulas em 1 dia', 'en': '5 lessons in 1 day', 'es': '5 lecciones en 1 día' },
    unlocked: false,
  },
];

const COURSES_COMPLETED = [
  {
    slug: 'intro-solana',
    title: {
      'pt-BR': 'Introdução ao Solana',
      'en': 'Introduction to Solana',
      'es': 'Introducción a Solana',
    },
    xp: 1000,
    completedDate: '10 Jan 2025',
    color: 'from-purple-600 to-indigo-600',
  },
  {
    slug: 'nft-metaplex',
    title: {
      'pt-BR': 'NFTs com Metaplex',
      'en': 'NFTs with Metaplex',
      'es': 'NFTs con Metaplex',
    },
    xp: 1800,
    completedDate: '05 Fev 2025',
    color: 'from-pink-600 to-purple-600',
  },
  {
    slug: 'defi-basics',
    title: {
      'pt-BR': 'DeFi no Solana',
      'en': 'DeFi on Solana',
      'es': 'DeFi en Solana',
    },
    xp: 1200,
    completedDate: '20 Fev 2025',
    color: 'from-blue-600 to-cyan-600',
  },
];

const TOTAL_XP   = 8250;
const LEVEL      = 12;
const STREAK     = 14;
const JOIN_DATE  = 'Jan 2025';

function truncate(addr: string): string {
  if (addr.length <= 12) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

// ---------- page ----------

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ address: string; locale: string }>;
}) {
  const { address, locale } = await params;
  const t = await getTranslations('profile');

  const displayAddress = truncate(address);
  const initials = address.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-12">
      {/* ---- Profile header ---- */}
      <div className="relative border-b border-gray-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-indigo-900/10 to-gray-950" />
        <div className="relative mx-auto max-w-5xl px-4 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-2xl font-extrabold text-white shadow-lg">
                {initials}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 border-2 border-gray-950 text-xs font-bold text-white">
                {LEVEL}
              </div>
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold text-white font-mono">{displayAddress}</h1>
                <CheckCircle className="h-5 w-5 text-blue-400 shrink-0" />
                <span className="inline-flex items-center rounded-full bg-purple-900/40 border border-purple-700/30 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
                  {t('level')} {LEVEL}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-purple-400" />
                  {t('developer')}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {t('joined')} {JOIN_DATE}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-400" />
                  {t('streak_days_count', { count: STREAK })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              <a
                href={`https://explorer.solana.com/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 hover:border-gray-600 hover:text-white transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Explorer
              </a>
              <button className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 hover:border-gray-600 hover:text-white transition-all">
                <Share2 className="h-3.5 w-3.5" />
                {t('share')}
              </button>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: t('xp_total'),           value: TOTAL_XP.toLocaleString(), icon: Zap,      color: 'text-yellow-400' },
              { label: t('courses_completed'),  value: String(COURSES_COMPLETED.length), icon: BookOpen, color: 'text-blue-400'   },
              { label: t('credentials'),        value: String(CREDENTIALS.length),       icon: Award,    color: 'text-green-400'  },
              { label: t('streak_record'),      value: `${STREAK} dias`,                 icon: Flame,    color: 'text-orange-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center"
              >
                <Icon className={cn('mx-auto mb-1.5 h-5 w-5', color)} />
                <div className="text-xl font-extrabold text-white">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Body ---- */}
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">

        {/* Habilidades */}
        <section>
          <h2 className="flex items-center gap-2 text-base font-bold text-white mb-5">
            <BarChart2 className="h-5 w-5 text-purple-400" />
            {t('skills')}
          </h2>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-4">
            {SKILLS.map((skill) => {
              const skillName = typeof skill.name === 'string' ? skill.name : L(skill.name, locale);
              return (
                <div key={skillName}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-300">{skillName}</span>
                    <span className="text-gray-500 tabular-nums">{skill.pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full bg-gradient-to-r', skill.color)}
                      style={{ width: `${skill.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Credenciais NFT */}
        <section>
          <h2 className="flex items-center gap-2 text-base font-bold text-white mb-5">
            <Award className="h-5 w-5 text-green-400" />
            {t('nft_credentials')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CREDENTIALS.map((cred) => (
              <div
                key={cred.id}
                className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden hover:border-gray-700 transition-all"
              >
                {/* Gradient header band */}
                <div className={cn('h-20 bg-gradient-to-br flex items-center justify-center', cred.color)}>
                  <Award className="h-8 w-8 text-white/80" />
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{L(cred.name, locale)}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t('issued_on')} {cred.issuedDate} · Track {cred.track}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-900/30 border border-green-700/30 px-2 py-0.5 text-xs font-medium text-green-400">
                      <CheckCircle className="h-3 w-3" />
                      {t('verified')}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 font-mono mb-4 truncate">
                    Mint: {cred.mintShort}
                  </p>

                  <a
                    href={`https://explorer.solana.com/address/${cred.mintAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 w-full justify-center rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-300 hover:border-purple-700/50 hover:text-purple-300 transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('verify_onchain')}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Conquistas */}
        <section>
          <h2 className="flex items-center gap-2 text-base font-bold text-white mb-5">
            <Trophy className="h-5 w-5 text-yellow-400" />
            {t('achievements')}
            <span className="text-xs font-normal text-gray-500">
              {ACHIEVEMENTS.filter((a) => a.unlocked).length}/{ACHIEVEMENTS.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {ACHIEVEMENTS.map((ach, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-2xl border p-4 text-center transition-all',
                  ach.unlocked
                    ? 'border-yellow-700/50 bg-yellow-900/10 hover:border-yellow-600/50'
                    : 'border-gray-800 bg-gray-900/30 opacity-40'
                )}
              >
                <div className="text-2xl mb-1.5">
                  {ach.unlocked ? (
                    ach.emoji
                  ) : (
                    <Lock className="mx-auto h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div className="text-xs font-semibold text-gray-300 leading-tight">{L(ach.name, locale)}</div>
                <div className="text-xs text-gray-600 mt-0.5 leading-tight">{L(ach.desc, locale)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Cursos Concluídos */}
        <section>
          <h2 className="flex items-center gap-2 text-base font-bold text-white mb-5">
            <BookOpen className="h-5 w-5 text-blue-400" />
            {t('courses_completed')}
          </h2>
          <div className="space-y-3">
            {COURSES_COMPLETED.map((c) => (
              <Link
                key={c.slug}
                href={`/${locale}/cursos/${c.slug}`}
                className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3.5 hover:border-gray-700 transition-all group"
              >
                <div className={cn('h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br flex items-center justify-center', c.color)}>
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                    {L(c.title, locale)}
                  </div>
                  <div className="text-xs text-gray-500">{c.completedDate}</div>
                </div>
                <span className="text-sm font-bold text-yellow-400 shrink-0">
                  +{c.xp.toLocaleString()} XP
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
