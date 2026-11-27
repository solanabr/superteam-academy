import { describe, expect, it } from "vitest";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";
import {
  LAB_DEPLOY_PROOF_DOMAIN,
  LAB_DEPLOY_PROOF_WINDOW_MS,
  labDeployProofMessage,
  signLabDeployProof,
  verifyLabDeployProof,
  type LabDeployClaim,
} from "../lab-deploy-proof";

const NOW = 1_800_000_000_000;
const labKey = Keypair.generate();
const programId = Keypair.generate().publicKey.toBase58();

const claim: LabDeployClaim = {
  userId: "user-1",
  courseId: "course-1",
  lessonId: "lesson-1",
  programId,
};

function signerFor(keypair: Keypair) {
  return {
    publicKey: keypair.publicKey,
    signMessage: async (message: Uint8Array) =>
      nacl.sign.detached(message, keypair.secretKey),
  };
}

async function proofFor(
  signed: LabDeployClaim = claim,
  keypair: Keypair = labKey,
  at: number = NOW
) {
  return signLabDeployProof(signed, signerFor(keypair), at);
}

describe("labDeployProofMessage", () => {
  it("starts with the fixed domain and binds every field of the claim", () => {
    const text = new TextDecoder().decode(
      labDeployProofMessage({ ...claim, timestamp: NOW })
    );
    const [domain, payload] = text.split("\n");
    expect(domain).toBe(LAB_DEPLOY_PROOF_DOMAIN);
    expect(JSON.parse(payload ?? "")).toEqual([
      "user-1",
      "course-1",
      "lesson-1",
      programId,
      NOW,
    ]);
  });

  it("gives different bytes when a field boundary moves", () => {
    const a = labDeployProofMessage({
      ...claim,
      courseId: 'a","b',
      lessonId: "c",
      timestamp: NOW,
    });
    const b = labDeployProofMessage({
      ...claim,
      courseId: "a",
      lessonId: 'b","c',
      timestamp: NOW,
    });
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });
});

describe("signLabDeployProof", () => {
  it("returns the public key, a base58 signature and the timestamp only", async () => {
    const proof = await proofFor();
    expect(Object.keys(proof).sort()).toEqual([
      "labPublicKey",
      "signature",
      "timestamp",
    ]);
    expect(proof.labPublicKey).toBe(labKey.publicKey.toBase58());
    expect(bs58.decode(proof.signature)).toHaveLength(64);
    expect(proof.timestamp).toBe(NOW);
  });
});

describe("verifyLabDeployProof", () => {
  it("accepts a proof signed by the key for this claim", async () => {
    const result = verifyLabDeployProof(claim, await proofFor(), NOW);
    expect(result).toEqual({ ok: true, labPublicKey: labKey.publicKey });
  });

  it("accepts a proof at each edge of the time window", async () => {
    const proof = await proofFor();
    expect(
      verifyLabDeployProof(claim, proof, NOW + LAB_DEPLOY_PROOF_WINDOW_MS).ok
    ).toBe(true);
    expect(
      verifyLabDeployProof(claim, proof, NOW - LAB_DEPLOY_PROOF_WINDOW_MS).ok
    ).toBe(true);
  });

  it("refuses a proof older than the window", async () => {
    const result = verifyLabDeployProof(
      claim,
      await proofFor(),
      NOW + LAB_DEPLOY_PROOF_WINDOW_MS + 1
    );
    expect(result).toEqual({ ok: false, reason: "outside-window" });
  });

  it("refuses a proof dated further in the future than the window", async () => {
    const result = verifyLabDeployProof(
      claim,
      await proofFor(),
      NOW - LAB_DEPLOY_PROOF_WINDOW_MS - 1
    );
    expect(result).toEqual({ ok: false, reason: "outside-window" });
  });

  it.each([
    ["user", { userId: "user-2" }],
    ["course", { courseId: "course-2" }],
    ["lesson", { lessonId: "lesson-2" }],
    ["program", { programId: Keypair.generate().publicKey.toBase58() }],
  ])("refuses a proof made for another %s", async (_name, change) => {
    const proof = await proofFor();
    const result = verifyLabDeployProof({ ...claim, ...change }, proof, NOW);
    expect(result).toEqual({ ok: false, reason: "bad-signature" });
  });

  it("refuses a proof whose timestamp was changed after signing", async () => {
    const proof = await proofFor();
    const result = verifyLabDeployProof(
      claim,
      { ...proof, timestamp: proof.timestamp + 1 },
      NOW
    );
    expect(result).toEqual({ ok: false, reason: "bad-signature" });
  });

  it("refuses a signature by a different key than the one named", async () => {
    const other = Keypair.generate();
    const proof = await proofFor(claim, other);
    const result = verifyLabDeployProof(
      claim,
      { ...proof, labPublicKey: labKey.publicKey.toBase58() },
      NOW
    );
    expect(result).toEqual({ ok: false, reason: "bad-signature" });
  });

  it.each([
    ["no signature", { signature: undefined }],
    ["a signature that is not base58", { signature: "not base58 !!" }],
    ["a signature of the wrong length", { signature: bs58.encode([1, 2, 3]) }],
    ["a signature that is not a string", { signature: 42 }],
    ["no public key", { labPublicKey: undefined }],
    ["a public key that is not base58", { labPublicKey: "0OIl" }],
    ["a public key of the wrong length", { labPublicKey: bs58.encode([1]) }],
    ["no timestamp", { timestamp: undefined }],
    ["a timestamp that is a string", { timestamp: String(NOW) }],
    ["a timestamp that is not an integer", { timestamp: NOW + 0.5 }],
  ])("refuses %s as malformed", async (_name, change) => {
    const proof = await proofFor();
    const result = verifyLabDeployProof(claim, { ...proof, ...change }, NOW);
    expect(result).toEqual({ ok: false, reason: "malformed" });
  });
});
