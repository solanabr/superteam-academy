import { NextResponse } from 'next/server';

/**
 * GET /api/notifications?wallet=<address>
 *
 * Returns contextual notifications for a given wallet.
 * Currently returns seed notifications; will integrate with on-chain
 * events (achievement awards, XP grants, streak milestones) in production.
 */

interface Notification {
  id: string;
  type: 'achievement' | 'xp' | 'streak' | 'course' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

function getNotificationsForWallet(wallet: string): Notification[] {
  const now = new Date();

  return [
    {
      id: `notif-${wallet.slice(0, 8)}-1`,
      type: 'system',
      title: 'Welcome to Superteam Academy',
      message: 'Start your Solana journey by enrolling in Solana 101.',
      read: false,
      createdAt: new Date(now.getTime() - 86_400_000).toISOString(),
    },
    {
      id: `notif-${wallet.slice(0, 8)}-2`,
      type: 'streak',
      title: 'Keep your streak alive!',
      message: 'Complete a lesson today to maintain your learning streak.',
      read: false,
      createdAt: now.toISOString(),
    },
    {
      id: `notif-${wallet.slice(0, 8)}-3`,
      type: 'course',
      title: 'New course available',
      message: 'DeFi Masterclass is now live. Earn up to 2,000 XP.',
      read: true,
      createdAt: new Date(now.getTime() - 172_800_000).toISOString(),
    },
  ];
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const wallet = url.searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json(
      { error: 'wallet query parameter is required' },
      { status: 400 },
    );
  }

  const notifications = getNotificationsForWallet(wallet);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}
