import { NextRequest, NextResponse } from 'next/server'

interface HeliusTokenHolder {
  owner: string
  amount: string
  decimals?: number
}

interface SupabaseUser {
  id: string
  username: string | null
  display_name: string | null
  wallet_address: string | null
  current_streak: number | null
  total_xp?: number | null
}

type Timeframe = 'weekly' | 'monthly' | 'alltime'

function shortWallet(wallet: string): string {
  if (!wallet) return 'Unknown'
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
}

function deriveLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100))
}

function parseXpAmount(holder: HeliusTokenHolder): number {
  const decimals = holder.decimals ?? 0
  const amount = Number(holder.amount)
  if (!Number.isFinite(amount)) return 0
  return decimals > 0 ? amount / 10 ** decimals : amount
}

async function getSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }

  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function parseTimeframe(timeframe: string | null): Timeframe {
  if (timeframe === 'weekly' || timeframe === 'monthly' || timeframe === 'alltime') {
    return timeframe
  }
  return 'alltime'
}

function timeframeStartIso(timeframe: Timeframe): string | null {
  const now = new Date()
  if (timeframe === 'weekly') {
    now.setDate(now.getDate() - 7)
    return now.toISOString()
  }
  if (timeframe === 'monthly') {
    now.setDate(now.getDate() - 30)
    return now.toISOString()
  }
  return null
}

async function buildDbLeaderboard(
  limit: number,
  offset: number,
  timeframe: Timeframe,
  courseId?: string
) {
  const supabase = await getSupabaseClient()
  if (!supabase) return []

  if (timeframe !== 'alltime' || courseId) {
    const startIso = timeframeStartIso(timeframe)
    let txQuery = supabase
      .from('xp_transactions')
      .select('user_id, amount, course_id, created_at')

    if (startIso) {
      txQuery = txQuery.gte('created_at', startIso)
    }

    if (courseId) {
      txQuery = txQuery.eq('course_id', courseId)
    }

    const { data: transactions, error: txError } = await txQuery

    if (txError || !transactions) {
      if (txError) {
        console.warn('DB timeframe leaderboard failed:', txError.message)
      }
      return []
    }

    const xpByUser = new Map<string, number>()
    for (const transaction of transactions) {
      const userId = String(transaction.user_id || '')
      const amount = Number(transaction.amount || 0)
      if (!userId || !Number.isFinite(amount)) continue
      const current = xpByUser.get(userId) || 0
      xpByUser.set(userId, current + amount)
    }

    const ranked = Array.from(xpByUser.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(offset, offset + limit)

    if (ranked.length === 0) return []

    const userIds = ranked.map(([userId]) => userId)
    const usersById = new Map<string, SupabaseUser>()
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, display_name, wallet_address, current_streak')
      .in('id', userIds)

    if (!usersError && users) {
      for (const user of users as SupabaseUser[]) {
        usersById.set(user.id, user)
      }
    }

    return ranked.map(([userId, totalXP], idx) => {
      const user = usersById.get(userId)
      const wallet = user?.wallet_address || userId
      const username = user?.username || shortWallet(wallet)
      const displayName = user?.display_name || user?.username || shortWallet(wallet)

      return {
        rank: offset + idx + 1,
        userId,
        wallet,
        username,
        displayName,
        totalXP,
        level: deriveLevel(totalXP),
        currentStreak: user?.current_streak || 0,
      }
    })
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, wallet_address, current_streak, total_xp')
    .order('total_xp', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1)

  if (error || !data) {
    if (error) {
      console.warn('DB leaderboard fallback failed:', error.message)
    }
    return []
  }

  return (data as SupabaseUser[]).map((user, idx) => {
    const wallet = user.wallet_address || user.id
    const totalXP = user.total_xp || 0
    const username = user.username || shortWallet(wallet)
    const displayName = user.display_name || user.username || shortWallet(wallet)

    return {
      rank: offset + idx + 1,
      userId: user.id,
      wallet,
      username,
      displayName,
      totalXP,
      level: deriveLevel(totalXP),
      currentStreak: user.current_streak || 0,
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    const timeframe = parseTimeframe(searchParams.get('timeframe'))
    const courseIdParam = searchParams.get('courseId')
    const courseId =
      typeof courseIdParam === 'string' && courseIdParam.length > 0 && courseIdParam !== 'all'
        ? courseIdParam
        : undefined
    const xpMint = process.env.NEXT_PUBLIC_XP_TOKEN_MINT || process.env.XP_TOKEN_MINT
    const heliusApiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY || process.env.HELIUS_API_KEY

    if (xpMint && heliusApiKey && timeframe === 'alltime' && !courseId) {
      try {
        const holdersLimit = Math.min(offset + limit, 1000)
        const holdersRes = await fetch(`https://api.helius.xyz/v0/token/holders?api_key=${heliusApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mint: xpMint, limit: holdersLimit }),
          cache: 'no-store',
        })

        if (holdersRes.ok) {
          const holdersData = await holdersRes.json()
          const holders: HeliusTokenHolder[] = Array.isArray(holdersData?.result)
            ? holdersData.result
            : []

          if (holders.length > 0) {
            const slicedHolders = holders.slice(offset, offset + limit)
            const wallets = slicedHolders.map((h) => h.owner).filter(Boolean)
            const usersByWallet = new Map<string, SupabaseUser>()
            const supabase = await getSupabaseClient()

            if (supabase && wallets.length > 0) {
              const [{ data: byWallet }, { data: byId }] = await Promise.all([
                supabase
                  .from('users')
                  .select('id, username, display_name, wallet_address, current_streak')
                  .in('wallet_address', wallets),
                supabase
                  .from('users')
                  .select('id, username, display_name, wallet_address, current_streak')
                  .in('id', wallets),
              ])

              for (const user of (byWallet || []) as SupabaseUser[]) {
                if (user.wallet_address) {
                  usersByWallet.set(user.wallet_address.toLowerCase(), user)
                }
              }

              for (const user of (byId || []) as SupabaseUser[]) {
                usersByWallet.set(user.id.toLowerCase(), user)
              }
            }

            const leaderboard = slicedHolders.map((holder, idx) => {
              const wallet = holder.owner
              const user = usersByWallet.get(wallet.toLowerCase())
              const totalXP = parseXpAmount(holder)
              const username = user?.username || shortWallet(wallet)
              const displayName = user?.display_name || user?.username || shortWallet(wallet)

              return {
                rank: offset + idx + 1,
                userId: wallet,
                wallet,
                username,
                displayName,
                totalXP,
                level: deriveLevel(totalXP),
                currentStreak: user?.current_streak || 0,
              }
            })

            return NextResponse.json(leaderboard, { status: 200 })
          }
        }
      } catch (onchainError) {
        console.warn('On-chain leaderboard fetch failed, falling back to DB:', onchainError)
      }
    }

    const dbLeaderboard = await buildDbLeaderboard(limit, offset, timeframe, courseId)
    return NextResponse.json(dbLeaderboard, { status: 200 })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json([], { status: 200 })
  }
}
