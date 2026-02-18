import { NextRequest, NextResponse } from 'next/server'

// In production, use Prisma + wallet signature verification
const progressStore = new Map<string, { lessonId: string; completed: boolean; completedAt: string }[]>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const wallet = searchParams.get('wallet')
  const courseSlug = searchParams.get('course')

  if (!wallet) {
    return NextResponse.json({ error: 'wallet required' }, { status: 400 })
  }

  const key = `${wallet}:${courseSlug || 'all'}`
  const progress = progressStore.get(key) || []

  return NextResponse.json({ progress })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { wallet, lessonId, courseSlug, quizScore } = body

  if (!wallet || !lessonId) {
    return NextResponse.json({ error: 'wallet and lessonId required' }, { status: 400 })
  }

  // In production: verify wallet signature, update Prisma, optionally create on-chain checkpoint
  const key = `${wallet}:${courseSlug || 'all'}`
  const existing = progressStore.get(key) || []
  
  const entry = {
    lessonId,
    completed: true,
    completedAt: new Date().toISOString(),
    ...(quizScore !== undefined ? { quizScore } : {}),
  }

  const idx = existing.findIndex(p => p.lessonId === lessonId)
  if (idx >= 0) {
    existing[idx] = entry
  } else {
    existing.push(entry)
  }
  progressStore.set(key, existing)

  return NextResponse.json({ success: true, progress: entry })
}
