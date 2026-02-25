import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  BookOpen, Clock, Users, Zap, Star, CheckCircle, ChevronRight,
  Play, Lock, Award, BarChart2, ArrowLeft, GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { localePath } from '@/lib/paths';
import EnrollButton from '@/components/EnrollButton';

const L = (obj: Record<string, string>, locale: string) => obj[locale] ?? obj['pt-BR'];

const MOCK_COURSES: Record<string, {
  slug: string;
  title: Record<string, string>;
  desc: Record<string, string>;
  level: string;
  xp: number; lessons: number; hours: number; track: string;
  color: string; students: number; rating: number;
  objectives: Record<string, string[]>;
  prerequisites: Record<string, string[]>;
  curriculum: { title: Record<string, string>; xp: number; duration: number; free: boolean }[];
}> = {
  'intro-solana': {
    slug: 'intro-solana',
    title: {
      'pt-BR': 'Introdução ao Solana',
      'en': 'Introduction to Solana',
      'es': 'Introducción a Solana',
    },
    desc: {
      'pt-BR': 'Aprenda os fundamentos da blockchain Solana de forma prática. Cobrimos arquitetura, contas, transações, programas nativos e como interagir com a rede usando TypeScript e Rust.',
      'en': 'Learn the fundamentals of the Solana blockchain hands-on. We cover architecture, accounts, transactions, native programs, and how to interact with the network using TypeScript and Rust.',
      'es': 'Aprende los fundamentos de la blockchain Solana de forma práctica. Cubrimos arquitectura, cuentas, transacciones, programas nativos y cómo interactuar con la red usando TypeScript y Rust.',
    },
    level: 'Beginner',
    xp: 1000,
    lessons: 8,
    hours: 4,
    track: 'Solana',
    color: 'from-purple-600 to-indigo-600',
    students: 456,
    rating: 4.9,
    objectives: {
      'pt-BR': [
        'Entender a arquitetura da Solana e por que é diferente do Ethereum',
        'Criar e gerenciar contas Solana com @solana/web3.js',
        'Enviar transações e interpretar logs on-chain',
        'Interagir com programas nativos (System, Token)',
        'Configurar ambiente de desenvolvimento local',
      ],
      'en': [
        'Understand Solana\'s architecture and why it differs from Ethereum',
        'Create and manage Solana accounts with @solana/web3.js',
        'Send transactions and interpret on-chain logs',
        'Interact with native programs (System, Token)',
        'Set up a local development environment',
      ],
      'es': [
        'Entender la arquitectura de Solana y por qué es diferente a Ethereum',
        'Crear y gestionar cuentas Solana con @solana/web3.js',
        'Enviar transacciones e interpretar logs on-chain',
        'Interactuar con programas nativos (System, Token)',
        'Configurar el entorno de desarrollo local',
      ],
    },
    prerequisites: {
      'pt-BR': [
        'Conhecimento básico de JavaScript/TypeScript',
        'Noções de blockchain (o que é uma carteira, transação)',
      ],
      'en': [
        'Basic knowledge of JavaScript/TypeScript',
        'Basic blockchain concepts (what is a wallet, transaction)',
      ],
      'es': [
        'Conocimiento básico de JavaScript/TypeScript',
        'Nociones de blockchain (qué es una billetera, transacción)',
      ],
    },
    curriculum: [
      { title: { 'pt-BR': 'O que é Solana? Arquitetura e Proof of History', 'en': 'What is Solana? Architecture and Proof of History', 'es': '¿Qué es Solana? Arquitectura y Proof of History' }, xp: 100, duration: 25, free: true },
      { title: { 'pt-BR': 'Contas, Lamports e o modelo de dados', 'en': 'Accounts, Lamports, and the data model', 'es': 'Cuentas, Lamports y el modelo de datos' }, xp: 100, duration: 30, free: true },
      { title: { 'pt-BR': 'Configurando o ambiente: Solana CLI + Phantom', 'en': 'Setting up the environment: Solana CLI + Phantom', 'es': 'Configurando el entorno: Solana CLI + Phantom' }, xp: 100, duration: 20, free: true },
      { title: { 'pt-BR': 'Primeira transação com @solana/web3.js', 'en': 'First transaction with @solana/web3.js', 'es': 'Primera transacción con @solana/web3.js' }, xp: 150, duration: 35, free: false },
      { title: { 'pt-BR': 'Token Program: criar e transferir tokens SPL', 'en': 'Token Program: create and transfer SPL tokens', 'es': 'Token Program: crear y transferir tokens SPL' }, xp: 150, duration: 40, free: false },
      { title: { 'pt-BR': 'PDAs: Program Derived Addresses explicados', 'en': 'PDAs: Program Derived Addresses explained', 'es': 'PDAs: Program Derived Addresses explicados' }, xp: 150, duration: 35, free: false },
      { title: { 'pt-BR': 'Desafio: Deploy de Hello World em Rust', 'en': 'Challenge: Deploy Hello World in Rust', 'es': 'Desafío: Deploy de Hello World en Rust' }, xp: 150, duration: 45, free: false },
      { title: { 'pt-BR': 'Projeto final: Mini token faucet', 'en': 'Final project: Mini token faucet', 'es': 'Proyecto final: Mini token faucet' }, xp: 100, duration: 30, free: false },
    ],
  },
  'anchor-basics': {
    slug: 'anchor-basics',
    title: {
      'pt-BR': 'Fundamentos do Anchor',
      'en': 'Anchor Fundamentals',
      'es': 'Fundamentos de Anchor',
    },
    desc: {
      'pt-BR': 'Domine o framework Anchor para escrever smart contracts Solana em Rust de forma rápida e segura. Do setup ao deploy em devnet.',
      'en': 'Master the Anchor framework for writing Solana smart contracts in Rust quickly and safely. From setup to devnet deploy.',
      'es': 'Domina el framework Anchor para escribir smart contracts de Solana en Rust de forma rápida y segura. Desde el setup hasta el deploy en devnet.',
    },
    level: 'Intermediate',
    xp: 1500,
    lessons: 10,
    hours: 6,
    track: 'Anchor',
    color: 'from-green-600 to-teal-600',
    students: 312,
    rating: 4.8,
    objectives: {
      'pt-BR': [
        'Instalar e configurar o Anchor CLI',
        'Criar programas Anchor com macros #[program] e #[account]',
        'Testar contratos com mocha/chai e anchor test',
        'Fazer deploy em devnet e mainnet-beta',
        'Padrões avançados: CPI, CPIs cruzadas, error handling',
      ],
      'en': [
        'Install and configure the Anchor CLI',
        'Create Anchor programs with #[program] and #[account] macros',
        'Test contracts with mocha/chai and anchor test',
        'Deploy to devnet and mainnet-beta',
        'Advanced patterns: CPI, cross-CPIs, error handling',
      ],
      'es': [
        'Instalar y configurar el Anchor CLI',
        'Crear programas Anchor con macros #[program] y #[account]',
        'Testear contratos con mocha/chai y anchor test',
        'Hacer deploy en devnet y mainnet-beta',
        'Patrones avanzados: CPI, CPIs cruzadas, manejo de errores',
      ],
    },
    prerequisites: {
      'pt-BR': [
        'Completou "Introdução ao Solana"',
        'Conhecimento básico de Rust (structs, enums)',
      ],
      'en': [
        'Completed "Introduction to Solana"',
        'Basic knowledge of Rust (structs, enums)',
      ],
      'es': [
        'Completó "Introducción a Solana"',
        'Conocimiento básico de Rust (structs, enums)',
      ],
    },
    curriculum: [
      { title: { 'pt-BR': 'Por que Anchor? Setup e primeiro projeto', 'en': 'Why Anchor? Setup and first project', 'es': '¿Por qué Anchor? Setup y primer proyecto' }, xp: 150, duration: 30, free: true },
      { title: { 'pt-BR': 'Macros Anchor: #[program], #[account], #[derive]', 'en': 'Anchor Macros: #[program], #[account], #[derive]', 'es': 'Macros de Anchor: #[program], #[account], #[derive]' }, xp: 150, duration: 35, free: true },
      { title: { 'pt-BR': 'Constraints e validações de conta', 'en': 'Constraints and account validations', 'es': 'Constraints y validaciones de cuenta' }, xp: 150, duration: 40, free: false },
      { title: { 'pt-BR': 'Testes com anchor test + TypeScript client', 'en': 'Tests with anchor test + TypeScript client', 'es': 'Tests con anchor test + TypeScript client' }, xp: 150, duration: 45, free: false },
      { title: { 'pt-BR': 'PDAs em Anchor: seeds e bumps', 'en': 'PDAs in Anchor: seeds and bumps', 'es': 'PDAs en Anchor: seeds y bumps' }, xp: 150, duration: 40, free: false },
      { title: { 'pt-BR': 'CPI: chamando outros programas', 'en': 'CPI: calling other programs', 'es': 'CPI: llamando a otros programas' }, xp: 200, duration: 50, free: false },
      { title: { 'pt-BR': 'Error handling e custom errors', 'en': 'Error handling and custom errors', 'es': 'Manejo de errores y errores personalizados' }, xp: 150, duration: 35, free: false },
      { title: { 'pt-BR': 'Deploy em devnet com Anchor CLI', 'en': 'Deploy to devnet with Anchor CLI', 'es': 'Deploy en devnet con Anchor CLI' }, xp: 100, duration: 25, free: false },
      { title: { 'pt-BR': 'Upgrade de programa via authority', 'en': 'Program upgrade via authority', 'es': 'Upgrade de programa via authority' }, xp: 150, duration: 40, free: false },
      { title: { 'pt-BR': 'Projeto: CRUD on-chain completo', 'en': 'Project: Complete on-chain CRUD', 'es': 'Proyecto: CRUD on-chain completo' }, xp: 150, duration: 60, free: false },
    ],
  },
  'defi-solana': {
    slug: 'defi-solana',
    title: {
      'pt-BR': 'DeFi no Solana',
      'en': 'DeFi on Solana',
      'es': 'DeFi en Solana',
    },
    desc: {
      'pt-BR': 'Construa protocolos DeFi do zero: AMMs tipo Uniswap V2, lending protocols, staking pools e yield farming na Solana.',
      'en': 'Build DeFi protocols from scratch: Uniswap V2-style AMMs, lending protocols, staking pools, and yield farming on Solana.',
      'es': 'Construye protocolos DeFi desde cero: AMMs tipo Uniswap V2, lending protocols, staking pools y yield farming en Solana.',
    },
    level: 'Advanced',
    xp: 2000,
    lessons: 12,
    hours: 8,
    track: 'DeFi',
    color: 'from-orange-600 to-red-600',
    students: 198,
    rating: 4.7,
    objectives: {
      'pt-BR': [
        'Implementar um AMM com curva x*y=k na Solana',
        'Construir um protocolo de lending com colateral',
        'Criar staking pools com reward distribution',
        'Integrar oráculos de preço (Pyth, Switchboard)',
        'Auditar segurança de contratos DeFi',
      ],
      'en': [
        'Implement an AMM with x*y=k curve on Solana',
        'Build a lending protocol with collateral',
        'Create staking pools with reward distribution',
        'Integrate price oracles (Pyth, Switchboard)',
        'Audit DeFi contract security',
      ],
      'es': [
        'Implementar un AMM con curva x*y=k en Solana',
        'Construir un protocolo de lending con colateral',
        'Crear staking pools con reward distribution',
        'Integrar oráculos de precio (Pyth, Switchboard)',
        'Auditar seguridad de contratos DeFi',
      ],
    },
    prerequisites: {
      'pt-BR': [
        'Completou "Fundamentos do Anchor"',
        'Conhecimento de matemática financeira básica',
        'Experiência com Rust intermediária',
      ],
      'en': [
        'Completed "Anchor Fundamentals"',
        'Basic financial math knowledge',
        'Intermediate Rust experience',
      ],
      'es': [
        'Completó "Fundamentos de Anchor"',
        'Conocimiento de matemáticas financieras básicas',
        'Experiencia intermedia con Rust',
      ],
    },
    curriculum: [
      { title: { 'pt-BR': 'DeFi na Solana: panorama e oportunidades', 'en': 'DeFi on Solana: landscape and opportunities', 'es': 'DeFi en Solana: panorama y oportunidades' }, xp: 150, duration: 30, free: true },
      { title: { 'pt-BR': 'Token Swap: implementando um AMM simples', 'en': 'Token Swap: implementing a simple AMM', 'es': 'Token Swap: implementando un AMM simple' }, xp: 200, duration: 60, free: false },
      { title: { 'pt-BR': 'Liquidity Pools: LP tokens e fee distribution', 'en': 'Liquidity Pools: LP tokens and fee distribution', 'es': 'Liquidity Pools: LP tokens y fee distribution' }, xp: 200, duration: 55, free: false },
      { title: { 'pt-BR': 'Lending Protocol: colateral e liquidação', 'en': 'Lending Protocol: collateral and liquidation', 'es': 'Lending Protocol: colateral y liquidación' }, xp: 200, duration: 70, free: false },
      { title: { 'pt-BR': 'Oráculos: integrando Pyth Network', 'en': 'Oracles: integrating Pyth Network', 'es': 'Oráculos: integrando Pyth Network' }, xp: 150, duration: 45, free: false },
      { title: { 'pt-BR': 'Staking: lock, reward e unstake', 'en': 'Staking: lock, reward, and unstake', 'es': 'Staking: lock, reward y unstake' }, xp: 200, duration: 55, free: false },
      { title: { 'pt-BR': 'Yield farming e incentivos', 'en': 'Yield farming and incentives', 'es': 'Yield farming e incentivos' }, xp: 200, duration: 50, free: false },
      { title: { 'pt-BR': 'Flash loans na Solana', 'en': 'Flash loans on Solana', 'es': 'Flash loans en Solana' }, xp: 200, duration: 45, free: false },
      { title: { 'pt-BR': 'Segurança DeFi: ataques comuns', 'en': 'DeFi Security: common attacks', 'es': 'Seguridad DeFi: ataques comunes' }, xp: 200, duration: 60, free: false },
      { title: { 'pt-BR': 'Frontrunning e MEV na Solana', 'en': 'Frontrunning and MEV on Solana', 'es': 'Frontrunning y MEV en Solana' }, xp: 150, duration: 40, free: false },
      { title: { 'pt-BR': 'Integração com Jupiter Aggregator', 'en': 'Integration with Jupiter Aggregator', 'es': 'Integración con Jupiter Aggregator' }, xp: 150, duration: 35, free: false },
      { title: { 'pt-BR': 'Projeto final: mini AMM completo', 'en': 'Final project: complete mini AMM', 'es': 'Proyecto final: mini AMM completo' }, xp: 200, duration: 90, free: false },
    ],
  },
};

