'use client'

import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { useI18n } from '@/lib/i18n/context'

export default function Home() {
  const { t } = useI18n()

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/30 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <h1 className="text-4xl sm:text-6xl font-bold max-w-3xl leading-tight">
            {t('landing.hero_title').split('.').map((part, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {i === 1 ? <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{part}.</span> : `${part}.`}
              </span>
            ))}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl">
            {t('landing.hero_subtitle')}
          </p>
          <div className="mt-10 flex gap-4">
            <Link href="/courses" className="inline-flex items-center rounded-xl bg-purple-600 hover:bg-purple-500 px-8 py-3.5 font-semibold transition">
              {t('landing.cta_explore')}
            </Link>
            <Link href="/dashboard" className="inline-flex items-center rounded-xl border border-gray-600 hover:border-purple-500 hover:bg-purple-900/20 px-8 py-3.5 font-semibold transition">
              {t('landing.cta_signup')}
            </Link>
          </div>
          
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg">
            {[
              { value: '500+', label: t('landing.stats_students') },
              { value: '12+', label: t('landing.stats_courses') },
              { value: '200+', label: t('landing.stats_certs') },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="text-gray-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '💻', title: t('landing.feature_interactive'), desc: t('landing.feature_interactive_desc') },
            { icon: '🔗', title: t('landing.feature_onchain'), desc: t('landing.feature_onchain_desc') },
            { icon: '🏆', title: t('landing.feature_gamified'), desc: t('landing.feature_gamified_desc') },
            { icon: '🌎', title: t('landing.feature_community'), desc: t('landing.feature_community_desc') },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-purple-500/50 transition">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Courses */}
      <section className="border-t border-gray-800 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Cursos em Destaque</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: 'Introdução ao Solana', level: 'Iniciante', modules: 8, icon: '☀️', xp: 500 },
              { title: 'Smart Contracts com Anchor', level: 'Intermediário', modules: 12, icon: '⚓', xp: 1000 },
              { title: 'DeFi na Prática', level: 'Avançado', modules: 10, icon: '💰', xp: 1500 },
            ].map((c, i) => (
              <Link key={i} href="/courses" className="rounded-2xl bg-gray-900 border border-gray-800 p-6 hover:border-purple-500/50 transition group">
                <div className="text-3xl mb-3">{c.icon}</div>
                <h3 className="font-semibold text-lg group-hover:text-purple-400 transition">{c.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                  <span className="inline-flex items-center rounded-full bg-purple-900/50 text-purple-400 px-2.5 py-0.5 text-xs font-medium">
                    {c.level}
                  </span>
                  <span>{c.modules} {t('courses.modules')}</span>
                  <span className="text-purple-400">+{c.xp} XP</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="border-t border-gray-800 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Trilhas de Aprendizado</h2>
          <p className="text-center text-gray-400 mb-12">Caminhos estruturados do zero ao deploy em produção</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: 'Solana Fundamentals', courses: 3, icon: '🏗️', desc: 'PoH, wallets, tokens, transações' },
              { title: 'DeFi Developer', courses: 3, icon: '📊', desc: 'AMMs, lending, yield farming' },
              { title: 'NFT Builder', courses: 2, icon: '🎨', desc: 'Metaplex, marketplaces, collections' },
            ].map((path, i) => (
              <div key={i} className="rounded-2xl bg-gradient-to-br from-purple-900/30 to-blue-900/20 border border-purple-500/20 p-6">
                <div className="text-3xl mb-3">{path.icon}</div>
                <h3 className="font-bold text-lg">{path.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{path.desc}</p>
                <div className="mt-3 text-xs text-purple-400">{path.courses} cursos</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-t border-gray-800 py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-bold mb-8">Parceiros</h2>
          <div className="flex items-center justify-center gap-12 opacity-50">
            <span className="text-2xl font-bold">◎ Solana</span>
            <span className="text-2xl font-bold">⬡ Metaplex</span>
            <span className="text-2xl font-bold">⚓ Anchor</span>
            <span className="text-2xl font-bold">🌐 Superteam</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-gray-400 mb-8">Conecte sua wallet e comece a aprender Web3 hoje. Grátis.</p>
          <Link href="/courses" className="inline-flex items-center rounded-xl bg-purple-600 hover:bg-purple-500 px-10 py-4 text-lg font-semibold transition">
            {t('landing.cta_explore')} →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎓</span>
            <span>Superteam Academy © 2026</span>
          </div>
          <div className="flex gap-6">
            <a href="https://superteam.fun" target="_blank" rel="noopener" className="hover:text-white transition">Superteam</a>
            <a href="https://solana.com" target="_blank" rel="noopener" className="hover:text-white transition">Solana</a>
            <a href="https://github.com/Mint-Claw/superteam-academy" target="_blank" rel="noopener" className="hover:text-white transition">GitHub</a>
            <a href="https://discord.gg/superteambrasil" target="_blank" rel="noopener" className="hover:text-white transition">Discord</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
