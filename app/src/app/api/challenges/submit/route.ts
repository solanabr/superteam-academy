import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/solana/server/rate-limit';

/**
 * POST /api/challenges/submit
 *
 * Accepts a coding challenge submission. Validates required fields
 * and applies per-wallet rate limiting before processing.
 *
 * Body: { challengeId, wallet, code, language }
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: {
    challengeId?: string;
    wallet?: string;
    code?: string;
    language?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.challengeId || !body.wallet || !body.code) {
    return NextResponse.json(
      { error: 'challengeId, wallet, and code are required' },
      { status: 400 },
    );
  }

  const rateCheck = checkRateLimit(body.wallet);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateCheck.retryAfter },
      { status: 429 },
    );
  }

  return NextResponse.json(
    {
      challengeId: body.challengeId,
      wallet: body.wallet,
      language: body.language ?? 'rust',
      status: 'submitted',
      timestamp: new Date().toISOString(),
    },
    { status: 201 },
  );
}
