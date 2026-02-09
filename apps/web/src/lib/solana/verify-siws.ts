import {
  verifySIWSSignature,
  isMessageExpired,
  parsePublicKeyFromAddress,
} from "@/lib/solana/wallet-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Message parsing helpers ───────────────────────────────────────────

function parseExpirationFromMessage(message: string): string | null {
  const match = message.match(/Expiration Time: (.+)/);
  return match?.[1] ?? null;
}

function parseIssuedAtFromMessage(message: string): string | null {
  const match = message.match(/Issued At: (.+)/);
  return match?.[1] ?? null;
}

function parseNonceFromMessage(message: string): string | null {
  const match = message.match(/Nonce: (.+)/);
  return match?.[1] ?? null;
}

function parseDomainFromMessage(message: string): string | null {
  const match = message.match(/^(.+?) wants you to sign in/);
  return match?.[1] ?? null;
}

function parseAddressFromMessage(message: string): string | null {
  const lines = message.split("\n");
  return lines[1]?.trim() ?? null;
}

// ── Nonce lifecycle (server-issued) ──────────────────────────────────

const MAX_EXPIRATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ISSUED_AT_AGE_MS = 5 * 60 * 1000; // 5 minutes
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Checks that a nonce exists with status='pending' and is not expired.
 * Does NOT consume it — that happens after all validations pass.
 */
async function checkNoncePending(nonce: string): Promise<boolean> {
  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin
    .from("siws_nonces")
    .select("nonce, status, created_at")
    .eq("nonce", nonce)
    .maybeSingle();

  if (error) {
    console.error("[SIWS] Nonce lookup error:", error.message);
    return false; // Fail closed
  }

  if (!data) return false; // Nonce doesn't exist (not server-issued)

  if (data.status !== "pending") return false; // Already consumed

  // Check TTL
  const age = Date.now() - new Date(data.created_at).getTime();
  if (age > NONCE_TTL_MS) return false;

  return true;
}

/**
 * Atomically marks a nonce as consumed. The WHERE status='pending'
 * guard prevents double-consumption even under concurrent requests.
 */
async function consumeNonce(
  nonce: string,
  walletAddress: string
): Promise<boolean> {
  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin
    .from("siws_nonces")
    .update({
      status: "consumed",
      consumed_at: new Date().toISOString(),
      wallet_address: walletAddress,
    })
    .eq("nonce", nonce)
    .eq("status", "pending")
    .select("nonce")
    .maybeSingle();

  if (error) {
    console.error("[SIWS] Nonce consumption error:", error.message);
    return false;
  }

  // If no row was updated, someone else consumed it first
  return !!data;
}

// ── Public API ────────────────────────────────────────────────────────

interface VerifySIWSParams {
  message: string;
  signature: number[];
  publicKey: string;
  expectedHost: string;
}

export type VerifySIWSResult =
  | { success: true }
  | { success: false; error: string; statusCode: number };

/**
 * Verifies a SIWS (Sign In With Solana) request.
 *
 * Validation order:
 *   1. Parse message fields
 *   2. Time-based checks (expiration, age, window)
 *   3. Nonce pending check (BEFORE signature — so failed sigs don't burn it)
 *   4. Domain match
 *   5. Address match
 *   6. Ed25519 signature verification
 *   7. Consume nonce (ONLY after all validations pass)
 */
export async function verifySIWSRequest(
  params: VerifySIWSParams
): Promise<VerifySIWSResult> {
  const { message, signature, publicKey, expectedHost } = params;

  if (!message || !signature || !publicKey) {
    return {
      success: false,
      error: "Missing required fields",
      statusCode: 400,
    };
  }

  // ── 1. Parse message fields ──

  const expiration = parseExpirationFromMessage(message);
  if (!expiration) {
    return {
      success: false,
      error: "Missing expiration time",
      statusCode: 400,
    };
  }

  const nonce = parseNonceFromMessage(message);
  if (!nonce) {
    return { success: false, error: "Missing nonce", statusCode: 400 };
  }

  const messageDomain = parseDomainFromMessage(message);
  if (!messageDomain) {
    return { success: false, error: "Missing domain", statusCode: 400 };
  }

  const messageAddress = parseAddressFromMessage(message);
  if (!messageAddress) {
    return { success: false, error: "Missing address", statusCode: 400 };
  }

  // ── 2. Time-based validations ──

  if (isMessageExpired(expiration)) {
    return { success: false, error: "Message expired", statusCode: 400 };
  }

  const issuedAt = parseIssuedAtFromMessage(message);
  if (issuedAt) {
    const issuedDate = new Date(issuedAt);
    const expiryDate = new Date(expiration);
    const window = expiryDate.getTime() - issuedDate.getTime();
    if (window > MAX_EXPIRATION_WINDOW_MS) {
      return {
        success: false,
        error: "Expiration window too long",
        statusCode: 400,
      };
    }

    const age = Date.now() - issuedDate.getTime();
    if (age > MAX_ISSUED_AT_AGE_MS) {
      return { success: false, error: "Message too old", statusCode: 400 };
    }
  }

  // ── 3. Nonce pending check (before signature) ──

  const noncePending = await checkNoncePending(nonce);
  if (!noncePending) {
    return {
      success: false,
      error: "Invalid or expired nonce",
      statusCode: 401,
    };
  }

  // ── 4. Domain validation ──

  if (messageDomain !== expectedHost) {
    return { success: false, error: "Domain mismatch", statusCode: 400 };
  }

  // ── 5. Address match ──

  if (messageAddress !== publicKey) {
    return { success: false, error: "Address mismatch", statusCode: 400 };
  }

  // ── 6. Ed25519 signature verification ──

  const pubKeyBytes = parsePublicKeyFromAddress(publicKey);
  const signatureBytes = new Uint8Array(signature);

  const isValid = verifySIWSSignature({
    message,
    signature: signatureBytes,
    publicKey: pubKeyBytes,
  });

  if (!isValid) {
    return { success: false, error: "Invalid signature", statusCode: 401 };
  }

  // ── 7. Consume nonce (all validations passed) ──

  const consumed = await consumeNonce(nonce, publicKey);
  if (!consumed) {
    return {
      success: false,
      error: "Nonce consumption failed",
      statusCode: 500,
    };
  }

  return { success: true };
}
