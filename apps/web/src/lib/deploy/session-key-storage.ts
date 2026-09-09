import type { DeploymentState } from "@superteam-lms/deploy";

/**
 * Wallet-scoped `sessionStorage` for a deploy in progress — the resume offset,
 * and on the embedded path the session key that paid for it.
 *
 * ## Threat model for the encryption
 *
 * The session key is a spendable Solana key holding roughly the cost of one
 * devnet deploy. It has to survive a pause (that is the point: a resume must
 * not need a second funding transfer), and the only place it can survive is
 * this origin's `sessionStorage`.
 *
 * What the AES-GCM wrapper is for: a storage dump — a synced or backed-up
 * profile directory, a devtools/extension read of stored values, a support
 * screenshot — yields ciphertext, not a key. The wrapping key is derived by
 * HKDF from a 32-byte nonce generated per page load and never persisted, so
 * nothing on disk can decrypt it later.
 *
 * What it is NOT for, and cannot be: code already executing on this page. Such
 * code can read the in-memory nonce, or simply ask this module to decrypt. An
 * XSS on this origin owns the session key either way; encryption at rest does
 * not change that, and no browser-side scheme would.
 *
 * The in-memory nonce also means a full page reload loses the ability to
 * decrypt. The compiled binary lives in an in-memory cache too, so a reload
 * already forces a rebuild — and the panel warns before the transfer that it
 * strands whatever the key holds. What survives a reload is the session key's
 * ADDRESS: the record is kept, minus the parts that are now useless, so the
 * panel can name the account the (devnet, valueless) balance is sitting in
 * instead of forgetting it ever existed.
 */

const STORAGE_PREFIX = "deploy-state-";
const NONCE_BYTES = 32;
const IV_BYTES = 12;
const HKDF_INFO = "superteam-deploy-session-key";

export interface StoredDeployState {
  deployment: DeploymentState | null;
  /** AES-GCM ciphertext of the session key's 64-byte secret, or null. */
  session: string | null;
  /**
   * The session key's address — shown when a refund needs a retry, and kept
   * after a reload has taken the decryption nonce with it: it is then the only
   * record of where the learner's SOL went.
   */
  sessionAddress: string | null;
  /**
   * The funding transfer's signature, written before it was broadcast. A retry
   * asks the cluster about it rather than transferring a second time.
   */
  fundingSignature: string | null;
}

/**
 * Saved deploy state is scoped by wallet: a resume replays a buffer the PAYER
 * owns, so offering one learner's paused deploy to the next wallet on the same
 * browser is both a leak and a resume that cannot succeed.
 */
function storageKey(buildUuid: string, walletPrefix: string): string | null {
  if (!walletPrefix) return null;
  return `${STORAGE_PREFIX}${walletPrefix}-${buildUuid}`;
}

export function readDeployState(
  buildUuid: string,
  walletPrefix: string
): StoredDeployState | null {
  const key = storageKey(buildUuid, walletPrefix);
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    if ("deployment" in parsed) {
      const stored = parsed as Partial<StoredDeployState>;
      return {
        deployment: stored.deployment ?? null,
        session: typeof stored.session === "string" ? stored.session : null,
        sessionAddress:
          typeof stored.sessionAddress === "string"
            ? stored.sessionAddress
            : null,
        fundingSignature:
          typeof stored.fundingSignature === "string"
            ? stored.fundingSignature
            : null,
      };
    }
    // Pre-session-key shape: the DeploymentState written directly.
    return {
      deployment: parsed as DeploymentState,
      session: null,
      sessionAddress: null,
      fundingSignature: null,
    };
  } catch {
    return null;
  }
}

export function writeDeployState(
  buildUuid: string,
  walletPrefix: string,
  state: StoredDeployState
): void {
  const key = storageKey(buildUuid, walletPrefix);
  if (!key) return;
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // sessionStorage full or unavailable — non-critical.
  }
}

export function clearDeployState(
  buildUuid: string,
  walletPrefix: string
): void {
  const key = storageKey(buildUuid, walletPrefix);
  if (!key) return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

let wrappingNonce: Uint8Array | null = null;

function getNonce(): Uint8Array {
  if (!wrappingNonce) {
    wrappingNonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
  }
  return wrappingNonce;
}

async function deriveKey(buildUuid: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const base = await crypto.subtle.importKey(
    "raw",
    getNonce() as BufferSource,
    "HKDF",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      // The build this key belongs to, so a secret saved for one build can
      // never be decrypted into another build's deploy.
      salt: encoder.encode(buildUuid),
      info: encoder.encode(HKDF_INFO),
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Wrap a session key's secret for `sessionStorage`. Null if WebCrypto refuses. */
export async function encryptSessionKey(
  secret: number[],
  buildUuid: string
): Promise<string | null> {
  try {
    const key = await deriveKey(buildUuid);
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      Uint8Array.from(secret) as BufferSource
    );
    const packed = new Uint8Array(iv.length + ciphertext.byteLength);
    packed.set(iv, 0);
    packed.set(new Uint8Array(ciphertext), iv.length);
    return toBase64(packed);
  } catch {
    return null;
  }
}

/**
 * Unwrap a stored session key. Null when the page has been reloaded (the nonce
 * is gone), the ciphertext belongs to another build, or it was tampered with —
 * all of which the caller treats the same way: no resumable session.
 */
export async function decryptSessionKey(
  ciphertext: string,
  buildUuid: string
): Promise<number[] | null> {
  try {
    const packed = fromBase64(ciphertext);
    if (packed.length <= IV_BYTES) return null;
    const key = await deriveKey(buildUuid);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: packed.subarray(0, IV_BYTES) },
      key,
      packed.subarray(IV_BYTES) as BufferSource
    );
    const secret = Array.from(new Uint8Array(plain));
    return secret.length === 64 ? secret : null;
  } catch {
    return null;
  }
}
