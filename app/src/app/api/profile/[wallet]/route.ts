import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  HELIUS_RPC_SERVER,
  XP_MINT,
  TOKEN_2022_PROGRAM_ID,
} from '@/lib/solana/constants';
import { calculateLevel, getLevelTitle } from '@/lib/solana/xp';

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);

/**
 * GET /api/profile/[wallet]
 *
 * Fetches a learner's on-chain XP balance from their Token-2022 ATA
 * and derives level/title from the XP amount.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ wallet: string }> },
): Promise<NextResponse> {
  const { wallet } = await params;

  let walletPubkey: PublicKey;
  try {
    walletPubkey = new PublicKey(wallet);
  } catch {
    return NextResponse.json(
      { error: 'Invalid wallet address' },
      { status: 400 },
    );
  }

  try {
    const connection = new Connection(HELIUS_RPC_SERVER);

    const [ata] = PublicKey.findProgramAddressSync(
      [
        walletPubkey.toBuffer(),
        TOKEN_2022_PROGRAM_ID.toBuffer(),
        XP_MINT.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    let xpBalance = 0;
    try {
      const accountInfo = await connection.getTokenAccountBalance(ata);
      xpBalance = Number(accountInfo.value.amount);
    } catch {
      // ATA doesn't exist yet — wallet has 0 XP
    }

    const level = calculateLevel(xpBalance);

    return NextResponse.json({
      wallet,
      xp: xpBalance,
      level,
      levelTitle: getLevelTitle(level),
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 },
    );
  }
}
