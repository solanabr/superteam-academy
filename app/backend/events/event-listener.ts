/**
 * Event Listener Service.
 *
 * Subscribes to on-chain program events via Anchor's event parser and
 * dispatches them to handlers. Supports:
 * - Real-time WebSocket subscription
 * - Transaction log parsing for missed events (restart recovery)
 * - Redis-based deduplication via tx hash
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, BorshCoder, EventParser } from '@coral-xyz/anchor';
import { PROGRAM_ID } from '@/context/solana/constants';
import idl from '@/context/idl/onchain_academy.json';
import type { EventPayload, EventName } from './types';
import { EVENT_NAMES } from './types';
import { dispatchEvent } from './handlers';
import { getRedisOptional } from '@/backend/redis';

// ── Listener State ───────────────────────────────────────────────────

let isListening = false;
let subscriptionId: number | null = null;

// In-memory fallback for when Redis is unavailable
let memTxHashes = new Set<string>();
const MAX_HASH_CACHE = 10_000;
const REDIS_TX_KEY = 'events:processed';
const REDIS_TX_TTL = 86400; // 24h

/**
 * Track a tx hash — returns true if new, false if already processed.
 * Uses Redis Set with fallback to in-memory Set.
 */
async function trackTxHash(hash: string): Promise<boolean> {
    const redis = getRedisOptional();

    if (redis) {
        const alreadyExists = await redis.sismember(REDIS_TX_KEY, hash);
        if (alreadyExists) return false;
        await redis.sadd(REDIS_TX_KEY, hash);
        // Set expiry on the key (resets TTL on each write — acceptable for dedup)
        await redis.expire(REDIS_TX_KEY, REDIS_TX_TTL);
        return true;
    }

    // In-memory fallback
    if (memTxHashes.has(hash)) return false;
    memTxHashes.add(hash);
    if (memTxHashes.size > MAX_HASH_CACHE) {
        const iter = memTxHashes.values();
        for (let i = 0; i < MAX_HASH_CACHE / 2; i++) {
            memTxHashes.delete(iter.next().value!);
        }
    }
    return true;
}

// ── Connection Setup ─────────────────────────────────────────────────

function getConnection(): Connection {
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    return new Connection(rpcUrl, {
        commitment: 'confirmed',
        wsEndpoint: rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://'),
    });
}

function getEventParser(): EventParser {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coder = new BorshCoder(idl as any);
    return new EventParser(PROGRAM_ID, coder);
}

// ── Real-time Subscription ───────────────────────────────────────────

/**
 * Start listening for on-chain events via WebSocket log subscription.
 * Events are parsed from transaction logs and dispatched to handlers.
 */
export function startEventListener(): void {
    if (isListening) {
        console.log('[EventListener] Already listening');
        return;
    }

    const connection = getConnection();
    const parser = getEventParser();

    console.log(`[EventListener] Subscribing to program ${PROGRAM_ID.toBase58()}...`);

    subscriptionId = connection.onLogs(
        PROGRAM_ID,
        async (logInfo) => {
            if (logInfo.err) return; // skip failed transactions

            const txHash = logInfo.signature;
            if (!(await trackTxHash(txHash))) return; // deduplicate

            // Parse events from transaction logs
            const events: EventPayload[] = [];
            for (const event of parser.parseLogs(logInfo.logs)) {
                if (EVENT_NAMES.includes(event.name as EventName)) {
                    events.push({
                        name: event.name as EventName,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        data: serializeEventData(event.data as any),
                    } as EventPayload);
                }
            }

            // Dispatch each event (onLogs doesn't expose slot directly, fetch latest)
            const currentSlot = await connection.getSlot('confirmed').catch(() => 0);
            for (const event of events) {
                dispatchEvent(event, txHash, currentSlot).catch((err) => {
                    console.error(`[EventListener] Dispatch error for ${event.name}:`, err);
                });
            }
        },
        'confirmed'
    );

    isListening = true;
    console.log('[EventListener] ✅ Listening for events');
}

/**
 * Stop the event listener.
 */
export async function stopEventListener(): Promise<void> {
    if (!isListening || subscriptionId === null) {
        console.log('[EventListener] Not running');
        return;
    }

    const connection = getConnection();
    await connection.removeOnLogsListener(subscriptionId);
    subscriptionId = null;
    isListening = false;
    console.log('[EventListener] Stopped');
}

/**
 * Get the listener status.
 */
export async function getListenerStatus(): Promise<{
    isListening: boolean;
    processedCount: number;
    programId: string;
}> {
    const redis = getRedisOptional();
    const count = redis
        ? await redis.scard(REDIS_TX_KEY)
        : memTxHashes.size;
    return {
        isListening,
        processedCount: count,
        programId: PROGRAM_ID.toBase58(),
    };
}

// ── Restart Recovery ─────────────────────────────────────────────────

/**
 * Recover missed events by fetching recent transaction signatures
 * and parsing their logs. Called on service restart.
 *
 * @param lookbackSlots Number of recent signatures to scan (default: 100)
 */
export async function recoverMissedEvents(lookbackSlots = 100): Promise<number> {
    const connection = getConnection();
    const parser = getEventParser();

    console.log(`[EventListener] Recovering missed events (last ${lookbackSlots} signatures)...`);

    const signatures = await connection.getSignaturesForAddress(PROGRAM_ID, {
        limit: lookbackSlots,
    });

    let recovered = 0;

    for (const sigInfo of signatures) {
        if (sigInfo.err) continue;
        if (!trackTxHash(sigInfo.signature)) continue; // already processed

        try {
            const tx = await connection.getTransaction(sigInfo.signature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0,
            });

            if (!tx?.meta?.logMessages) continue;

            for (const event of parser.parseLogs(tx.meta.logMessages)) {
                if (EVENT_NAMES.includes(event.name as EventName)) {
                    const payload = {
                        name: event.name as EventName,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        data: serializeEventData(event.data as any),
                    } as EventPayload;

                    await dispatchEvent(payload, sigInfo.signature, sigInfo.slot);
                    recovered++;
                }
            }
        } catch (err) {
            console.error(`[EventListener] Recovery error for tx ${sigInfo.signature}:`, err);
        }
    }

    console.log(`[EventListener] Recovered ${recovered} events`);
    return recovered;
}

// ── Utility ──────────────────────────────────────────────────────────

/**
 * Serialize Anchor event data — convert PublicKey objects to strings
 * and BN objects to numbers for safe JSON storage.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeEventData(data: Record<string, any>): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
        if (value instanceof PublicKey) {
            result[key] = value.toBase58();
        } else if (typeof value === 'bigint') {
            result[key] = Number(value);
        } else if (value && typeof value === 'object' && 'toNumber' in value) {
            result[key] = value.toNumber();
        } else if (value && typeof value === 'object' && 'toBigInt' in value) {
            result[key] = Number(value.toBigInt());
        } else {
            result[key] = value;
        }
    }
    return result;
}
