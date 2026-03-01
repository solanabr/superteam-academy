import { NextResponse } from 'next/server';
import { PROGRAM_ID, XP_MINT, CLUSTER } from '@/lib/solana/constants';

/**
 * GET /api/stats
 *
 * Returns public platform statistics and program metadata.
 * Useful for dashboards, about pages, and external integrations.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    platform: {
      totalCourses: 5,
      totalLessons: 45,
      totalTracks: 4,
      supportedLanguages: ['en', 'pt-BR', 'es'],
    },
    program: {
      programId: PROGRAM_ID.toBase58(),
      xpMint: XP_MINT.toBase58(),
      cluster: CLUSTER,
      instructions: 16,
      pdaTypes: 6,
    },
    features: [
      'Soulbound XP (Token-2022)',
      'Credential NFTs (Metaplex Core)',
      'Monaco code editor',
      'AI-powered code hints',
      'Server-side quiz validation',
      'Real on-chain leaderboard (Helius DAS)',
      'PWA with offline support',
      'i18n (EN, PT-BR, ES)',
    ],
  });
}
