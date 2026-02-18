import { NextRequest, NextResponse } from 'next/server'

// In production, this would use Prisma
const COURSES = [
  {
    id: '1', slug: 'intro-solana', title: 'Introdução ao Solana', titleEn: 'Introduction to Solana',
    description: 'Aprenda os fundamentos do blockchain Solana.',
    difficulty: 'BEGINNER', category: 'Blockchain', published: true,
    tokenGated: false, modules: 8, lessons: 24,
  },
  {
    id: '2', slug: 'anchor-contracts', title: 'Smart Contracts com Anchor', titleEn: 'Smart Contracts with Anchor',
    description: 'Desenvolva smart contracts usando Anchor.',
    difficulty: 'INTERMEDIATE', category: 'Development', published: true,
    tokenGated: false, modules: 12, lessons: 36,
  },
  {
    id: '3', slug: 'defi-practice', title: 'DeFi na Prática', titleEn: 'DeFi in Practice',
    description: 'Construa protocolos DeFi.',
    difficulty: 'ADVANCED', category: 'DeFi', published: true,
    tokenGated: true, requiredToken: 'STBRz...mint', requiredAmount: 100,
    modules: 10, lessons: 30,
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const difficulty = searchParams.get('difficulty')
  const category = searchParams.get('category')
  const search = searchParams.get('q')

  let filtered = COURSES.filter(c => c.published)

  if (difficulty) filtered = filtered.filter(c => c.difficulty === difficulty)
  if (category) filtered = filtered.filter(c => c.category === category)
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(c =>
      c.title.toLowerCase().includes(q) || c.titleEn.toLowerCase().includes(q)
    )
  }

  return NextResponse.json({ courses: filtered, total: filtered.length })
}
