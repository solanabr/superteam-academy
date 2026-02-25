import Link from 'next/link';
import {
  BookOpen, Clock, Users, Zap, Star, CheckCircle, ChevronRight,
  Play, Lock, Award, BarChart2, ArrowLeft, GraduationCap
} from 'lucide-react';
import { clsx } from 'clsx';

const cn = (...args: Parameters<typeof clsx>) => clsx(args);

const MOCK_COURSES: Record<string, {
  slug: string; title: string; desc: string; level: string;
  xp: number; lessons: number; hours: number; track: string;
  color: string; students: number; rating: number;
  objectives: string[]; prerequisites: string[];
  curriculum: { title: string; xp: number; duration: number; free: boolean }[];
}> = {
  'intro-solana': {
    slug: 'intro-solana',
    title: 'Introdução ao Solana',
    desc: 'Aprenda os fundamentos da blockchain Solana de forma prática. Cobrimos arquitetura, contas, transações, programas nativos e como interagir com a rede usando TypeScript e Rust.',
    level: 'Iniciante',
    xp: 1000,
    lessons: 8,
    hours: 4,
    track: 'Solana',
    color: 'from-purple-600 to-indigo-600',
    students: 456,
    rating: 4.9,
    objectives: [
      'Entender a arquitetura da Solana e por que é diferente do Ethereum',
      'Criar e gerenciar contas Solana com @solana/web3.js',
      'Enviar transações e interpretar logs on-chain',
      'Interagir com programas nativos (System, Token)',
      'Configurar ambiente de desenvolvimento local',
    ],
    prerequisites: [
      'Conhecimento básico de JavaScript/TypeScript',
      'Noções de blockchain (o que é uma carteira, transação)',
    ],
    curriculum: [
      { title: 'O que é Solana? Arquitetura e Proof of History', xp: 100, duration: 25, free: true },
      { title: 'Contas, Lamports e o modelo de dados', xp: 100, duration: 30, free: true },
      { title: 'Configurando o ambiente: Solana CLI + Phantom', xp: 100, duration: 20, free: true },
      { title: 'Primeira transação com @solana/web3.js', xp: 150, duration: 35, free: false },
      { title: 'Token Program: criar e transferir tokens SPL', xp: 150, duration: 40, free: false },
      { title: 'PDAs: Program Derived Addresses explicados', xp: 150, duration: 35, free: false },
      { title: 'Desafio: Deploy de Hello World em Rust', xp: 150, duration: 45, free: false },
      { title: 'Projeto final: Mini token faucet', xp: 100, duration: 30, free: false },
    ],
  },
  'anchor-basics': {
    slug: 'anchor-basics',
    title: 'Fundamentos do Anchor',
    desc: 'Domine o framework Anchor para escrever smart contracts Solana em Rust de forma rápida e segura. Do setup ao deploy em devnet.',
    level: 'Intermediário',
    xp: 1500,
    lessons: 10,
    hours: 6,
    track: 'Anchor',
    color: 'from-green-600 to-teal-600',
    students: 312,
    rating: 4.8,
    objectives: [
      'Instalar e configurar o Anchor CLI',
      'Criar programas Anchor com macros #[program] e #[account]',
      'Testar contratos com mocha/chai e anchor test',
      'Fazer deploy em devnet e mainnet-beta',
      'Padrões avançados: CPI, CPIs cruzadas, error handling',
    ],
    prerequisites: [
      'Completou "Introdução ao Solana"',
      'Conhecimento básico de Rust (structs, enums)',
    ],
    curriculum: [
      { title: 'Por que Anchor? Setup e primeiro projeto', xp: 150, duration: 30, free: true },
      { title: 'Macros Anchor: #[program], #[account], #[derive]', xp: 150, duration: 35, free: true },
      { title: 'Constraints e validações de conta', xp: 150, duration: 40, free: false },
      { title: 'Testes com anchor test + TypeScript client', xp: 150, duration: 45, free: false },
      { title: 'PDAs em Anchor: seeds e bumps', xp: 150, duration: 40, free: false },
      { title: 'CPI: chamando outros programas', xp: 200, duration: 50, free: false },
      { title: 'Error handling e custom errors', xp: 150, duration: 35, free: false },
      { title: 'Deploy em devnet com Anchor CLI', xp: 100, duration: 25, free: false },
      { title: 'Upgrade de programa via authority', xp: 150, duration: 40, free: false },
      { title: 'Projeto: CRUD on-chain completo', xp: 150, duration: 60, free: false },
    ],
  },
  'defi-solana': {
    slug: 'defi-solana',
    title: 'DeFi no Solana',
    desc: 'Construa protocolos DeFi do zero: AMMs tipo Uniswap V2, lending protocols, staking pools e yield farming na Solana.',
    level: 'Avançado',
    xp: 2000,
    lessons: 12,
    hours: 8,
    track: 'DeFi',
    color: 'from-orange-600 to-red-600',
    students: 198,
    rating: 4.7,
    objectives: [
      'Implementar um AMM com curva x*y=k na Solana',
      'Construir um protocolo de lending com colateral',
      'Criar staking pools com reward distribution',
      'Integrar oráculos de preço (Pyth, Switchboard)',
      'Auditar segurança de contratos DeFi',
    ],
    prerequisites: [
      'Completou "Fundamentos do Anchor"',
      'Conhecimento de matemática financeira básica',
      'Experiência com Rust intermediária',
    ],
    curriculum: [
      { title: 'DeFi na Solana: panorama e oportunidades', xp: 150, duration: 30, free: true },
      { title: 'Token Swap: implementando um AMM simples', xp: 200, duration: 60, free: false },
      { title: 'Liquidity Pools: LP tokens e fee distribution', xp: 200, duration: 55, free: false },
      { title: 'Lending Protocol: colateral e liquidação', xp: 200, duration: 70, free: false },
      { title: 'Oráculos: integrando Pyth Network', xp: 150, duration: 45, free: false },
      { title: 'Staking: lock, reward e unstake', xp: 200, duration: 55, free: false },
      { title: 'Yield farming e incentivos', xp: 200, duration: 50, free: false },
      { title: 'Flash loans na Solana', xp: 200, duration: 45, free: false },
      { title: 'Segurança DeFi: ataques comuns', xp: 200, duration: 60, free: false },
      { title: 'Frontrunning e MEV na Solana', xp: 150, duration: 40, free: false },
      { title: 'Integração com Jupiter Aggregator', xp: 150, duration: 35, free: false },
      { title: 'Projeto final: mini AMM completo', xp: 200, duration: 90, free: false },
    ],
  },
};

