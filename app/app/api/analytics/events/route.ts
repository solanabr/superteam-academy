import { NextRequest, NextResponse } from 'next/server';

const VALID_EVENTS = [
  'page_view', 'lesson_start', 'lesson_complete', 'course_enroll',
  'quiz_submit', 'challenge_start', 'challenge_complete',
  'wallet_connect', 'wallet_disconnect', 'search', 'locale_change',
] as const;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { event, data, sessionId } = body;

  if (!event || !VALID_EVENTS.includes(event)) {
    return NextResponse.json(
      { error: `Invalid event. Must be one of: ${VALID_EVENTS.join(', ')}` },
      { status: 400 }
    );
  }

  if (data && typeof data !== 'object') {
    return NextResponse.json({ error: 'data must be an object' }, { status: 400 });
  }

  // In production, send to analytics service (PostHog, Mixpanel, etc.)
  // For now, just acknowledge
  return NextResponse.json({
    received: true,
    event,
    timestamp: new Date().toISOString(),
  });
}
