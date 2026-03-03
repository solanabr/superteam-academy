import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import type { SupabaseClient, UserRow } from '@/lib/types/db'

function mapUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    bio: user.bio ?? '',
    walletAddress: user.wallet_address ?? null,
    totalXP: user.total_xp ?? 0,
    level: user.level ?? 1,
    currentStreak: user.current_streak ?? 0,
    longestStreak: user.longest_streak ?? 0,
    createdAt: user.created_at,
  }
}

async function upsertUserAge(supabase: SupabaseClient, userId: string, age: unknown) {
  if (typeof age !== 'number' || !Number.isFinite(age)) return

  try {
    await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: userId,
          age: Math.max(0, Math.floor(age)),
        },
        { onConflict: 'user_id' }
      )
  } catch {
    // user_profiles is optional in some environments
  }
}

export async function POST(request: NextRequest) {
  try {
    const { provider, providerUserId, profile } = await request.json()

    if (!provider || !providerUserId || !profile) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, providerUserId, profile' },
        { status: 400 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const email = (profile.email || `${provider}-${providerUserId}@academy.local`).toLowerCase()
    const displayName = profile.name || profile.login || 'User'

    const fields =
      'id, email, display_name, avatar_url, bio, wallet_address, total_xp, level, current_streak, longest_streak, created_at'

    // Existing by id first (id is email in this project), fallback by email.
    let { data: existing } = await supabase
      .from('users')
      .select(fields)
      .eq('id', email)
      .maybeSingle()

    if (!existing) {
      const byEmail = await supabase.from('users').select(fields).eq('email', email).maybeSingle()
      existing = byEmail.data
    }

    if (existing) {
      await upsertUserAge(supabase, existing.id, profile.age)
      return NextResponse.json(mapUser(existing), { status: 200 })
    }

    const { error: insertError } = await supabase.from('users').insert({
      id: email,
      email,
      display_name: displayName,
      avatar_url: profile.image || profile.avatar_url || null,
      total_xp: 0,
      level: 1,
      current_streak: 0,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Best-effort side tables; don't fail user creation if these inserts fail.
    try {
      await supabase.from('auth_providers').insert({
        id: randomUUID(),
        user_id: email,
        provider,
        provider_user_id: providerUserId,
      })
    } catch {
      // no-op
    }

    try {
      await supabase.from('streaks').insert({
        id: randomUUID(),
        user_id: email,
        current_streak: 0,
        longest_streak: 0,
      })
    } catch {
      // no-op
    }

    const created = await supabase.from('users').select(fields).eq('id', email).maybeSingle()
    if (!created.data) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    await upsertUserAge(supabase, created.data.id, profile.age)

    return NextResponse.json(mapUser(created.data), { status: 201 })
  } catch (error) {
    console.error('OAuth user creation error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
