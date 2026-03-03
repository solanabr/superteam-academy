/**
 * Redis-Backed Queue Service.
 *
 * Production-grade job queue using Upstash Redis for persistence.
 * Jobs survive server restarts. Falls back to in-memory if Redis
 * is unavailable (dev/test environments).
 *
 * Features:
 * - Job enqueue with type-safe payloads
 * - Configurable retry with exponential backoff
 * - Dead letter queue for permanently failed jobs
 * - Job processor registration per type
 * - Queue metrics from Redis
 */

import type { QueueJob, JobType, DeadLetterEntry } from './types';
import { getRedisOptional } from '@/backend/redis';

// ── Keys ─────────────────────────────────────────────────────────────

const QUEUE_KEY = 'queue:jobs';
const DEAD_LETTER_KEY = 'queue:dead-letter';
const PROCESSED_KEY = 'queue:stat:processed';
const FAILED_KEY = 'queue:stat:failed';

// ── State ────────────────────────────────────────────────────────────

// In-memory fallback
const memQueue: QueueJob[] = [];
const memDeadLetter: DeadLetterEntry[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processors = new Map<JobType, (payload: any) => Promise<void>>();
let isProcessing = false;
let memProcessedCount = 0;
let memFailedCount = 0;

const DEFAULT_MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 1000;
const MAX_DEAD_LETTER = 1000;

// ── Helpers ──────────────────────────────────────────────────────────

function serializeJob(job: QueueJob): string {
    return JSON.stringify(job);
}

function deserializeJob(s: string): QueueJob {
    return JSON.parse(s) as QueueJob;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Register a processor function for a job type.
 */
export function registerProcessor<T>(
    type: JobType,
    processor: (payload: T) => Promise<void>
): void {
    processors.set(type, processor);
}

/**
 * Enqueue a new job. Persists to Redis if available.
 */
export async function enqueue<T>(
    type: JobType,
    payload: T,
    options?: { maxAttempts?: number; scheduledAt?: number }
): Promise<string> {
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const job: QueueJob<T> = {
        id,
        type,
        payload,
        attempts: 0,
        maxAttempts: options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
        createdAt: Date.now(),
        scheduledAt: options?.scheduledAt,
    };

    const redis = getRedisOptional();
    if (redis) {
        await redis.lpush(QUEUE_KEY, serializeJob(job));
    } else {
        memQueue.push(job);
    }

    // Auto-start processing
    if (!isProcessing) {
        processNext();
    }

    return id;
}

/**
 * Get queue metrics.
 */
export async function getQueueMetrics() {
    const redis = getRedisOptional();
    if (redis) {
        const [pending, deadLetter, processed, failed] = await Promise.all([
            redis.llen(QUEUE_KEY),
            redis.llen(DEAD_LETTER_KEY),
            redis.get<number>(PROCESSED_KEY),
            redis.get<number>(FAILED_KEY),
        ]);
        return {
            pending,
            deadLetter,
            processed: processed ?? 0,
            failed: failed ?? 0,
            registeredTypes: Array.from(processors.keys()),
        };
    }

    return {
        pending: memQueue.length,
        deadLetter: memDeadLetter.length,
        processed: memProcessedCount,
        failed: memFailedCount,
        registeredTypes: Array.from(processors.keys()),
    };
}

/**
 * Get dead letter queue entries.
 */
export async function getDeadLetterEntries(limit = 50): Promise<DeadLetterEntry[]> {
    const redis = getRedisOptional();
    if (redis) {
        const raw = await redis.lrange<string>(DEAD_LETTER_KEY, 0, limit - 1);
        return raw.map((s) => JSON.parse(s) as DeadLetterEntry);
    }
    return memDeadLetter.slice(0, limit);
}

/**
 * Retry a dead letter job.
 */
export async function retryDeadLetter(jobId: string): Promise<boolean> {
    const redis = getRedisOptional();
    if (redis) {
        const all = await redis.lrange<string>(DEAD_LETTER_KEY, 0, -1);
        for (let i = 0; i < all.length; i++) {
            const entry = JSON.parse(all[i]) as DeadLetterEntry;
            if (entry.job.id === jobId) {
                // Remove from dead letter, re-enqueue
                await redis.lrem(DEAD_LETTER_KEY, 1, all[i]);
                entry.job.attempts = 0;
                entry.job.lastError = undefined;
                await redis.lpush(QUEUE_KEY, serializeJob(entry.job));
                if (!isProcessing) processNext();
                return true;
            }
        }
        return false;
    }

    // In-memory fallback
    const idx = memDeadLetter.findIndex((e) => e.job.id === jobId);
    if (idx === -1) return false;
    const entry = memDeadLetter.splice(idx, 1)[0];
    entry.job.attempts = 0;
    entry.job.lastError = undefined;
    memQueue.push(entry.job);
    if (!isProcessing) processNext();
    return true;
}

// ── Internal Processing ──────────────────────────────────────────────

async function processNext(): Promise<void> {
    const redis = getRedisOptional();

    // Check if there are jobs to process
    const hasJobs = redis
        ? (await redis.llen(QUEUE_KEY)) > 0
        : memQueue.length > 0;

    if (!hasJobs) {
        isProcessing = false;
        return;
    }

    isProcessing = true;

    let job: QueueJob | null = null;

    if (redis) {
        const raw = await redis.rpop<string>(QUEUE_KEY);
        if (!raw) {
            isProcessing = false;
            return;
        }
        job = deserializeJob(raw);

        // Check scheduled time
        if (job.scheduledAt && job.scheduledAt > Date.now()) {
            // Re-enqueue and wait
            await redis.lpush(QUEUE_KEY, serializeJob(job));
            isProcessing = false;
            setTimeout(() => {
                if (!isProcessing) processNext();
            }, 1000);
            return;
        }
    } else {
        const now = Date.now();
        const jobIndex = memQueue.findIndex(
            (j) => !j.scheduledAt || j.scheduledAt <= now
        );
        if (jobIndex === -1) {
            isProcessing = false;
            setTimeout(() => {
                if (!isProcessing && memQueue.length > 0) processNext();
            }, 1000);
            return;
        }
        job = memQueue.splice(jobIndex, 1)[0];
    }

    if (!job) {
        isProcessing = false;
        return;
    }

    const processor = processors.get(job.type);

    if (!processor) {
        console.warn(`[Queue] No processor for job type: ${job.type}`);
        await moveToDeadLetter(job, `No processor registered for type: ${job.type}`);
        void processNext();
        return;
    }

    try {
        job.attempts++;
        await processor(job.payload);
        if (redis) {
            await redis.incr(PROCESSED_KEY);
        } else {
            memProcessedCount++;
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        job.lastError = errorMessage;

        if (job.attempts >= job.maxAttempts) {
            if (redis) {
                await redis.incr(FAILED_KEY);
            } else {
                memFailedCount++;
            }
            await moveToDeadLetter(job, errorMessage);
            console.error(`[Queue] Job ${job.id} (${job.type}) permanently failed: ${errorMessage}`);
        } else {
            // Re-enqueue with exponential backoff
            const backoff = BACKOFF_BASE_MS * Math.pow(2, job.attempts - 1);
            job.scheduledAt = Date.now() + backoff;
            if (redis) {
                await redis.lpush(QUEUE_KEY, serializeJob(job));
            } else {
                memQueue.push(job);
            }
            console.warn(
                `[Queue] Job ${job.id} (${job.type}) failed, retry ${job.attempts}/${job.maxAttempts} in ${backoff}ms`
            );
        }
    }

    // Continue processing
    void processNext();
}

async function moveToDeadLetter(job: QueueJob, error: string): Promise<void> {
    const entry: DeadLetterEntry = { job, failedAt: Date.now(), error };

    const redis = getRedisOptional();
    if (redis) {
        await redis.lpush(DEAD_LETTER_KEY, JSON.stringify(entry));
        // Trim dead letter to max size
        await redis.ltrim(DEAD_LETTER_KEY, 0, MAX_DEAD_LETTER - 1);
    } else {
        memDeadLetter.push(entry);
        if (memDeadLetter.length > MAX_DEAD_LETTER) {
            memDeadLetter.shift();
        }
    }
}
