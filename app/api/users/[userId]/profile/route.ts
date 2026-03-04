import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient, UserRow } from '@/lib/types/db'

function mapUser(user: UserRow, age: number | null = null) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    bio: user.bio ?? '',
    age,
    walletAddress: user.wallet_address ?? null,
    totalXP: user.total_xp ?? 0,
    level: user.level ?? 1,
    currentStreak: user.current_streak ?? 0,
    longestStreak: user.longest_streak ?? 0,
    createdAt: user.created_at,
  }
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

const USER_FIELDS =
  'id, email, display_name, avatar_url, bio, wallet_address, total_xp, level, current_streak, longest_streak, created_at'

async function resolveUserByIdentifier(supabase: SupabaseClient, rawUserId: string) {
  const candidates = Array.from(new Set([rawUserId, rawUserId.toLowerCase()]))

  for (const candidate of candidates) {
    let { data: user } = await supabase
      .from('users')
      .select(USER_FIELDS)
      .eq('id', candidate)
      .maybeSingle()

    if (!user) {
      const byEmail = await supabase
        .from('users')
        .select(USER_FIELDS)
        .eq('email', candidate)
        .maybeSingle()
      user = byEmail.data
    }

    if (!user) {
      const byWallet = await supabase
        .from('users')
        .select(USER_FIELDS)
        .eq('wallet_address', candidate)
        .maybeSingle()
      user = byWallet.data
    }

    if (!user) {
      const byUsername = await supabase
        .from('users')
        .select(USER_FIELDS)
        .eq('username', candidate)
        .maybeSingle()
      user = byUsername.data
    }

    if (user) {
      return user
    }
  }

  return null
}

async function fetchUserAge(supabase: SupabaseClient, userId: string) {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('age')
      .eq('user_id', userId)
      .maybeSingle()

    return typeof data?.age === 'number' ? data.age : null
  } catch {
    return null
  }
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

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const user = await resolveUserByIdentifier(supabase, userId)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const age = await fetchUserAge(supabase, user.id)

    return NextResponse.json(mapUser(user, age), { status: 200 })
  } catch (error) {
    console.error('Profile lookup error:', error)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = decodeURIComponent(params.userId || '')
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const existingUser = await resolveUserByIdentifier(supabase, userId)
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const updates: Record<string, string | null> = {}

    if (typeof body.displayName === 'string') {
      updates.display_name = body.displayName.trim()
    }
    if (typeof body.bio === 'string') {
      updates.bio = body.bio
    }
    if (typeof body.avatarUrl === 'string') {
      updates.avatar_url = body.avatarUrl
    }
    if (typeof body.walletAddress === 'string') {
      updates.wallet_address = body.walletAddress
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', existingUser.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    if (typeof body.age === 'number' && Number.isFinite(body.age)) {
      try {
        await supabase
          .from('user_profiles')
          .upsert(
            {
              user_id: existingUser.id,
              age: Math.max(0, Math.floor(body.age)),
            },
            { onConflict: 'user_id' }
          )
      } catch {
        // Best-effort only: some setups may not have user_profiles.
      }
    }

    const refreshedUser = await resolveUserByIdentifier(supabase, existingUser.id)
    if (!refreshedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const age = await fetchUserAge(supabase, existingUser.id)

    return NextResponse.json(mapUser(refreshedUser, age), { status: 200 })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
