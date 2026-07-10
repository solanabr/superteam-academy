import "server-only";
import crypto from "crypto";
import type { SealedCheck } from "./partner-types";

// Seals the comprehension-check answer (`correctIndex` + `explanation`) into
// an opaque token so the `propose` HTTP response never carries the answer to
// the browser (P0 finding on PR #346 — the client-side compare was cosmetic,
// visible in the network tab). The server later opens the token in
// `/api/ai/partner/verify` to grade the learner's pick.
//
// Stateless by design (no DB row, no session): the token IS the state,
// authenticated + encrypted so it can't be read or forged client-side.
//
// Key derivation is purpose-separated (HMAC with a fixed label) so this key
// can never collide with another use of the same base secret elsewhere in
// the app. AI_PARTNER_SEAL_SECRET is optional and dedicated; if unset, the
// key derives from SUPABASE_SERVICE_ROLE_KEY, which is always present (the
// route can't run without it) and always high-entropy — so an unset base
// still yields a strong key in practice, never a silently-empty one.
const SEAL_LABEL = "ai-partner-check-seal-v1";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function deriveKey(): Buffer {
  const base =
    process.env.AI_PARTNER_SEAL_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  return crypto.createHmac("sha256", base).update(SEAL_LABEL).digest();
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

export function sealCheck(payload: SealedCheck): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH); // fresh per call — never reuse
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64url");
}

export function openCheck(token: string): SealedCheck | null {
  try {
    const buf = Buffer.from(token, "base64url");
    if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) return null;

    const iv = buf.subarray(0, IV_LENGTH);
    const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const key = deriveKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");

    const parsed: unknown = JSON.parse(plaintext);
    if (!isValidSealedCheck(parsed)) return null;
    return parsed;
  } catch {
    // Any failure — tamper (bad auth tag), garbage input, malformed JSON, or
    // an out-of-range shape — fails closed to null. Never throw.
    return null;
  }
}
