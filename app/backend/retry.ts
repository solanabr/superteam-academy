/**
 * Generic retry utility with exponential backoff.
 *
 * Used by:
 * - tx-builder.ts for Solana RPC failures
 * - helius-service.ts for DAS API transient errors
 */

export interface RetryOptions {
    /** Max number of retry attempts (default: 3) */
    maxRetries?: number;
    /** Base delay in ms before first retry (default: 500) */
    baseDelayMs?: number;
    /** Max delay cap in ms (default: 10_000) */
    maxDelayMs?: number;
    /** Optional predicate — only retry if this returns true */
    shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    baseDelayMs: 500,
    maxDelayMs: 10_000,
    shouldRetry: () => true,
};

/**
 * Execute an async function with exponential backoff retry.
 *
 * Jitter is added to prevent thundering herd:
 *   delay = min(baseDelay * 2^attempt + jitter, maxDelay)
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    opts?: RetryOptions
): Promise<T> {
    const { maxRetries, baseDelayMs, maxDelayMs, shouldRetry } = {
        ...DEFAULT_OPTIONS,
        ...opts,
    };

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (attempt >= maxRetries || !shouldRetry(error)) {
                throw error;
            }

            const jitter = Math.random() * baseDelayMs * 0.5;
            const delay = Math.min(
                baseDelayMs * Math.pow(2, attempt) + jitter,
                maxDelayMs
            );

            console.warn(
                `Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms:`,
                error instanceof Error ? error.message : String(error)
            );

            await sleep(delay);
        }
    }

    throw lastError;
}

/**
 * Check if an error is a transient RPC/network error worth retrying.
 */
export function isTransientError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const msg = error.message.toLowerCase();
    return (
        msg.includes('429') ||                   // Rate limited
        msg.includes('503') ||                   // Service unavailable
        msg.includes('502') ||                   // Bad gateway
        msg.includes('timeout') ||               // Timeout
        msg.includes('econnreset') ||            // Connection reset
        msg.includes('econnrefused') ||          // Connection refused
        msg.includes('fetch failed') ||          // Network error
        msg.includes('blockhash not found') ||   // Solana slot lag
        msg.includes('node is behind')           // Solana node lag
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
