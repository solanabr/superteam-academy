'use client';

import { useCallback, useRef, useEffect } from 'react';

const DB_NAME = 'academy-offline';
const STORE_NAME = 'pending-actions';
const DB_VERSION = 1;

interface PendingAction {
    id: string;
    url: string;
    method: string;
    body: string;
    createdAt: number;
}

/**
 * Open (or create) the IndexedDB database for offline queue.
 */
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Store a failed API call in IndexedDB for later sync.
 */
async function queueAction(action: Omit<PendingAction, 'id' | 'createdAt'>): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const entry: PendingAction = {
        ...action,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
    };
    store.add(entry);
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Get all pending actions from IndexedDB.
 */
async function getPendingActions(): Promise<PendingAction[]> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Remove a synced action from IndexedDB.
 */
async function removeAction(id: string): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Replay all pending actions from IndexedDB.
 * Called on reconnect or by Background Sync.
 */
async function replayPendingActions(): Promise<{ synced: number; failed: number }> {
    const actions = await getPendingActions();
    let synced = 0;
    let failed = 0;

    for (const action of actions) {
        try {
            const res = await fetch(action.url, {
                method: action.method,
                headers: { 'Content-Type': 'application/json' },
                body: action.body,
            });
            if (res.ok) {
                await removeAction(action.id);
                synced++;
            } else {
                failed++;
            }
        } catch {
            failed++;
        }
    }

    return { synced, failed };
}

/**
 * Hook for offline-aware API calls with background sync.
 *
 * Usage:
 * ```
 * const { fetchWithSync } = useOfflineSync();
 * await fetchWithSync('/api/lessons/complete', { method: 'POST', body: JSON.stringify(data) });
 * ```
 *
 * If the fetch fails due to network, the request is queued in IndexedDB
 * and will be replayed via Background Sync or on reconnect.
 */
export function useOfflineSync() {
    const isSyncing = useRef(false);

    // Listen for online events to trigger replay
    useEffect(() => {
        const handleOnline = async () => {
            if (isSyncing.current) return;
            isSyncing.current = true;
            try {
                const result = await replayPendingActions();
                if (result.synced > 0) {
                    console.log(`[OfflineSync] Replayed ${result.synced} actions (${result.failed} failed)`);
                }
            } finally {
                isSyncing.current = false;
            }
        };

        window.addEventListener('online', handleOnline);
        // Also try to replay on mount in case we missed the online event
        if (navigator.onLine) handleOnline();

        return () => window.removeEventListener('online', handleOnline);
    }, []);

    /**
     * Fetch with offline fallback — queues to IndexedDB if network fails.
     */
    const fetchWithSync = useCallback(async (
        url: string,
        options: RequestInit = {}
    ): Promise<Response | null> => {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            // Network error — queue for background sync
            console.warn(`[OfflineSync] Network error for ${url}, queuing for sync`);

            await queueAction({
                url,
                method: options.method || 'POST',
                body: (options.body as string) || '{}',
            });

            // Register Background Sync if supported
            if ('serviceWorker' in navigator) {
                try {
                    const reg = await navigator.serviceWorker.ready;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if ('sync' in reg) await (reg as any).sync.register('progress-sync');
                } catch {
                    // Background Sync not supported — will retry on online event
                }
            }

            return null;
        }
    }, []);

    return { fetchWithSync, replayPendingActions };
}
