import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PublicKey } from '@solana/web3.js'

export async function POST(req: Request) {
  try {
    const { walletAddress } = await req.json()
    const wallet = String(walletAddress || '').trim()
    if (!wallet) {
      return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 })
    }
    try {
      new PublicKey(wallet)
    } catch {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = createAdminClient() || supabase
    const { data: walletOwner } = await db
      .from('profiles')
      .select('id')
      .eq('wallet_address', wallet)
      .maybeSingle()

    if (walletOwner && walletOwner.id !== user.id) {
      return NextResponse.json({
        ok: false,
        conflict: true,
        error: 'Wallet already linked to another user'
      })
    }

    const { data: profile } = await db
      .from('profiles')
      .select('id, wallet_address, username')
      .eq('id', user.id)
      .maybeSingle()

    const usernameFallback = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`
    const payload: any = {
      id: user.id,
      wallet_address: wallet,
      updated_at: new Date().toISOString()
    }
    if (!profile?.username) {
      payload.username = usernameFallback
    }

    const { error } = await db
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, walletAddress: wallet })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to link wallet'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
