import { NextRequest, NextResponse } from 'next/server';
import { learningProgressService } from '@/lib/services/learning-progress';

/**
 * Enroll a learner in a course. Stub: returns success without on-chain tx.
 * Production: return serialized Enroll instruction for wallet to sign, or trigger wallet sign + send.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { wallet, courseId } = body;
  if (!wallet || !courseId) {
    return NextResponse.json({ error: 'wallet and courseId required' }, { status: 400 });
  }
  const result = await learningProgressService.enroll(wallet, courseId);
  return NextResponse.json(result);
}
