import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient, HeliusTokenBalance } from '@/lib/types/db'

interface CanonicalUser {
  id: string
  total_xp: number | null
  level: number | null
  current_streak: number | null
  longest_streak: number | null
  wallet_address: string | null
}

function emptyStats() {
  return {
    totalXP: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    achievementsUnlocked: 0,
    lessonsCompleted: 0,
    lessonsCompletedToday: 0,
    xpProgress: {
      current: 0,
      needed: 100,
      percentage: 0,
    },
  }
}

function userIdCandidates(rawUserId: string): string[] {
  return Array.from(new Set([rawUserId, rawUserId.toLowerCase()]))
}

function parseOnchainAmount(data: HeliusTokenBalance | null | undefined): number | null {
  if (typeof data?.uiAmount === 'number' && Number.isFinite(data.uiAmount)) {
    return data.uiAmount
  }

  if (typeof data?.uiAmountString === 'string') {
    const parsed = Number(data.uiAmountString)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  const amount = Number(data?.amount)
  if (!Number.isFinite(amount)) {
    return null
  }

  const decimals = Number(data?.decimals || 0)
  return decimals > 0 ? amount / 10 ** decimals : amount
}

async function fetchOnchainXp(walletAddress: string | null | undefined): Promise<number | null> {
  if (!walletAddress) return null

  const mint = process.env.NEXT_PUBLIC_XP_TOKEN_MINT || process.env.XP_TOKEN_MINT
  const heliusApiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY || process.env.HELIUS_API_KEY

  if (!mint || !heliusApiKey) return null

  try {
    const response = await fetch(`https://api.helius.xyz/v0/token/balance?api_key=${heliusApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mint,
        owner: walletAddress,
      }),
      cache: 'no-store',
    })

    if (!response.ok) return null
    const data = await response.json()
    return parseOnchainAmount(data)
  } catch {
    return null
  }
}

async function resolveCanonicalUser(supabase: SupabaseClient, rawUserId: string): Promise<CanonicalUser | null> {
  const candidates = Array.from(new Set([rawUserId, rawUserId.toLowerCase()]))

  for (const candidate of candidates) {
    let { data: user } = await supabase
      .from('users')
      .select('id, total_xp, level, current_streak, longest_streak, wallet_address')
      .eq('id', candidate)
      .maybeSingle()

    if (!user) {
      const { data: byEmail } = await supabase
        .from('users')
        .select('id, total_xp, level, current_streak, longest_streak, wallet_address')
        .eq('email', candidate)
        .maybeSingle()
      user = byEmail
    }

    if (!user) {
      const { data: byWallet } = await supabase
        .from('users')
        .select('id, total_xp, level, current_streak, longest_streak, wallet_address')
        .eq('wallet_address', candidate)
        .maybeSingle()
      user = byWallet
    }

    if (user) {
      return user as CanonicalUser
    }
  }

  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = decodeURIComponent(params.userId || '')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const user = await resolveCanonicalUser(supabase, userId)

    if (!user) {
      return NextResponse.json(emptyStats(), { status: 200 })
    }
    const candidateUserIds = Array.from(new Set([user.id, ...userIdCandidates(userId)]))
    const today = new Date().toISOString().split('T')[0]
    const [
      { data: lessons, error: lessonsError },
      { data: todayLessons, error: todayError },
      { data: achievements, error: achievementsError },
      { data: xpTransactions, error: xpTxError },
      onchainXp,
    ] = await Promise.all([
      supabase.from('lesson_progress').select('id').in('user_id', candidateUserIds),
      supabase
        .from('lesson_progress')
        .select('id')
        .in('user_id', candidateUserIds)
        .gte('completed_at', `${today}T00:00:00`),
      supabase.from('user_achievements').select('id').in('user_id', candidateUserIds),
      supabase.from('xp_transactions').select('amount').in('user_id', candidateUserIds),
      fetchOnchainXp(user.wallet_address),
    ])

    if (lessonsError) throw lessonsError
    if (todayError) throw todayError
    if (achievementsError) throw achievementsError
    if (xpTxError) throw xpTxError

    const dbXp = Number(user.total_xp || 0)
    const txXp = (xpTransactions || []).reduce(
      (sum: number, entry: { amount?: number | null }) => sum + Number(entry?.amount || 0),
      0
    )
    const totalXP = Math.max(dbXp, txXp, Number(onchainXp || 0))

    // Calculate XP progress for next level
    // Formula: Level = floor(sqrt(totalXP / 100))
    const level = Math.floor(Math.sqrt(totalXP / 100))
    const currentLevelXp = level * level * 100
    const nextLevelXp = (level + 1) * (level + 1) * 100
    const xpInCurrentLevel = totalXP - currentLevelXp
    const xpNeededForNextLevel = nextLevelXp - currentLevelXp

    return NextResponse.json(
      {
        totalXP,
        level,
        currentStreak: user.current_streak || 0,
        longestStreak: user.longest_streak || 0,
        achievementsUnlocked: achievements?.length || 0,
        lessonsCompleted: lessons?.length || 0,
        lessonsCompletedToday: todayLessons?.length || 0,
        xpProgress: {
          current: Math.max(xpInCurrentLevel, 0),
          needed: Math.max(xpNeededForNextLevel, 100),
          percentage: Math.max(
            0,
            Math.min(
              100,
              Math.round(
                (Math.max(xpInCurrentLevel, 0) / Math.max(xpNeededForNextLevel, 100)) * 100
              )
            )
          ),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Gamification stats error:', error)
    return NextResponse.json(emptyStats(), { status: 200 })
  }
}
