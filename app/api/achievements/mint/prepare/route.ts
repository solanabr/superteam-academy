import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { blockchainService } from '@/lib/services/blockchain.service'

export async function POST(req: Request) {
  try {
    const { achievementId, walletAddress } = await req.json()
    if (!achievementId) {
      return NextResponse.json({ error: 'achievementId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [{ data: achievement }, { data: unlocked }, { data: profile }] = await Promise.all([
      supabase
        .from('achievements')
        .select('id, title')
        .eq('id', achievementId)
        .single(),
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

    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })
    }
    if (!unlocked) {
      return NextResponse.json({ error: 'Achievement is still locked' }, { status: 403 })
    }

    const profileWallet = profile?.wallet_address
    if (!profileWallet) {
      return NextResponse.json({ error: 'Link wallet in profile before minting achievement' }, { status: 409 })
    }
    if (walletAddress && walletAddress !== profileWallet) {
      return NextResponse.json({ error: 'Connected wallet does not match linked profile wallet' }, { status: 409 })
    }

    const { data: existing, error: existingError } = await supabase
      .from('user_achievement_certificates')
      .select('mint_address, signature')
      .eq('user_id', user.id)
      .eq('achievement_id', achievementId)
      .maybeSingle()

    if (existingError) {
      const msg = String(existingError.message || '').toLowerCase()
      if ((existingError as any).code === '42P01' || msg.includes('user_achievement_certificates')) {
        return NextResponse.json(
          { error: 'Missing table: public.user_achievement_certificates. Run scripts/006_achievement_certificates.sql in Supabase SQL editor.' },
          { status: 500 }
        )
      }
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    if (existing?.mint_address && existing?.signature) {
      return NextResponse.json({
        ok: true,
        alreadyIssued: true,
        certificate: {
          mintAddress: existing.mint_address,
          signature: existing.signature
        }
      })
    }

    const prepared = await blockchainService.prepareAchievementCertificateTransaction(
      profileWallet,
      achievement.id,
      achievement.title || 'Achievement'
    )

    return NextResponse.json({
      ok: true,
      alreadyIssued: false,
      serializedTransaction: prepared.serializedTransaction,
      mintAddress: prepared.mintAddress
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to prepare achievement mint transaction'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
