/**
 * Callback URL encryption/decryption for secure redirect tokens.
 *
 * Used by proxy.ts (encrypt on redirect) and login page (decrypt on sign-in).
 * Separate from AUTH_SECRET to avoid rotation coupling.
 */

import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const CALLBACK_SECRET_RAW = process.env.CALLBACK_SECRET || process.env.AUTH_SECRET || '';
const CALLBACK_KEY = createHash('sha256').update(CALLBACK_SECRET_RAW).digest();
const ALGORITHM = 'aes-256-gcm' as const;
const TOKEN_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

export function encryptCallbackUrl(url: string): string {
    const payload = JSON.stringify({ url, ts: Date.now() });
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, CALLBACK_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

export function decryptCallbackUrl(token: string): string | null {
    try {
        const buf = Buffer.from(token, 'base64url');
        if (buf.length < 29) return null; // iv(12) + tag(16) + min 1 byte
        const iv = buf.subarray(0, 12);
        const tag = buf.subarray(12, 28);
        const ciphertext = buf.subarray(28);
        const decipher = createDecipheriv(ALGORITHM, CALLBACK_KEY, iv);
        decipher.setAuthTag(tag);
        const json = decipher.update(ciphertext, undefined, 'utf8') + decipher.final('utf8');
        const { url, ts } = JSON.parse(json);
        // Reject expired tokens
        if (Date.now() - ts > TOKEN_MAX_AGE_MS) return null;
        // Reject external/absolute URLs (must start with /)
        if (typeof url !== 'string' || !url.startsWith('/')) return null;
        return url;
    } catch {
        return null; // tampered, malformed, or expired
    }
}
