import type { DeploymentState } from "@superteam-lms/deploy";

/**
 * `sessionStorage` for a lab deploy in progress: how far the upload got, and
 * the compiled program it uploads. With both, a deploy that a pause or a page
 * reload interrupted resumes where it stopped. The lab key that pays for it is
 * kept elsewhere (`lib/solana/lab-keypair.ts`) and outlives the tab.
 *
 * A saved deploy belongs to one lab key and one lesson. A resume writes to a
 * buffer only that key controls, so it is never offered to another key.
 */

const STATE_PREFIX = "deploy-state-";
const BINARY_PREFIX = "deploy-binary-";
const BASE64_CHUNK = 0x8000;

export interface DeployStateScope {
  /** Start of the lab key's address. Empty means no key, so nothing is saved. */
  keyPrefix: string;
  courseId: string;
  lessonId: string;
}

function storageKey(prefix: string, scope: DeployStateScope): string | null {
  if (!scope.keyPrefix) return null;
  return `${prefix}${scope.keyPrefix}-${scope.courseId}-${scope.lessonId}`;
}

/**
 * The saved deploy as stored, or null. The value is whatever is in storage:
 * check it with `isResumableDeploymentState` before resuming into it.
 */
export function readDeployState(scope: DeployStateScope): unknown {
  const key = storageKey(STATE_PREFIX, scope);
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function writeDeployState(
  scope: DeployStateScope,
  state: DeploymentState
): void {
  const key = storageKey(STATE_PREFIX, scope);
  if (!key) return;
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // sessionStorage full or unavailable — non-critical.
  }
}

/** Removes the saved deploy and its program bytes. */
export function clearDeployState(scope: DeployStateScope): void {
  for (const prefix of [STATE_PREFIX, BINARY_PREFIX]) {
    const key = storageKey(prefix, scope);
    if (!key) continue;
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK));
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Keeps the compiled program for a deploy that is starting, so a reload can
 * resume it. Best effort: when storage has no room, the deploy still runs, and
 * a reload then needs a new build.
 */
export function saveDeployBinary(
  scope: DeployStateScope,
  buildUuid: string,
  bytes: Uint8Array
): void {
  const key = storageKey(BINARY_PREFIX, scope);
  if (!key) return;
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ buildUuid, base64: toBase64(bytes) })
    );
  } catch {
    // sessionStorage full or unavailable — non-critical.
  }
}

/** The stored program for `buildUuid`, or null. */
export function readDeployBinary(
  scope: DeployStateScope,
  buildUuid: string
): Uint8Array | null {
  const key = storageKey(BINARY_PREFIX, scope);
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { buildUuid?: unknown; base64?: unknown };
    if (parsed.buildUuid !== buildUuid || typeof parsed.base64 !== "string") {
      return null;
    }
    return fromBase64(parsed.base64);
  } catch {
    return null;
  }
}
