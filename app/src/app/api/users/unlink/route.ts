import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserService } from '@/services/user.service';

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider } = body;

    if (!provider || !['wallet', 'google', 'github'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be: wallet, google, or github' },
        { status: 400 }
      );
    }

    // Unlink provider from user
    const updatedUser = await UserService.unlinkProvider(
      session.user.id,
      provider as 'wallet' | 'google' | 'github'
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to unlink provider' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        wallet_address: updatedUser.wallet_address,
        google_id: updatedUser.google_id,
        github_id: updatedUser.github_id,
      },
    });
  } catch (error: unknown) {
    console.error('Error unlinking provider:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to unlink provider' }, { status: 500 });
  }
}
