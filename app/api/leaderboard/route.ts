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

async function buildDbLeaderboard(limit: number, offset: number) {
  const supabase = await getSupabaseClient()
  if (!supabase) return []

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
    const xpMint = process.env.NEXT_PUBLIC_XP_TOKEN_MINT || process.env.XP_TOKEN_MINT
    const heliusApiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY || process.env.HELIUS_API_KEY

    if (xpMint && heliusApiKey) {
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

    const dbLeaderboard = await buildDbLeaderboard(limit, offset)
    return NextResponse.json(dbLeaderboard, { status: 200 })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json([], { status: 200 })
  }
}
