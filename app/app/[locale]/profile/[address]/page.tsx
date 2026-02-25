'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Trophy, Award, BookOpen, Zap, Flame, Star, Share2,
  Calendar, ExternalLink, CheckCircle, Lock
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip
} from 'recharts';
import { clsx } from 'clsx';

const cn = (...args: Parameters<typeof clsx>) => clsx(args);

const SKILLS_DATA = [
  { skill: 'Solana', value: 85 },
  { skill: 'DeFi', value: 60 },
  { skill: 'NFTs', value: 70 },
  { skill: 'Anchor', value: 75 },
  { skill: 'Security', value: 45 },
  { skill: 'Tokens', value: 65 },
];

const CREDENTIALS = [
  {
    id: 'cred-1',
    name: 'Introdução ao Solana',
    track: 'Solana',
    color: 'from-purple-600 to-indigo-600',
    xp: 1000,
    issuedDate: '10 Jan 2025',
    mintAddress: '7xKX...9mNp',
    verified: true,
  },
  {
    id: 'cred-2',
    name: 'NFTs com Metaplex',
    track: 'NFTs',
    color: 'from-pink-600 to-purple-600',
    xp: 1800,
    issuedDate: '05 Fev 2025',
    mintAddress: 'Ap9S...7kLm',
    verified: true,
  },
];

const ACHIEVEMENTS = [
  { emoji: '🚀', name: 'Primeiro Voo', unlocked: true },
  { emoji: '🔥', name: 'Em Chamas', unlocked: true },
  { emoji: '💻', name: 'Coder', unlocked: true },
  { emoji: '🏆', name: 'Top 10', unlocked: false },
  { emoji: '🎓', name: 'Diplomado', unlocked: false },
  { emoji: '⚡', name: 'Velocista', unlocked: false },
];

const COURSES_COMPLETED = [
  { slug: 'intro-solana', title: 'Introdução ao Solana', xp: 1000, completedDate: '10 Jan 2025' },
  { slug: 'nft-metaplex', title: 'NFTs com Metaplex', xp: 1800, completedDate: '05 Fev 2025' },
];

const XP_HISTORY = [
  { date: '10 Jan', event: 'Completou Introdução ao Solana', xp: 1000 },
  { date: '15 Jan', event: 'Desafio: Transfer SOL', xp: 200 },
  { date: '22 Jan', event: 'Conquista: Em Chamas 🔥', xp: 100 },
  { date: '30 Jan', event: 'Completou 5 desafios', xp: 250 },
  { date: '05 Fev', event: 'Completou NFTs com Metaplex', xp: 1800 },
];

const TOTAL_XP = 8250;
const LEVEL = 12;
const STREAK_RECORD = 21;

function truncate(addr: string): string {
  if (addr.length <= 12) return addr;
  return addr.slice(0, 4) + '...' + addr.slice(-4);
}

export default function ProfilePage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const address = (params.address as string) || '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-12">
      {/* Profile header */}
      <div className="relative border-b border-gray-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-indigo-900/10 to-gray-950" />
        <div className="relative mx-auto max-w-5xl px-4 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-2xl font-extrabold text-white">
                {address.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 border-2 border-gray-950 text-xs font-bold text-white">
                {LEVEL}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white font-mono">{truncate(address)}</h1>
                <CheckCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-purple-400" />
                  Nível {LEVEL} Developer
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Membro desde Jan 2025
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-400" />
                  Recorde: {STREAK_RECORD} dias
                </span>
              </div>
            </div>

            <div className="flex gap-2">
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
                Compartilhar
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-6 grid grid-cols-3 sm:grid-cols-5 gap-4">
            {[
              { label: 'XP Total', value: TOTAL_XP.toLocaleString(), icon: Zap, color: 'text-yellow-400' },
              { label: 'Cursos', value: String(COURSES_COMPLETED.length), icon: BookOpen, color: 'text-blue-400' },
              { label: 'Credenciais', value: String(CREDENTIALS.length), icon: Award, color: 'text-green-400' },
              { label: 'Conquistas', value: `${ACHIEVEMENTS.filter((a) => a.unlocked).length}`, icon: Trophy, color: 'text-yellow-400' },
              { label: 'Nível', value: String(LEVEL), icon: Star, color: 'text-purple-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="text-center">
                <Icon className={cn('mx-auto mb-1 h-4 w-4', color)} />
                <div className="text-xl font-extrabold text-white">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Skills radar + Credentials */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar chart */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
            <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
              <BarChart className="h-4 w-4 text-purple-400" />
              Skills
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={SKILLS_DATA}>
                <PolarGrid stroke="#1f2937" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Radar
                  name="Skills"
                  dataKey="value"
                  stroke="#7c3aed"
                  fill="#7c3aed"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', fontSize: '12px' }}
                  formatter={(val) => [`${val}%`, 'Proficiência']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Credentials */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-green-400" />
              Credenciais NFT On-Chain
            </h3>
            <div className="space-y-3">
              {CREDENTIALS.map((cred) => (
                <div key={cred.id} className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden hover:border-gray-700 transition-all">
                  <div className={cn('h-1.5 bg-gradient-to-r', cred.color)} />
                  <div className="flex items-center gap-3 p-4">
                    <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white', cred.color)}>
                      <Award className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-semibold text-white truncate">{cred.name}</h4>
                        {cred.verified && <CheckCircle className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{cred.issuedDate}</span>
                        <span>·</span>
                        <span className="text-yellow-400 font-medium">+{cred.xp.toLocaleString()} XP</span>
                      </div>
                      <div className="text-xs text-gray-600 font-mono mt-0.5">Mint: {cred.mintAddress}</div>
                    </div>
                    <Link
                      href={`/${locale}/certificados/${cred.id}`}
                      className="shrink-0 rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:border-gray-600 transition-all"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              ))}
              {CREDENTIALS.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Nenhuma credencial ainda. Complete cursos para ganhar!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            Conquistas ({ACHIEVEMENTS.filter((a) => a.unlocked).length}/{ACHIEVEMENTS.length})
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {ACHIEVEMENTS.map((ach, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-2xl border p-3 text-center',
                  ach.unlocked ? 'border-yellow-700/50 bg-yellow-900/10' : 'border-gray-800 bg-gray-900/30 opacity-40'
                )}
              >
                <div className="text-2xl mb-1">
                  {ach.unlocked ? ach.emoji : <Lock className="mx-auto h-5 w-5 text-gray-600" />}
                </div>
                <div className="text-xs font-medium text-gray-300">{ach.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed courses */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-400" />
            Cursos Concluídos
          </h3>
          <div className="space-y-2">
            {COURSES_COMPLETED.map((c) => (
              <Link
                key={c.slug}
                href={`/${locale}/cursos/${c.slug}`}
                className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3 hover:border-gray-700 transition-all group"
              >
                <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                <span className="flex-1 text-sm text-gray-300 group-hover:text-white transition-colors">{c.title}</span>
                <span className="text-xs text-gray-500">{c.completedDate}</span>
                <span className="text-xs font-semibold text-yellow-400">+{c.xp.toLocaleString()} XP</span>
              </Link>
            ))}
          </div>
        </div>

        {/* XP History */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            Histórico de XP
          </h3>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 divide-y divide-gray-800">
            {XP_HISTORY.map((h, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs text-gray-500 w-16 shrink-0">{h.date}</span>
                <span className="flex-1 text-sm text-gray-300">{h.event}</span>
                <span className="text-xs font-bold text-yellow-400">+{h.xp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Missing import alias
function BarChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}
