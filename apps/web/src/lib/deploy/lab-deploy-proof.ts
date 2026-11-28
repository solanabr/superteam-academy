import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

/**
 * The proof that goes with a saved lab deploy: a signature by the program's
 * upgrade authority key (the learner's lab key) over a message that names who
 * saves which program for which lesson, and when.
 *
 * The browser signs with the user id it is signed in as. The server rebuilds
 * the message with the user id from the session, so a request captured from
 * one account does not verify for another.
 */

/** First line of every signed message. Nothing else signs under this prefix. */
export const LAB_DEPLOY_PROOF_DOMAIN = "superteam-academy:lab-deploy:v1";

/**
 * How far the proof's timestamp may be from the server clock, in either
 * direction: five minutes. Older proofs and proofs dated further ahead are
 * refused.
 */
export const LAB_DEPLOY_PROOF_WINDOW_MS = 5 * 60_000;

const SIGNATURE_BYTES = 64;
const PUBLIC_KEY_BYTES = 32;

export interface LabDeployClaim {
  userId: string;
  courseId: string;
  lessonId: string;
  programId: string;
}

/** What the save request carries beside the claim. No secret is in it. */
export interface LabDeployProof {
  /** The lab key's address, base58. */
  labPublicKey: string;
  /** Ed25519 signature over {@link labDeployProofMessage}, base58. */
  signature: string;
  /** When the proof was signed, in milliseconds since the epoch. */
  timestamp: number;
}

export interface LabDeployProofSigner {
  publicKey: PublicKey;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}

/**
 * The signed bytes: the domain line, then the claim as a JSON array. JSON
 * quotes each field, so no id can be shaped to read as two fields.
 */
export function labDeployProofMessage(
  claim: LabDeployClaim & { timestamp: number }
): Uint8Array {
  const payload = JSON.stringify([
    claim.userId,
    claim.courseId,
    claim.lessonId,
    claim.programId,
    claim.timestamp,
  ]);
  return new TextEncoder().encode(`${LAB_DEPLOY_PROOF_DOMAIN}\n${payload}`);
}

/** Signs a claim with the lab key. Runs in the browser. */
export async function signLabDeployProof(
  claim: LabDeployClaim,
  signer: LabDeployProofSigner,
  now: number = Date.now()
): Promise<LabDeployProof> {
  const signature = await signer.signMessage(
    labDeployProofMessage({ ...claim, timestamp: now })
  );
  return {
    labPublicKey: signer.publicKey.toBase58(),
    signature: bs58.encode(signature),
    timestamp: now,
  };
}

export type LabDeployProofFailure =
  | "malformed" // a field is missing, the wrong type or does not decode
  | "outside-window" // the timestamp is too old or too far ahead
  | "bad-signature"; // the key did not sign this claim

export type LabDeployProofResult =
  | { ok: true; labPublicKey: PublicKey }
  | { ok: false; reason: LabDeployProofFailure };

function decode(value: unknown, length: number): Uint8Array | null {
  if (typeof value !== "string") return null;
  try {
    const bytes = bs58.decode(value);
    return bytes.length === length ? bytes : null;
  } catch {
    return null;
  }
}

/**
 * Checks that the named key signed this claim inside the time window. The
 * caller builds `claim` itself, with the user id from the session.
 */
export function verifyLabDeployProof(
  claim: LabDeployClaim,
  proof: { labPublicKey?: unknown; signature?: unknown; timestamp?: unknown },
  now: number = Date.now()
): LabDeployProofResult {
  const publicKey = decode(proof.labPublicKey, PUBLIC_KEY_BYTES);
  const signature = decode(proof.signature, SIGNATURE_BYTES);
  const timestamp = proof.timestamp;
  if (
    !publicKey ||
    !signature ||
    typeof timestamp !== "number" ||
    !Number.isSafeInteger(timestamp)
  ) {
    return { ok: false, reason: "malformed" };
  }

  if (Math.abs(now - timestamp) > LAB_DEPLOY_PROOF_WINDOW_MS) {
    return { ok: false, reason: "outside-window" };
  }

  const message = labDeployProofMessage({ ...claim, timestamp });
  if (!nacl.sign.detached.verify(message, signature, publicKey)) {
    return { ok: false, reason: "bad-signature" };
  }
  return { ok: true, labPublicKey: new PublicKey(publicKey) };
}
