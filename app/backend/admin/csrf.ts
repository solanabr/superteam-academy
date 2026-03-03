import { NextRequest, NextResponse } from 'next/server';

/** Strip trailing slashes and lowercase for comparison */
function normalizeOrigin(url: string): string {
    return url.replace(/\/+$/, '').toLowerCase();
}

/** Build allowed origins from NEXTAUTH_URL + optional ALLOWED_ORIGINS env */
function getAllowedOrigins(): string[] {
    const origins: string[] = [];
    if (process.env.NEXTAUTH_URL) {
        origins.push(normalizeOrigin(process.env.NEXTAUTH_URL));
    }
    // Support preview/staging deployments (e.g., Vercel preview URLs)
    if (process.env.ALLOWED_ORIGINS) {
        const extra = process.env.ALLOWED_ORIGINS
            .split(',')
            .map((o) => normalizeOrigin(o.trim()))
            .filter(Boolean);
        origins.push(...extra);
    }
    return origins;
}

const ALLOWED_ORIGINS = getAllowedOrigins();

/**
 * Verify Origin header matches an allowed origin.
 * Handles reverse proxies (Cloudflare, Vercel Edge) that may return
 * origins with/without trailing slashes or preview deployment URLs.
 *
 * @returns NextResponse with 403 if origin is invalid, null if valid
 */
export function verifyOrigin(request: NextRequest): NextResponse | null {
    const origin = request.headers.get('origin');

    // In dev / when no origins configured, allow same-origin and localhost
    if (!origin) {
        // fetch from same origin may omit Origin header — allow if Referer matches host
        const referer = request.headers.get('referer');
        const host = request.headers.get('host');
        if (referer && host && new URL(referer).host === host) {
            return null;
        }
        return NextResponse.json({ error: 'Forbidden — missing origin' }, { status: 403 });
    }

    const normalized = normalizeOrigin(origin);

    // Allow localhost in development
    if (process.env.NODE_ENV === 'development' && /^https?:\/\/localhost(:\d+)?$/.test(normalized)) {
        return null;
    }

    if (ALLOWED_ORIGINS.length > 0 && ALLOWED_ORIGINS.includes(normalized)) {
        return null;
    }

    return NextResponse.json({ error: 'Forbidden — invalid origin' }, { status: 403 });
}
