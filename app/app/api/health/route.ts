/**
 * GET /api/health
 *
 * Health check endpoint for monitoring.
 * Each check has a timeout to prevent hangs.
 *
 * Checks:
 *   1. Database    — Prisma `SELECT 1` (required)
 *   2. Solana RPC  — public devnet getSlot (required)
 *   3. Helius      — NEXT_PUBLIC_HELIUS_RPC_URL / HELIUS_RPC_URL getSlot if configured (optional)
 *   4. Supabase    — auth/settings endpoint (required)
 *   5. Redis       — Upstash REST ping (optional)
 */
import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { prisma } from '@/backend/prisma';

const DEVNET_RPC = 'https://api.devnet.solana.com';

/** Run an async check with a timeout. */
async function withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
): Promise<T> {
    return Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs)
        ),
    ]);
}

interface ServiceCheck {
    ok: boolean;
    latencyMs?: number;
    error?: string;
    errorCode?: string;
    endpoint?: string;
}

export async function GET(): Promise<NextResponse> {
    const checks: Record<string, ServiceCheck> = {};

    // 1. Database (Prisma) — most critical
    {
        const start = Date.now();
        try {
            await withTimeout(() => prisma.$queryRaw`SELECT 1`, 5000);
            checks.database = { ok: true, latencyMs: Date.now() - start };
        } catch (error) {
            checks.database = {
                ok: false,
                latencyMs: Date.now() - start,
                error: error instanceof Error ? error.message : 'Connection failed',
                errorCode: 'DB_CONNECTION_ERROR',
            };
        }
    }

    // 2. Solana RPC (public devnet — always checked)
    {
        const start = Date.now();
        try {
            const connection = new Connection(DEVNET_RPC, 'confirmed');
            const slot = await withTimeout(() => connection.getSlot(), 5000);
            checks['solana_rpc'] = {
                ok: slot > 0,
                latencyMs: Date.now() - start,
                endpoint: DEVNET_RPC,
            };
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Connection failed';
            checks['solana_rpc'] = {
                ok: false,
                latencyMs: Date.now() - start,
                error: msg,
                errorCode: msg.includes('Timed out') ? 'TIMEOUT' : 'RPC_ERROR',
                endpoint: DEVNET_RPC,
            };
        }
    }

    // 3. Helius RPC (custom RPC — checked only if configured)
    const heliusRpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || process.env.HELIUS_RPC_URL;
    if (heliusRpcUrl) {
        const start = Date.now();
        // Mask API key in displayed endpoint
        const maskedEndpoint = heliusRpcUrl.replace(/api-key=[\w-]+/i, 'api-key=***')
            .replace(/(https?:\/\/[^/]+\/v0\/)[\w-]+/, '$1***');
        try {
            const connection = new Connection(heliusRpcUrl, 'confirmed');
            const slot = await withTimeout(() => connection.getSlot(), 5000);
            checks.helius = {
                ok: slot > 0,
                latencyMs: Date.now() - start,
                endpoint: maskedEndpoint,
            };
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Connection failed';
            checks.helius = {
                ok: false,
                latencyMs: Date.now() - start,
                error: msg,
                errorCode: msg.includes('403') ? 'INVALID_API_KEY'
                    : msg.includes('401') ? 'UNAUTHORIZED'
                        : msg.includes('429') ? 'RATE_LIMITED'
                            : msg.includes('Timed out') ? 'TIMEOUT'
                                : 'RPC_ERROR',
                endpoint: maskedEndpoint,
            };
        }
    } else {
        checks.helius = {
            ok: false,
            error: 'NEXT_PUBLIC_HELIUS_RPC_URL / HELIUS_RPC_URL not configured',
            errorCode: 'NOT_CONFIGURED',
        };
    }

    // 4. Supabase — check via auth settings (lighter than REST, no table access needed)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
        const start = Date.now();
        try {
            // Use the auth settings endpoint — lightweight, doesn't need table access
            const response = await withTimeout(
                () => fetch(`${supabaseUrl}/auth/v1/settings`, {
                    headers: {
                        apikey: supabaseKey,
                        Authorization: `Bearer ${supabaseKey}`,
                    },
                }),
                5000
            );
            checks.supabase = {
                ok: response.ok,
                latencyMs: Date.now() - start,
                endpoint: supabaseUrl,
            };
            if (!response.ok) {
                checks.supabase.error = `HTTP ${response.status} ${response.statusText}`;
                checks.supabase.errorCode = `HTTP_${response.status}`;
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Connection failed';
            checks.supabase = {
                ok: false,
                latencyMs: Date.now() - start,
                error: msg,
                errorCode: msg.includes('Timed out') ? 'TIMEOUT' : 'CONNECTION_ERROR',
                endpoint: supabaseUrl,
            };
        }
    } else if (supabaseUrl && !supabaseKey) {
        checks.supabase = {
            ok: false,
            error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY not configured',
            errorCode: 'MISSING_API_KEY',
        };
    } else {
        checks.supabase = {
            ok: false,
            error: 'NEXT_PUBLIC_SUPABASE_URL not configured',
            errorCode: 'NOT_CONFIGURED',
        };
    }

    // 5. Redis (optional — doesn't affect overall status)
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (redisUrl && redisToken) {
        const start = Date.now();
        try {
            const res = await withTimeout(
                () => fetch(`${redisUrl}/ping`, {
                    headers: { Authorization: `Bearer ${redisToken}` },
                }),
                3000
            );
            checks.redis = { ok: res.ok, latencyMs: Date.now() - start };
            if (!res.ok) {
                checks.redis.error = `HTTP ${res.status} ${res.statusText}`;
                checks.redis.errorCode = `HTTP_${res.status}`;
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Connection failed';
            checks.redis = {
                ok: false,
                latencyMs: Date.now() - start,
                error: msg,
                errorCode: msg.includes('Timed out') ? 'TIMEOUT' : 'CONNECTION_ERROR',
            };
        }
    } else if (redisUrl && !redisToken) {
        checks.redis = {
            ok: false,
            error: 'UPSTASH_REDIS_REST_TOKEN not configured',
            errorCode: 'MISSING_API_KEY',
        };
    } else {
        checks.redis = {
            ok: false,
            error: 'Not configured (optional)',
            errorCode: 'NOT_CONFIGURED',
        };
    }

    // Overall: required services (database, solana_rpc, supabase) determine status
    // Helius and Redis are optional
    const requiredChecks = [checks.database, checks['solana_rpc'], checks.supabase].filter(Boolean);
    const allRequired = requiredChecks.every((c) => c.ok);

    return NextResponse.json(
        {
            status: allRequired ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            checks,
        },
        { status: allRequired ? 200 : 503 }
    );
}
