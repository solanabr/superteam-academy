'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import {
  GraduationCap, Trophy, Code2, Shield, Zap, Users, BookOpen,
  ArrowRight, Star, CheckCircle, Wallet, ChevronRight, Award
} from 'lucide-react';
import { clsx } from 'clsx';

const cn = (...args: Parameters<typeof clsx>) => clsx(args);

const MOCK_COURSES = [
  {
    slug: 'intro-solana',
    title: 'Introdução ao Solana',
    level: 'Iniciante',
    xp: 1000,
    lessons: 8,
    track: 'Solana',
    color: 'from-purple-600 to-indigo-600',
    students: 456,
    rating: 4.9,
  },
  {
    slug: 'anchor-basics',
    title: 'Fundamentos do Anchor',
    level: 'Intermediário',
    xp: 1500,
    lessons: 10,
    track: 'Anchor',
    color: 'from-green-600 to-teal-600',
    students: 312,
    rating: 4.8,
  },
  {
    slug: 'defi-solana',
    title: 'DeFi no Solana',
    level: 'Avançado',
    xp: 2000,
    lessons: 12,
    track: 'DeFi',
    color: 'from-orange-600 to-red-600',
    students: 198,
    rating: 4.7,
  },
];

const FEATURES = [
  {
    icon: Award,
    title: 'Credenciais On-Chain',
    desc: 'Certificados NFT verificáveis na blockchain Solana que provam suas habilidades para qualquer recrutador ou projeto Web3.',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    icon: Zap,
    title: 'Aprendizado Gamificado',
    desc: 'Ganhe XP, suba de nível e desbloqueie conquistas enquanto aprende. Torne o estudo viciante.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Code2,
    title: 'Desafios de Código',
    desc: 'Editor Monaco integrado com desafios práticos. Escreva, teste e envie código Rust/TypeScript direto no browser.',
    color: 'from-green-500 to-teal-500',
  },
  {
    icon: Users,
    title: 'Comunidade Superteam',
    desc: 'Faça parte da maior rede de desenvolvedores Web3 da América Latina. Networking, oportunidades e colaboração.',
    color: 'from-pink-500 to-rose-500',
  },
];

const STEPS = [
  { n: 1, title: 'Conecte sua carteira', desc: 'Use Phantom, Backpack ou qualquer carteira Solana.', icon: Wallet },
  { n: 2, title: 'Escolha um curso', desc: 'Do iniciante ao avançado, em Solana, DeFi, NFTs e Anchor.', icon: BookOpen },
  { n: 3, title: 'Aprenda & complete desafios', desc: 'Assista, leia, programe e passe nos testes.', icon: Code2 },
  { n: 4, title: 'Ganhe sua credencial NFT', desc: 'Receba um certificado on-chain verificável automaticamente.', icon: Trophy },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
} as any;

const LEVEL_COLORS: Record<string, string> = {
  Iniciante: 'bg-green-900/60 text-green-300 border border-green-700',
  Intermediário: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
  Avançado: 'bg-red-900/60 text-red-300 border border-red-700',
};

export default function LandingPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';

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
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-700 bg-purple-900/30 px-4 py-1.5 text-sm font-medium text-purple-300"
          >
            <Star className="h-3.5 w-3.5 fill-current" />
            Superteam Brasil — Plataforma Oficial
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight"
          >
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Aprenda Solana.
            </span>
            <br />
            <span className="text-white">Ganhe Credenciais</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              On-Chain.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 leading-relaxed"
          >
            A plataforma de aprendizado definitiva para desenvolvedores Web3 no Brasil.
            Aprenda, construa desafios de código e ganhe certificados NFT verificáveis na Solana.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href={`/${locale}/cursos`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-purple-900/30 hover:from-purple-500 hover:to-indigo-500 transition-all hover:shadow-purple-800/40 hover:scale-105"
            >
              <BookOpen className="h-5 w-5" />
              Explorar Cursos
            </Link>
            <Link
              href={`/${locale}/painel`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-8 py-3.5 text-base font-semibold text-gray-200 hover:bg-gray-700 hover:border-gray-600 transition-all"
            >
              <Wallet className="h-5 w-5" />
              Conectar Carteira
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats row */}
      <section className="border-y border-gray-800 bg-gray-900/50 py-10 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '1,247', label: 'Aprendizes', icon: Users, color: 'text-purple-400' },
              { value: '24', label: 'Cursos', icon: BookOpen, color: 'text-indigo-400' },
              { value: '2.1M', label: 'XP Distribuído', icon: Zap, color: 'text-yellow-400' },
              { value: '847', label: 'Credenciais NFT', icon: Award, color: 'text-green-400' },
            ].map(({ value, label, icon: Icon, color }, i) => (
              <motion.div
                key={label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center"
              >
                <Icon className={cn('mx-auto mb-2 h-6 w-6', color)} />
                <div className="text-3xl font-extrabold text-white">{value}</div>
                <div className="text-sm text-gray-400">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Por que Superteam Academy?
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Não é só aprender — é construir uma carreira em Web3 com credenciais que o mercado reconhece.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group rounded-2xl border border-gray-800 bg-gray-900/60 p-6 hover:border-gray-700 hover:bg-gray-900 transition-all"
              >
                <div className={cn('mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br', color)}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured courses */}
      <section className="bg-gray-900/40 py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 flex items-end justify-between"
          >
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">Cursos em Destaque</h2>
              <p className="text-gray-400">Os mais populares entre a comunidade</p>
            </div>
            <Link
              href={`/${locale}/cursos`}
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
            >
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_COURSES.map((course, i) => (
              <motion.div
                key={course.slug}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <Link href={`/${locale}/cursos/${course.slug}`}>
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
                          {course.title}
                        </h3>
                        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', LEVEL_COLORS[course.level])}>
                          {course.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className={cn('h-3.5 w-3.5', j < Math.floor(course.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600')} />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">{course.rating} ({course.students})</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{course.lessons} aulas</span>
                        <span className="font-semibold text-yellow-400">+{course.xp.toLocaleString()} XP</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href={`/${locale}/cursos`}
              className="inline-flex items-center gap-1 text-sm font-medium text-purple-400 hover:text-purple-300"
            >
              Ver todos os cursos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Como Funciona</h2>
            <p className="text-gray-400">Em 4 passos simples você começa a construir sua carreira Web3</p>
          </motion.div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute top-8 left-8 right-8 hidden lg:block h-0.5 bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-800" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map(({ n, title, desc, icon: Icon }, i) => (
                <motion.div
                  key={n}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="relative text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-purple-700 bg-gray-900 relative z-10">
                    <Icon className="h-7 w-7 text-purple-400" />
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                      {n}
                    </span>
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-indigo-900/80 to-gray-900" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent" />
            <div className="relative border border-purple-800/50 rounded-3xl p-10 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-700/60 bg-purple-900/30 px-3 py-1 text-xs font-medium text-purple-300">
                <CheckCircle className="h-3 w-3" />
                Gratuito para começar
              </div>
              <h2 className="mb-4 text-3xl sm:text-4xl font-extrabold text-white">
                Pronto para começar sua jornada Web3?
              </h2>
              <p className="mb-8 text-gray-300 max-w-md mx-auto">
                Conecte sua carteira Solana e comece a aprender agora. Seu primeiro certificado on-chain está esperando.
              </p>
              <Link
                href={`/${locale}/cursos`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-gray-900 hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
              >
                Começar Agora
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
