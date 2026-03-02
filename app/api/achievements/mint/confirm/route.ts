import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { blockchainService } from '@/lib/services/blockchain.service'

export async function POST(req: Request) {
  try {
    const { achievementId, mintAddress, signature } = await req.json()
    if (!achievementId || !mintAddress || !signature) {
      return NextResponse.json({ error: 'achievementId, mintAddress and signature are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [{ data: unlocked }, { data: profile }] = await Promise.all([
      supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id)
        .eq('achievement_id', achievementId)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', user.id)
        .single()
    ])

    if (!unlocked) {
      return NextResponse.json({ error: 'Achievement is still locked' }, { status: 403 })
    }
    if (!profile?.wallet_address) {
      return NextResponse.json({ error: 'Wallet not linked' }, { status: 409 })
    }

    const confirmation = await blockchainService.getConnection().confirmTransaction(signature, 'confirmed')
    if (confirmation.value.err) {
      return NextResponse.json({ error: 'On-chain transaction failed' }, { status: 400 })
    }

    const db = createAdminClient() || supabase
    const { error: upsertError } = await db
      .from('user_achievement_certificates')
      .upsert(
        {
          user_id: user.id,
          achievement_id: achievementId,
          wallet_address: profile.wallet_address,
          mint_address: mintAddress,
          signature,
          network: 'devnet'
        },
        { onConflict: 'user_id,achievement_id' }
      )

    if (upsertError) {
      const msg = String(upsertError.message || '').toLowerCase()
      if ((upsertError as any).code === '42P01' || msg.includes('user_achievement_certificates')) {
        return NextResponse.json(
          { error: 'Missing table: public.user_achievement_certificates. Run scripts/006_achievement_certificates.sql in Supabase SQL editor.' },
          { status: 500 }
        )
      }
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      certificate: {
        mintAddress,
        signature
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed confirming achievement mint'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
