import "server-only";
import crypto from "crypto";
import type { SealedCheck, Attestation } from "./partner-types";

// Seals opaque, authenticated + encrypted tokens so answer/attestation state is
// never readable or forgeable client-side. Stateless by design (no DB row, no
// session): the token IS the state.
//
// Two sealed payload types, DOMAIN-SEPARATED by a per-purpose HMAC label so a
// token minted for one purpose can never decrypt (nor be replayed) as the other:
//   - SealedCheck  — the comprehension-check answer (P0 finding on PR #346).
//   - Attestation  — proof the server saw a required-block submission (spec §8).
//     A completion attestation gates on-chain XP, so it is bound to
//     {lessonId, blockKey, userId, exp} and verified against the request.
const CHECK_LABEL = "ai-partner-check-seal-v1";
const ATTEST_LABEL = "ai-partner-attestation-seal-v1";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function deriveKey(label: string): Buffer {
  const base =
    process.env.AI_PARTNER_SEAL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) {
    // Enforce the invariant rather than assume it: an all-unset chain must never
    // HMAC the empty string — that would be a publicly-computable, forgeable key,
    // and this token now gates on-chain XP. Throwing surfaces the misconfig as a
    // 500 at the route instead of silently minting a forgeable seal.
    throw new Error(
      "check-seal: no seal secret (AI_PARTNER_SEAL_SECRET or SUPABASE_SERVICE_ROLE_KEY) configured"
    );
  }
  return crypto.createHmac("sha256", base).update(label).digest();
}

function isValidSealedCheck(value: unknown): value is SealedCheck {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.correctIndex === "number" &&
    Number.isInteger(v.correctIndex) &&
    v.correctIndex >= 0 &&
    v.correctIndex <= 2 &&
    typeof v.explanation === "string"
  );
}

function isValidAttestation(value: unknown): value is Attestation {
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return (
    typeof a.lessonId === "string" &&
    typeof a.blockKey === "string" &&
    typeof a.userId === "string" &&
    typeof a.exp === "number" &&
    Number.isFinite(a.exp)
  );
}

function seal(label: string, payload: unknown): string {
  const key = deriveKey(label);
  const iv = crypto.randomBytes(IV_LENGTH); // fresh per call — never reuse
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64url");
}

/**
 * Open a token sealed under `label`. Returns the decrypted plaintext string, or
 * `null` on any tamper/garbage/wrong-key failure (fails closed, never throws) —
 * except a missing-secret misconfiguration, which throws from `deriveKey`
 * (called before the try) so it surfaces as a 500, not a silent deny.
 */
function open(label: string, token: string): string | null {
  const key = deriveKey(label); // outside try: misconfig must throw, not silently deny
  try {
    const buf = Buffer.from(token, "base64url");
    if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) return null;
    const iv = buf.subarray(0, IV_LENGTH);
    const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export function sealCheck(payload: SealedCheck): string {
  return seal(CHECK_LABEL, payload);
}

export function openCheck(token: string): SealedCheck | null {
  const plaintext = open(CHECK_LABEL, token);
  if (plaintext === null) return null;
  try {
    const parsed: unknown = JSON.parse(plaintext);
    return isValidSealedCheck(parsed) ? parsed : null;
  } catch {
    // Any failure — malformed JSON or an out-of-range shape — fails closed.
    return null;
  }
}

export function sealAttestation(payload: Attestation): string {
  return seal(ATTEST_LABEL, payload);
}

/**
 * Verify an attestation token against the request it is meant to authorize.
 * Returns `true` only when the sealed payload matches lesson+block+user AND is
 * unexpired. A token sealed for a different lesson/block/user, an expired token,
 * a `SealedCheck` token (domain separation), or a tampered token all → `false`.
 */
export function openAttestation(
  token: string,
  expected: { lessonId: string; blockKey: string; userId: string }
): boolean {
  const plaintext = open(ATTEST_LABEL, token);
  if (plaintext === null) return false;
  try {
    const parsed: unknown = JSON.parse(plaintext);
    if (!isValidAttestation(parsed)) return false;
    return (
      parsed.lessonId === expected.lessonId &&
      parsed.blockKey === expected.blockKey &&
      parsed.userId === expected.userId &&
      parsed.exp > Date.now()
    );
  } catch {
    return false;
  }
}
