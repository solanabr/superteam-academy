'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Zap, Trophy, Flame, Award, BookOpen, TrendingUp,
  Lock, CheckCircle, Clock, BarChart2, Wallet, Star
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { clsx } from 'clsx';

const cn = (...args: Parameters<typeof clsx>) => clsx(args);

const XP_CHART_DATA = [
  { day: '1 Fev', xp: 200 },
  { day: '5 Fev', xp: 450 },
  { day: '8 Fev', xp: 380 },
  { day: '10 Fev', xp: 620 },
  { day: '13 Fev', xp: 800 },
  { day: '15 Fev', xp: 750 },
  { day: '17 Fev', xp: 1100 },
  { day: '19 Fev', xp: 950 },
  { day: '21 Fev', xp: 1350 },
  { day: '23 Fev', xp: 1200 },
  { day: '25 Fev', xp: 1600 },
];

const ENROLLED_COURSES = [
  {
    slug: 'intro-solana',
    title: 'Introdução ao Solana',
    track: 'Solana',
    color: 'from-purple-600 to-indigo-600',
    progress: 75,
    lessonsCompleted: 6,
    totalLessons: 8,
    nextLesson: 'PDAs: Program Derived Addresses',
    nextLessonId: 'intro-6',
  },
  {
    slug: 'anchor-basics',
    title: 'Fundamentos do Anchor',
    track: 'Anchor',
    color: 'from-green-600 to-teal-600',
    progress: 30,
    lessonsCompleted: 3,
    totalLessons: 10,
    nextLesson: 'Constraints e validações de conta',
    nextLessonId: 'anchor-3',
  },
];

const ACHIEVEMENTS = [
  { id: 1, emoji: '🚀', name: 'Primeiro Voo', desc: 'Complete sua primeira aula', unlocked: true },
  { id: 2, emoji: '🔥', name: 'Em Chamas', desc: '7 dias de sequência', unlocked: true },
  { id: 3, emoji: '💻', name: 'Coder', desc: 'Complete seu primeiro desafio', unlocked: true },
  { id: 4, emoji: '🏆', name: 'Top 10', desc: 'Entre no top 10 do ranking', unlocked: false },
  { id: 5, emoji: '🎓', name: 'Diplomado', desc: 'Complete um curso completo', unlocked: false },
  { id: 6, emoji: '⚡', name: 'Velocista', desc: 'Complete 5 aulas em 1 dia', unlocked: false },
];

const RECENT_ACTIVITY = [
  { type: 'lesson', text: 'Completou: Token Program: criar e transferir tokens SPL', xp: 150, time: '2h atrás' },
  { type: 'challenge', text: 'Desafio concluído: Transfer SOL Between Wallets', xp: 200, time: '1 dia atrás' },
  { type: 'lesson', text: 'Completou: Primeira transação com @solana/web3.js', xp: 150, time: '2 dias atrás' },
  { type: 'achievement', text: 'Conquista desbloqueada: Em Chamas 🔥', xp: 100, time: '3 dias atrás' },
];

const TOTAL_XP = 8250;
const LEVEL = 12;
const XP_IN_LEVEL = 750;
const XP_FOR_NEXT = 1000;
const STREAK = 14;

function truncateAddress(addr: string): string {
  return addr.slice(0, 4) + '...' + addr.slice(-4);
}

