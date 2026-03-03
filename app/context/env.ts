/**
 * Environment variable validation.
 * Import this module early to fail fast on missing config.
 */

const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'AUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
] as const;

const optionalEnvVars = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SOLANA_NETWORK',
    'NEXT_PUBLIC_SOLANA_RPC_URL',
] as const;

export function validateEnv(): void {
    const missing: string[] = [];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    if (missing.length > 0) {
        console.error(
            `❌ Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}`
        );

        // Only throw in production — allow dev to run with partial config
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    // Warn about optional vars
    const missingOptional = optionalEnvVars.filter((v) => !process.env[v]);
    if (missingOptional.length > 0) {
        console.warn(
            `⚠️  Optional environment variables not set:\n${missingOptional.map((v) => `  - ${v}`).join('\n')}`
        );
    }
}

// ─── Per-Variable Access ──────────────────────────────────────────────

/**
 * Get a required environment variable.
 * Throws in production if not set; returns fallback only in development.
 */
export function getRequiredEnv(key: string, devFallback?: string): string {
    const value = process.env[key];
    if (value) return value;

    if (process.env.NODE_ENV === 'production') {
        throw new Error(
            `Missing required environment variable: ${key}. ` +
            'This must be set in production.'
        );
    }

    if (devFallback !== undefined) return devFallback;

    throw new Error(
        `Missing environment variable: ${key}. ` +
        'Set it in .env.local or provide a development fallback.'
    );
}

/**
 * Get the Solana RPC URL.
 * Throws in production if not explicitly configured.
 */
let _rpcWarned = false;

export function getRpcUrl(): string {
    const url = getRequiredEnv(
        'NEXT_PUBLIC_SOLANA_RPC_URL',
        'https://api.devnet.solana.com'
    );

    if (url === 'https://api.devnet.solana.com' && !_rpcWarned) {
        _rpcWarned = true;
        console.warn(
            '⚠️  Using public devnet RPC. Set NEXT_PUBLIC_SOLANA_RPC_URL for production.'
        );
    }

    return url;
}

/**
 * Safely format an error for API responses.
 * Hides implementation details in production to prevent info disclosure.
 */
export function safeErrorDetails(error: unknown): string | undefined {
    if (process.env.NODE_ENV === 'development') {
        return error instanceof Error ? error.message : String(error);
    }
    return undefined;
}

// Auto-validate on import (server-side only)
if (typeof window === 'undefined') {
    validateEnv();

    // RBAC security warnings (production only — avoid spam in dev)
    if (process.env.ADMIN_WALLETS && process.env.NODE_ENV === 'production') {
        const count = process.env.ADMIN_WALLETS.split(',').filter(Boolean).length;
        console.warn(
            `[SECURITY] ADMIN_WALLETS env set (${count} wallet(s)) — migrate to DB whitelist for production`
        );
    }

    if (!process.env.NEXTAUTH_URL) {
        console.error(
            '[CRITICAL] NEXTAUTH_URL is not set — admin CSRF checks will reject all requests'
        );
    }

    if (!process.env.CALLBACK_SECRET && !process.env.AUTH_SECRET) {
        console.error(
            '[CRITICAL] Neither CALLBACK_SECRET nor AUTH_SECRET is set — callback tokens are insecure'
        );
    }

    if (process.env.ALLOWED_ORIGINS) {
        console.info(`[CONFIG] ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS}`);
    }
}
