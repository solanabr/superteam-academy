import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Challenge } from '@/models';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const latestChallenge = await Challenge.findOne({ is_active: true })
      .sort({ created_at: -1 })
      .select('created_at')
      .lean();

    return NextResponse.json({
      latestChallengeCreatedAt: latestChallenge?.created_at || null,
    });
  } catch (error) {
    console.error('Error fetching challenges status:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges status' }, { status: 500 });
  }
}
