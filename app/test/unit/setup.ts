/**
 * Global test setup for Vitest.
 * Stubs environment variables and provides common mocks.
 */
import { vi } from 'vitest';

// ─── Environment Variables ──────────────────────────────────────────
// @ts-expect-error — NODE_ENV is typed as read-only but we need to override for tests
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.AUTH_SECRET = 'test-auth-secret-must-be-32-chars!!';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token';
process.env.NEXT_PUBLIC_SOLANA_NETWORK = 'devnet';
process.env.NEXT_PUBLIC_SOLANA_RPC_URL = 'https://api.devnet.solana.com';
process.env.NEXT_PUBLIC_PROGRAM_ID = 'B2vesAWAqYqsQvR2yKDpPf9RaUBLNrnjsCzXrgPcVGwh';
process.env.NEXT_PUBLIC_XP_MINT = 'HA5ZraV52nBSGdnDfEFvi8683qXHPvaR14NTBhBzxe8a';
process.env.CRON_SECRET = 'test-cron-secret';

// ─── Global Mocks ───────────────────────────────────────────────────

// Mock next/headers (commonly used in API routes)
vi.mock('next/headers', () => ({
    headers: () => new Map([['x-forwarded-for', '127.0.0.1']]),
    cookies: () => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    }),
}));

// Mock next-auth
vi.mock('next-auth', () => ({
    default: vi.fn(),
    getServerSession: vi.fn(),
}));

// Mock next-auth/next  
vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn(),
}));
