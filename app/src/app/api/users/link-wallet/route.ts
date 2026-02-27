import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserService } from '@/services/user.service';
import { verifySignature } from '@/lib/solana-auth';

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { walletAddress, signature, message } = body;

    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, signature, message' },
        { status: 400 }
      );
    }

    // Verify the signature
    const isValid = await verifySignature(walletAddress, signature, message);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Link wallet to user
    const updatedUser = await UserService.linkWallet(session.user.id, walletAddress);

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to link wallet' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        wallet_address: updatedUser.wallet_address,
      },
    });
  } catch (error: unknown) {
    console.error('Error linking wallet:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to link wallet' }, { status: 500 });
  }
}
