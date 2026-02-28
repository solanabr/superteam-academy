import { NextRequest, NextResponse } from 'next/server';

interface Notification {
  id: string;
  type: 'achievement' | 'course' | 'community' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// In-memory notification store (per-wallet)
const notificationStore = new Map<string, Notification[]>();

function getDefaultNotifications(): Notification[] {
  return [
    {
      id: 'welcome',
      type: 'system',
      title: 'Welcome to Superteam Academy!',
      message: 'Start your learning journey by enrolling in a course.',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'first-course',
      type: 'course',
      title: 'New Course Available',
      message: 'Solana 101: Fundamentals is a great place to start.',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'challenge-daily',
      type: 'achievement',
      title: 'Daily Challenge Ready',
      message: 'A new daily coding challenge is available. Earn bonus XP!',
      read: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];
}

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet') ?? 'anonymous';
  const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true';

  if (!notificationStore.has(wallet)) {
    notificationStore.set(wallet, getDefaultNotifications());
  }

  let notifications = notificationStore.get(wallet) ?? [];
  if (unreadOnly) {
    notifications = notifications.filter((n) => !n.read);
  }

  // Cap store size
  if (notificationStore.size > 5000) {
    const oldest = notificationStore.keys().next().value;
    if (oldest) notificationStore.delete(oldest);
  }

  return NextResponse.json({
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || !body.wallet) {
    return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
  }

  const notifications = notificationStore.get(body.wallet);
  if (!notifications) {
    return NextResponse.json({ updated: 0 });
  }

  // Mark specific or all as read
  let updated = 0;
  for (const n of notifications) {
    if (body.id ? n.id === body.id : true) {
      if (!n.read) { n.read = true; updated++; }
    }
  }

  return NextResponse.json({ updated });
}