export default function DashboardPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const { connected, publicKey } = useWallet();

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-700 bg-gray-900">
              <Wallet className="h-10 w-10 text-gray-600" />
            </div>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">Conecte sua carteira</h2>
          <p className="mb-8 text-gray-400 text-sm leading-relaxed">
            Para acessar seu painel pessoal, acompanhar seu progresso e ganhar XP, você precisa conectar uma carteira Solana.
          </p>
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
          <p className="mt-4 text-xs text-gray-600">
            Suportamos Phantom, Backpack, Solflare e mais
          </p>
        </div>
      </div>
    );
  }

  const address = publicKey?.toBase58() ?? '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-12">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-gray-500 text-sm mb-1">Bem-vindo de volta</p>
              <h1 className="text-2xl font-bold text-white font-mono">
                {truncateAddress(address)}
              </h1>
              <p className="text-sm text-purple-400 mt-1">Nível {LEVEL} · Continue de onde parou</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-yellow-700/50 bg-yellow-900/20 px-4 py-2 text-center">
                <div className="flex items-center gap-1.5 text-yellow-300">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="text-xl font-extrabold">{STREAK}</span>
                </div>
                <div className="text-xs text-yellow-600">dias de sequência</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* XP Level bar */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-sm font-extrabold text-white">
                {LEVEL}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Nível {LEVEL}</div>
                <div className="text-xs text-gray-500">Solana Developer</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-white">{XP_IN_LEVEL.toLocaleString()} / {XP_FOR_NEXT.toLocaleString()} XP</div>
              <div className="text-xs text-gray-500">{XP_FOR_NEXT - XP_IN_LEVEL} para nível {LEVEL + 1}</div>
            </div>
          </div>
          <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all"
              style={{ width: `${(XP_IN_LEVEL / XP_FOR_NEXT) * 100}%` }}
            />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'XP Total', value: TOTAL_XP.toLocaleString(), icon: Zap, color: 'text-yellow-400', bg: 'from-yellow-900/30 to-orange-900/20', border: 'border-yellow-800/30' },
            { label: 'Nível Atual', value: String(LEVEL), icon: Star, color: 'text-purple-400', bg: 'from-purple-900/30 to-indigo-900/20', border: 'border-purple-800/30' },
            { label: 'Sequência', value: `${STREAK} dias`, icon: Flame, color: 'text-orange-400', bg: 'from-orange-900/30 to-red-900/20', border: 'border-orange-800/30' },
            { label: 'Credenciais', value: '2', icon: Award, color: 'text-green-400', bg: 'from-green-900/30 to-teal-900/20', border: 'border-green-800/30' },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className={cn('rounded-2xl border bg-gradient-to-br p-5', bg, border)}>
              <Icon className={cn('mb-2 h-5 w-5', color)} />
              <div className="text-2xl font-extrabold text-white">{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* XP Chart + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* XP Chart */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">XP nos Últimos 30 Dias</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={XP_CHART_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '0.75rem', color: '#f3f4f6', fontSize: '12px' }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value) => [`${value} XP`, 'XP Ganhos']}
                />
                <Area type="monotone" dataKey="xp" stroke="#7c3aed" strokeWidth={2} fill="url(#xpGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Atividade Recente</h3>
            </div>
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs',
                    a.type === 'lesson' ? 'bg-blue-900/50 text-blue-300' :
                    a.type === 'challenge' ? 'bg-green-900/50 text-green-300' :
                    'bg-yellow-900/50 text-yellow-300'
                  )}>
                    {a.type === 'lesson' ? <BookOpen className="h-3 w-3" /> :
                     a.type === 'challenge' ? <CheckCircle className="h-3 w-3" /> :
                     <Trophy className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 leading-snug line-clamp-2">{a.text}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-yellow-400/80 font-medium">+{a.xp} XP</span>
                      <span className="text-xs text-gray-600">{a.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enrolled courses */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Cursos em Andamento</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ENROLLED_COURSES.map((c) => (
              <div key={c.slug} className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden">
                <div className={cn('h-2 bg-gradient-to-r', c.color)} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{c.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{c.lessonsCompleted}/{c.totalLessons} aulas</p>
                    </div>
                    <span className="text-xs font-bold text-purple-300">{c.progress}%</span>
                  </div>
                  <div className="mb-3 h-2 rounded-full bg-gray-800">
                    <div
                      className={cn('h-full rounded-full bg-gradient-to-r', c.color)}
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate max-w-[60%]">
                      Próxima: <span className="text-gray-300">{c.nextLesson}</span>
                    </p>
                    <Link
                      href={`/${locale}/aulas/${c.nextLessonId}`}
                      className="flex items-center gap-1 rounded-lg bg-purple-900/50 border border-purple-700/50 px-2.5 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-900/70 transition-all"
                    >
                      Continuar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Conquistas</h2>
            <span className="text-xs text-gray-500">
              {ACHIEVEMENTS.filter((a) => a.unlocked).length}/{ACHIEVEMENTS.length}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {ACHIEVEMENTS.map((ach) => (
              <div
                key={ach.id}
                className={cn(
                  'rounded-2xl border p-4 text-center transition-all',
                  ach.unlocked
                    ? 'border-yellow-700/50 bg-yellow-900/10 hover:border-yellow-600/50'
                    : 'border-gray-800 bg-gray-900/30 opacity-50'
                )}
              >
                <div className="text-3xl mb-2">
                  {ach.unlocked ? ach.emoji : <Lock className="mx-auto h-6 w-6 text-gray-600" />}
                </div>
                <div className="text-xs font-semibold text-gray-300">{ach.name}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-tight">{ach.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard CTA */}
        <div className="rounded-2xl border border-purple-800/40 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart2 className="h-8 w-8 text-purple-400 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-white">Você está no Top 15%</h3>
              <p className="text-xs text-gray-400">Sua posição atual é #42 no ranking geral</p>
            </div>
          </div>
          <Link
            href={`/${locale}/classificacao`}
            className="shrink-0 rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 transition-all"
          >
            Ver Classificação
          </Link>
        </div>
      </div>
    </div>
  );
}