const LEVEL_COLORS: Record<string, string> = {
  Beginner:     'bg-green-900/60 text-green-300 border border-green-700/50',
  Intermediate: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50',
  Advanced:     'bg-red-900/60 text-red-300 border border-red-700/50',
};

const REVIEWS = [
  {
    author: '7xKX...9mNp',
    rating: 5,
    date: 'Jan 2026',
    text: {
      'pt-BR': 'Curso excelente! Consegui fazer deploy do meu primeiro programa Solana em 2 dias. O conteúdo é muito bem estruturado.',
      'en': 'Excellent course! I managed to deploy my first Solana program in 2 days. The content is very well structured.',
      'es': '¡Curso excelente! Logré hacer deploy de mi primer programa Solana en 2 días. El contenido está muy bien estructurado.',
    },
  },
  {
    author: 'Ap9S...7kLm',
    rating: 5,
    date: 'Fev 2026',
    text: {
      'pt-BR': 'Melhor material em português sobre Solana. Os desafios de código são muito bem pensados.',
      'en': 'Best material in Portuguese about Solana. The code challenges are very well thought out.',
      'es': 'Mejor material en portugués sobre Solana. Los desafíos de código están muy bien pensados.',
    },
  },
  {
    author: '3fBZ...2qRt',
    rating: 4,
    date: 'Mar 2026',
    text: {
      'pt-BR': 'Ótimo para iniciantes. Poderia ter mais exercícios práticos, mas no geral é muito bom.',
      'en': 'Great for beginners. Could have more practical exercises, but overall it\'s very good.',
      'es': 'Muy bueno para principiantes. Podría tener más ejercicios prácticos, pero en general es muy bueno.',
    },
  },
];

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('courses');

  const course = MOCK_COURSES[slug];
  if (!course) notFound();

  const totalDuration = course.curriculum.reduce((a, l) => a + l.duration, 0);

  const levelLabel = (level: string) => {
    if (level === 'Beginner')     return t('level_badge_beginner');
    if (level === 'Intermediate') return t('level_badge_intermediate');
    return t('level_badge_advanced');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Back nav */}
      <div className="border-b border-gray-800 bg-gray-900/40 px-4 py-3">
        <div className="mx-auto max-w-6xl">
          <Link
            href={localePath(locale, '/courses')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('back_to_catalog')}
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
              {levelLabel(course.level)}
            </span>
          </div>
          <h1 className="mb-3 text-3xl sm:text-5xl font-extrabold text-white max-w-3xl">
            {L(course.title, locale)}
          </h1>
          <p className="mb-6 text-gray-300 max-w-2xl text-base leading-relaxed">
            {L(course.desc, locale)}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {course.lessons} {t('lessons')}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              ~{Math.round(totalDuration / 60)}h {totalDuration % 60}min
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {course.students.toLocaleString()} {t('students')}
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
                {t('what_youll_learn')}
              </h2>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 grid sm:grid-cols-2 gap-3">
                {(course.objectives[locale] ?? course.objectives['pt-BR']).map((obj, i) => (
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
                {t('curriculum')}
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
                          {i + 1}. {L(lesson.title, locale)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {lesson.duration} min
                          {lesson.free && <span className="text-purple-400 font-medium ml-1">• {t('free')}</span>}
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
            {(course.prerequisites[locale] ?? course.prerequisites['pt-BR']).length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-purple-400" />
                  {t('prerequisites')}
                </h2>
                <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 space-y-2">
                  {(course.prerequisites[locale] ?? course.prerequisites['pt-BR']).map((req, i) => (
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
                {t('instructor')}
              </h2>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 text-2xl font-bold text-white">
                  ST
                </div>
                <div>
                  <p className="font-semibold text-white">Superteam Brasil Team</p>
                  <p className="text-sm text-purple-400 mb-2">{t('contributors')}</p>
                  <p className="text-sm text-gray-400">
                    {locale === 'en'
                      ? 'Our instructors are active developers in the Solana ecosystem with experience in DeFi, NFT, and infrastructure protocols. Members of the Superteam program and contributors to open-source projects.'
                      : locale === 'es'
                      ? 'Nuestros instructores son desarrolladores activos en el ecosistema Solana con experiencia en protocolos DeFi, NFT e infraestructura. Miembros del programa Superteam y contribuidores de proyectos open-source.'
                      : 'Nossos instrutores são desenvolvedores ativos no ecossistema Solana com experiência em protocolos DeFi, NFT e infraestrutura. Membros do programa Superteam e contribuidores de projetos open-source.'}
                  </p>
                </div>
              </div>
            </section>

            {/* Reviews */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                {t('student_reviews')}
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
                    <p className="text-sm text-gray-400">{L(r.text, locale)}</p>
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
                  <div className="text-4xl font-extrabold text-white mb-1">{t('free')}</div>
                  <div className="text-sm text-gray-400">{t('full_access')}</div>
                </div>

                <EnrollButton
                  courseId={slug}
                  lessonPath={localePath(locale, '/lessons/intro-1')}
                  startText={t('start_course')}
                  enrollingText={t('enrolling')}
                  enrolledText={t('enrolled_success')}
                  connectText={t('connect_to_enroll')}
                  viewTxText={t('view_transaction')}
                />

                <div className="space-y-2.5 text-sm text-gray-400 mt-4">
                  {[
                    `${course.lessons} ${t('lessons')}`,
                    `~${Math.round(totalDuration / 60)}h ${totalDuration % 60}min ${t('of_content')}`,
                    t('lifetime_access'),
                    t('nft_certificate'),
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
                <div className="text-xs text-yellow-600 mt-1">{t('upon_completion')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
