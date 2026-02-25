import { randomUUID } from "crypto";

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** In-memory nonce store. Each nonce is valid for a single use within TTL. */
const store = new Map<string, { expiresAt: number }>();

function pruneExpired() {
  const now = Date.now();
  for (const [nonce, { expiresAt }] of store) {
    if (now >= expiresAt) store.delete(nonce);
  }
}

/** Generate a new nonce and return it. */
export function createNonce(): string {
  pruneExpired();
  const nonce = randomUUID();
  store.set(nonce, { expiresAt: Date.now() + NONCE_TTL_MS });
  return nonce;
}

/** Consume and validate a nonce. Single-use: deleted after successful validation. */
export function consumeNonce(nonce: string): boolean {
  pruneExpired();
  const entry = store.get(nonce);
  if (!entry) return false;
  if (Date.now() >= entry.expiresAt) {
    store.delete(nonce);
    return false;
  }
  store.delete(nonce);
  return true;
}
