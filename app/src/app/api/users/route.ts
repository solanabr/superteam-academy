import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';

/**
 * GET /api/users
 * Get current user data (requires wallet address in query)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const user = await UserService.findByWalletAddress(walletAddress);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user rank
    const rankData = await UserService.getUserRank(user._id.toString());

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        avatarUrl: user.avatar_url,
        walletAddress: user.wallet_address,
        totalXp: user.total_xp,
        level: user.level,
        language: user.language,
        theme: user.theme,
        showOnLeaderboard: user.show_on_leaderboard,
        showProfile: user.profile_public,
        emailNotifications: user.email_notifications,
        createdAt: user.created_at,
      },
      rank: rankData,
    });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Create or find user by wallet address
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, displayName } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Find existing or create new user
    let user = await UserService.findByWalletAddress(walletAddress);
    const wasExistingUser = !!user;

    if (!user) {
      user = await UserService.createUser({
        wallet_address: walletAddress,
        display_name: displayName || `User_${walletAddress.slice(0, 6)}`,
      });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        avatarUrl: user.avatar_url,
        walletAddress: user.wallet_address,
        totalXp: user.total_xp,
        level: user.level,
        language: user.language,
        theme: user.theme,
        createdAt: user.created_at,
      },
      created: !wasExistingUser,
    });
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
