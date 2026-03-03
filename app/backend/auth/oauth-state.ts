import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

if (!process.env.AUTH_SECRET) {
    throw new Error('AUTH_SECRET environment variable is required');
}
const SECRET = process.env.AUTH_SECRET;

interface OAuthStatePayload {
    userId: string;
    action: string;
    nonce: string;
    exp: number;
}

/**
 * Creates a HMAC-signed OAuth state parameter to prevent CSRF attacks.
 * Includes a cryptographic nonce and expiration.
 */
export function createOAuthState(userId: string, action: string = 'link'): string {
    const payload: OAuthStatePayload = {
        userId,
        action,
        nonce: randomBytes(16).toString('hex'),
        exp: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', SECRET).update(data).digest('base64url');

    return `${data}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-signed OAuth state parameter.
 * Returns null if invalid, expired, or tampered.
 */
export function verifyOAuthState(state: string): OAuthStatePayload | null {
    const parts = state.split('.');
    if (parts.length !== 2) return null;

    const [data, signature] = parts;

    // Verify HMAC signature
    const expectedSignature = createHmac('sha256', SECRET).update(data).digest('base64url');
    const sigBuf = Buffer.from(signature, 'base64url');
    const expectedBuf = Buffer.from(expectedSignature, 'base64url');
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;

    try {
        const payload: OAuthStatePayload = JSON.parse(
            Buffer.from(data, 'base64url').toString('utf-8')
        );

        // Check expiration
        if (Date.now() > payload.exp) return null;

        return payload;
    } catch {
        return null;
    }
}
