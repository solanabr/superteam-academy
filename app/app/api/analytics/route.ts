import { NextRequest, NextResponse } from 'next/server';
import type { AnalyticsEvent } from '@/lib/analytics';

/**
 * Analytics ingestion. Stub: log only. Production: forward to GA4 (NEXT_PUBLIC_GA_ID),
 * heatmap provider (PostHog/Hotjar/Clarity), and/or Sentry for errors.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AnalyticsEvent;
    if (!body?.name) {
      return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });
    }
    // Stub: in production send to GA4 gtag, PostHog, etc.
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', body);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
