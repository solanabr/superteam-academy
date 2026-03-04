import { PublicKey } from "@solana/web3.js";
import { createPublicKey, verify } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ActionName,
  ActionProof,
  parseActionProofPayload,
} from "@/lib/action-proof";

const PROOF_MAX_AGE_MS = 5 * 60 * 1000;

function decodeBase64ToUint8Array(value: string): Uint8Array | null {
  try {
    const raw = Buffer.from(value, "base64");
    return new Uint8Array(raw);
  } catch {
    return null;
  }
}

function verifyEd25519Signature(params: {
  message: string;
  signature: Uint8Array;
  publicKeyBytes: Uint8Array;
}): boolean {
  const { message, signature, publicKeyBytes } = params;

  // ASN.1 SPKI prefix for Ed25519 public keys.
  const ed25519SpkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
  const keyData = Buffer.concat([ed25519SpkiPrefix, Buffer.from(publicKeyBytes)]);

  try {
    const keyObject = createPublicKey({ key: keyData, format: "der", type: "spki" });
    return verify(null, Buffer.from(message, "utf8"), keyObject, Buffer.from(signature));
  } catch {
    return false;
  }
}

function sameHost(urlLike: string, host: string): boolean {
  try {
    const parsed = new URL(urlLike);
    return parsed.host === host;
  } catch {
    return false;
  }
}

export function requireSameOrigin(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host");
  if (!host) {
    return NextResponse.json({ error: "MISSING_HOST_HEADER" }, { status: 400 });
  }

  const origin = request.headers.get("origin");
  if (origin) {
    if (!sameHost(origin, host)) {
      return NextResponse.json({ error: "FORBIDDEN_ORIGIN" }, { status: 403 });
    }
    return null;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    if (!sameHost(referer, host)) {
      return NextResponse.json({ error: "FORBIDDEN_ORIGIN" }, { status: 403 });
    }
    return null;
  }

  // Local CLI tooling/curl can omit origin headers. Keep dev flexible.
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return NextResponse.json({ error: "FORBIDDEN_ORIGIN" }, { status: 403 });
}

export function requireDiagnosticsAccess(
  request: NextRequest,
): NextResponse | null {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const token = process.env.INTERNAL_DIAGNOSTICS_TOKEN;
  const provided = request.headers.get("x-internal-diagnostics-token");

  if (!token || !provided || provided !== token) {
    // Return 404 to avoid advertising diagnostics endpoints in production.
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return null;
}

export function verifyWalletActionProof(input: {
  proof: ActionProof | undefined;
  action: ActionName;
  learner: string;
  courseId: string;
  lessonIndex?: number;
}): boolean {
  const { proof, action, learner, courseId, lessonIndex } = input;
  if (!proof || typeof proof.message !== "string" || typeof proof.signature !== "string") {
    return false;
  }

  const payload = parseActionProofPayload(proof.message);
  if (!payload) return false;

  if (payload.action !== action) return false;
  if (payload.learner !== learner) return false;
  if (payload.courseId !== courseId) return false;

  if (typeof lessonIndex === "number") {
    if (payload.lessonIndex !== lessonIndex) return false;
  } else if (payload.lessonIndex !== undefined) {
    return false;
  }

  const ageMs = Math.abs(Date.now() - payload.ts);
  if (ageMs > PROOF_MAX_AGE_MS) return false;

  let learnerPubkey: PublicKey;
  try {
    learnerPubkey = new PublicKey(learner);
  } catch {
    return false;
  }

  const signatureBytes = decodeBase64ToUint8Array(proof.signature);
  if (!signatureBytes) return false;

  return verifyEd25519Signature({
    message: proof.message,
    signature: signatureBytes,
    publicKeyBytes: learnerPubkey.toBytes(),
  });
}
