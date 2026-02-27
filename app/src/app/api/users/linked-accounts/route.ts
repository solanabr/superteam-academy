import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserService } from '@/services/user.service';

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database to check all linked accounts
    const user = await UserService.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      linked_accounts: {
        wallet: !!user.wallet_address,
        google: !!user.google_id,
        github: !!user.github_id,
      },
      wallet_address: user.wallet_address || null,
    });
  } catch (error) {
    console.error('Error fetching linked accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch linked accounts' }, { status: 500 });
  }
}
