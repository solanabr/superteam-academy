import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { challengeId, walletAddress, code, answers } = body;

  if (!challengeId || typeof challengeId !== 'string') {
    return NextResponse.json({ error: 'challengeId is required' }, { status: 400 });
  }
  if (!walletAddress || typeof walletAddress !== 'string') {
    return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
  }

  // Simulate validation
  const passed = Math.random() > 0.3; // 70% pass rate for demo
  const xpEarned = passed ? 50 : 0;

  return NextResponse.json({
    challengeId,
    walletAddress,
    passed,
    xpEarned,
    feedback: passed ? 'All tests passed!' : 'Some tests failed. Check your implementation.',
    submittedAt: new Date().toISOString(),
  });
}