const DEFAULT_COURSE = MOCK_COURSES['intro-solana'];

const LEVEL_COLORS: Record<string, string> = {
  Iniciante: 'bg-green-900/60 text-green-300 border border-green-700/50',
  Intermediário: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50',
  Avançado: 'bg-red-900/60 text-red-300 border border-red-700/50',
};

const REVIEWS = [
  {
    author: '7xKX...9mNp',
    rating: 5,
    date: 'Jan 2025',
    text: 'Curso excelente! Consegui fazer deploy do meu primeiro programa Solana em 2 dias. O conteúdo é muito bem estruturado.',
  },
  {
    author: 'Ap9S...7kLm',
    rating: 5,
    date: 'Fev 2025',
    text: 'Melhor material em português sobre Solana. Os desafios de código são muito bem pensados.',
  },
  {
    author: '3fBZ...2qRt',
    rating: 4,
    date: 'Mar 2025',
    text: 'Ótimo para iniciantes. Poderia ter mais exercícios práticos, mas no geral é muito bom.',
  },
];

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const course = MOCK_COURSES[slug] ?? DEFAULT_COURSE;

  const totalDuration = course.curriculum.reduce((a, l) => a + l.duration, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Back nav */}
      <div className="border-b border-gray-800 bg-gray-900/40 px-4 py-3">
        <div className="mx-auto max-w-6xl">
          <Link
            href={`/${locale}/cursos`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Catálogo
          </Link>
        </div>
      </div>

      {/* Hero header */}
      <div className={cn('relative overflow-hidden bg-gradient-to-br', course.color)}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative mx-auto max-w-6xl px-4 py-14">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm border border-white/10">
              {course.track}
            </span>
            <span className={cn('rounded-full px-3 py-1 text-xs font-medium', LEVEL_COLORS[course.level])}>
              {course.level}
            </span>
          </div>
          <h1 className="mb-3 text-3xl sm:text-5xl font-extrabold text-white max-w-3xl">
            {course.title}
          </h1>
          <p className="mb-6 text-gray-300 max-w-2xl text-base leading-relaxed">
            {course.desc}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {course.lessons} lições
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              ~{Math.round(totalDuration / 60)}h {totalDuration % 60}min
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {course.students.toLocaleString()} alunos
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-300 font-semibold">+{course.xp.toLocaleString()} XP</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className={cn('h-4 w-4', j < Math.floor(course.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600')} />
              ))}
              <span className="ml-1 font-medium">{course.rating}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What you'll learn */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-purple-400" />
                O que você vai aprender
              </h2>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 grid sm:grid-cols-2 gap-3">
                {course.objectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-300">{obj}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Curriculum */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-400" />
                Currículo do Curso
              </h2>
              <div className="rounded-2xl border border-gray-800 overflow-hidden">
                {course.curriculum.map((lesson, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-800 last:border-0',
                      lesson.free ? 'bg-gray-900/40 hover:bg-gray-900/60' : 'bg-gray-900/20',
                      'transition-colors group'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                        lesson.free ? 'bg-purple-900/50 text-purple-300' : 'bg-gray-800 text-gray-500'
                      )}>
                        {lesson.free ? <Play className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className={cn('text-sm font-medium truncate', lesson.free ? 'text-gray-200' : 'text-gray-400')}>
                          {i + 1}. {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {lesson.duration} min
                          {lesson.free && <span className="text-purple-400 font-medium ml-1">• Gratuito</span>}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-yellow-400">
                      <Zap className="h-3 w-3" />
                      +{lesson.xp}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Prerequisites */}
            {course.prerequisites.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-purple-400" />
                  Pré-requisitos
                </h2>
                <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 space-y-2">
                  {course.prerequisites.map((req, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                      <span className="text-sm text-gray-300">{req}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Instructor */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-400" />
                Instrutor
              </h2>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 text-2xl font-bold text-white">
                  ST
                </div>
                <div>
                  <p className="font-semibold text-white">Superteam Brasil Team</p>
                  <p className="text-sm text-purple-400 mb-2">Contribuidores & Core Developers</p>
                  <p className="text-sm text-gray-400">
                    Nossos instrutores são desenvolvedores ativos no ecossistema Solana com experiência em protocolos DeFi, NFT e infraestrutura. Membros do programa Superteam e contribuidores de projetos open-source.
                  </p>
                </div>
              </div>
            </section>

            {/* Reviews */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Avaliações dos Alunos
              </h2>
              <div className="space-y-4">
                {REVIEWS.map((r, i) => (
                  <div key={i} className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-700 to-indigo-700 flex items-center justify-center text-xs font-bold text-white">
                          {r.author[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-300">{r.author}</span>
                      </div>
                      <span className="text-xs text-gray-500">{r.date}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={cn('h-3.5 w-3.5', j < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700')} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-400">{r.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Enroll card */}
              <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6">
                <div className="mb-4 text-center">
                  <div className="text-4xl font-extrabold text-white mb-1">Gratuito</div>
                  <div className="text-sm text-gray-400">Acesso completo após matrícula</div>
                </div>

                <Link
                  href={`/${locale}/aulas/intro-1`}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 text-sm font-bold text-white hover:from-purple-500 hover:to-indigo-500 transition-all hover:scale-[1.02]"
                >
                  <Play className="h-4 w-4" />
                  Começar Curso
                </Link>

                <div className="space-y-2.5 text-sm text-gray-400 mt-4">
                  {[
                    `${course.lessons} lições`,
                    `~${Math.round(totalDuration / 60)}h ${totalDuration % 60}min de conteúdo`,
                    `Acesso vitalício`,
                    `Certificado NFT on-chain`,
                    `+${course.xp.toLocaleString()} XP`,
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* XP reward */}
              <div className="rounded-2xl border border-yellow-800/40 bg-yellow-900/10 p-4 text-center">
                <Award className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
                <div className="text-2xl font-extrabold text-yellow-300">+{course.xp.toLocaleString()} XP</div>
                <div className="text-xs text-yellow-600 mt-1">ao completar o curso</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
