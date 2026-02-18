'use client'

import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { useI18n } from '@/lib/i18n/context'

const LEARNING_PATHS = [
  {
    id: 'solana-fundamentals',
    title: 'Solana Fundamentals',
    titlePt: 'Fundamentos Solana',
    description: 'Do zero ao desenvolvimento: entenda a blockchain Solana, wallets, tokens e transações.',
    icon: '🏗️',
    color: 'from-blue-600 to-cyan-500',
    courses: ['intro-solana', 'web3-frontend'],
    totalXP: 1100,
    estimatedHours: 12,
    prerequisites: [],
  },
  {
    id: 'smart-contract-dev',
    title: 'Smart Contract Developer',
    titlePt: 'Desenvolvedor de Smart Contracts',
    description: 'Domine Rust e Anchor para construir programas Solana seguros e eficientes.',
    icon: '⚓',
    color: 'from-purple-600 to-pink-500',
    courses: ['intro-solana', 'anchor-contracts'],
    totalXP: 1500,
    estimatedHours: 20,
    prerequisites: ['Rust básico'],
  },
  {
    id: 'defi-builder',
    title: 'DeFi Builder',
    titlePt: 'Construtor DeFi',
    description: 'Construa protocolos DeFi completos: AMMs, lending, yield farming e staking.',
    icon: '📊',
    color: 'from-green-600 to-emerald-500',
    courses: ['intro-solana', 'anchor-contracts', 'defi-practice', 'tokenomics'],
    totalXP: 3500,
    estimatedHours: 40,
    prerequisites: ['Anchor basics', 'TypeScript'],
  },
  {
    id: 'nft-creator',
    title: 'NFT Creator',
    titlePt: 'Criador de NFTs',
    description: 'Crie coleções NFT, marketplaces e experiências com Metaplex e Bubblegum.',
    icon: '🎨',
    color: 'from-orange-600 to-yellow-500',
    courses: ['intro-solana', 'nft-marketplace', 'web3-frontend'],
    totalXP: 2300,
    estimatedHours: 25,
    prerequisites: ['React/Next.js'],
  },
  {
    id: 'fullstack-web3',
    title: 'Full-Stack Web3',
    titlePt: 'Full-Stack Web3',
    description: 'A trilha completa: do frontend ao smart contract, deployment e integração.',
    icon: '🚀',
    color: 'from-red-600 to-orange-500',
    courses: ['intro-solana', 'web3-frontend', 'anchor-contracts', 'nft-marketplace', 'defi-practice', 'tokenomics'],
    totalXP: 5000,
    estimatedHours: 60,
    prerequisites: [],
  },
]

export default function LearningPathsPage() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Trilhas de Aprendizado</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Caminhos estruturados do iniciante ao expert. Cada trilha combina cursos em uma sequência otimizada para seu objetivo.
          </p>
        </div>

        <div className="space-y-6">
          {LEARNING_PATHS.map((path, idx) => (
            <div
              key={path.id}
              className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-purple-500/30 transition-all group"
            >
              <div className={`h-2 bg-gradient-to-r ${path.color}`} />
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="text-5xl">{path.icon}</div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold group-hover:text-purple-400 transition-colors">
                      {path.titlePt}
                    </h2>
                    <p className="text-gray-400 mt-2">{path.description}</p>

                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      <span className="text-purple-400">+{path.totalXP.toLocaleString()} XP</span>
                      <span className="text-gray-500">~{path.estimatedHours}h</span>
                      <span className="text-gray-500">{path.courses.length} cursos</span>
                    </div>

                    {path.prerequisites.length > 0 && (
                      <div className="mt-3 text-xs text-gray-500">
                        Pré-requisitos: {path.prerequisites.join(', ')}
                      </div>
                    )}

                    {/* Course progression */}
                    <div className="mt-5 flex items-center gap-2 flex-wrap">
                      {path.courses.map((slug, ci) => (
                        <div key={slug} className="flex items-center">
                          <Link
                            href={`/courses/${slug}`}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-purple-900/50 rounded-lg text-xs font-medium transition-colors border border-gray-700 hover:border-purple-500/50"
                          >
                            {ci + 1}. {slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Link>
                          {ci < path.courses.length - 1 && (
                            <span className="text-gray-600 mx-1">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${path.color} text-white`}>
                      {path.courses.length === 6 ? 'Completa' : path.courses.length >= 4 ? 'Avançada' : 'Essencial'}
                    </div>
                    <Link
                      href={`/courses/${path.courses[0]}`}
                      className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
                    >
                      Começar Trilha →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison */}
        <div className="mt-16 bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Compare as Trilhas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400">Trilha</th>
                  <th className="text-center py-3 px-4 text-gray-400">Cursos</th>
                  <th className="text-center py-3 px-4 text-gray-400">Duração</th>
                  <th className="text-center py-3 px-4 text-gray-400">XP</th>
                  <th className="text-center py-3 px-4 text-gray-400">Nível</th>
                </tr>
              </thead>
              <tbody>
                {LEARNING_PATHS.map((path) => (
                  <tr key={path.id} className="border-b border-gray-800 last:border-0">
                    <td className="py-3 px-4 font-medium">
                      {path.icon} {path.titlePt}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-400">{path.courses.length}</td>
                    <td className="py-3 px-4 text-center text-gray-400">~{path.estimatedHours}h</td>
                    <td className="py-3 px-4 text-center text-purple-400">{path.totalXP.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        path.estimatedHours <= 15 ? 'bg-green-900/50 text-green-400' :
                        path.estimatedHours <= 30 ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                        {path.estimatedHours <= 15 ? 'Iniciante' : path.estimatedHours <= 30 ? 'Intermediário' : 'Avançado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
