import { Keypair } from "@solana/web3.js";

/**
 * The lab keypair: one devnet key per signed-in user per browser. It pays for
 * and signs the learner's lab transactions, and stays the upgrade authority of
 * the programs it deploys.
 *
 * It is kept in `localStorage` as a plain 64-byte array, the same shape as a
 * Solana CLI keypair file, so a reload keeps it and the learner can export it.
 * It is not encrypted: it is a devnet key that holds only test SOL, and a key
 * stored beside the data would protect nothing.
 *
 * The secret stays in this browser. Nothing here sends it anywhere, and callers
 * must not put it in a request, a log line, an analytics event or an error.
 * Sign through `useLabKey()` (`hooks/use-lab-key.ts`), which signs only for the
 * lab connection and only after the devnet check.
 */

const STORAGE_PREFIX = "lab-keypair:";
const SEED_BYTES = 32;
const SECRET_BYTES = 64;

/** The key could not be written to browser storage, so none was created. */
export class LabKeyStorageError extends Error {
  constructor() {
    super("The lab key could not be saved in this browser.");
    this.name = "LabKeyStorageError";
  }
}

/** Storage is keyed on the user id: two accounts never share a key. */
export function labKeypairStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

const listeners = new Set<() => void>();

/**
 * Users who chose "forget this key" on this page load. The lab does not make
 * a new key for them until they start a lab action.
 */
const forgotten = new Set<string>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** Calls `listener` when a key is created or forgotten, here or in another tab. */
export function subscribeLabKeypair(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** The stored value as written, or null. Stable between changes. */
export function readStoredLabSecret(userId: string): string | null {
  try {
    return localStorage.getItem(labKeypairStorageKey(userId));
  } catch {
    return null;
  }
}

/** The keypair in a stored value, or null when the value is not a keypair. */
export function parseLabSecret(raw: string | null): Keypair | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== SECRET_BYTES) return null;
    if (!parsed.every((b) => Number.isInteger(b) && b >= 0 && b <= 255)) {
      return null;
    }
    // Throws when the public half does not match the secret half.
    return Keypair.fromSecretKey(Uint8Array.from(parsed as number[]));
  } catch {
    return null;
  }
}

/** This user's lab keypair in this browser, or null. */
export function readLabKeypair(userId: string): Keypair | null {
  return parseLabSecret(readStoredLabSecret(userId));
}

/**
 * This user's lab keypair, created on first use. A stored key is returned as
 * it is and never replaced. Throws {@link LabKeyStorageError} when the new key
 * cannot be stored: a key that a reload would lose must not receive SOL.
 */
export function createLabKeypair(userId: string): Keypair {
  const existing = readLabKeypair(userId);
  if (existing) {
    forgotten.delete(userId);
    return existing;
  }

  const seed = crypto.getRandomValues(new Uint8Array(SEED_BYTES));
  const keypair = Keypair.fromSeed(seed);
  try {
    localStorage.setItem(
      labKeypairStorageKey(userId),
      JSON.stringify(Array.from(keypair.secretKey))
    );
  } catch {
    throw new LabKeyStorageError();
  }
  // Another tab can write between the read and the write. Use what storage
  // holds now, so both tabs end on one key.
  const stored = readLabKeypair(userId);
  if (!stored) throw new LabKeyStorageError();
  forgotten.delete(userId);
  notify();
  return stored;
}

/** Deletes this user's lab keypair from this browser. It cannot be recovered. */
export function forgetLabKeypair(userId: string): void {
  try {
    localStorage.removeItem(labKeypairStorageKey(userId));
  } catch {
    // Storage is unavailable, so there is no key to delete.
  }
  forgotten.add(userId);
  notify();
}

export function wasLabKeypairForgotten(userId: string): boolean {
  return forgotten.has(userId);
}
