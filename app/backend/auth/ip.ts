import { NextRequest } from 'next/server';

/**
 * Extract client IP for rate limiting.
 *
 * Trust model:
 * - `x-real-ip`: Set by Vercel/Cloudflare edge — NOT spoofable by client.
 * - `x-forwarded-for`: Rightmost value used (closest trusted proxy), but can
 *   be bypassed entirely if the attacker rotates source IPs.
 *
 * LIMITATION: IP-based rate limiting can be circumvented by using different
 * source IPs (VPNs, botnets). For critical endpoints, supplement with
 * user-ID-based rate limiting after authentication.
 */
export function getClientIp(request: NextRequest): string {
    return (
        request.headers.get('x-real-ip') ||
        request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
        'unknown'
    );
}
