import { strict as assert } from "node:assert";
import { generateKeyPairSync, sign } from "node:crypto";
import { createSignInMessage } from "@solana/wallet-standard-util";
import { createApp } from "../src/app.ts";

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase58(bytes: Uint8Array): string {
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) + BigInt(byte);
  }

  let out = "";
  while (value > 0n) {
    const mod = Number(value % 58n);
    out = BASE58_ALPHABET[mod] + out;
    value /= 58n;
  }

  for (let i = 0; i < bytes.length && bytes[i] === 0; i += 1) out = `1${out}`;
  return out || "1";
}

function extractRawEd25519PublicKey(spkiDer: Buffer): Uint8Array {
  if (spkiDer.length < 32) throw new Error("Invalid SPKI public key");
  return spkiDer.subarray(spkiDer.length - 32);
}

async function createChallenge(
  app: ReturnType<typeof createApp>,
  params: {
    wallet: string;
    action: "complete-lesson" | "finalize-course";
    courseId: string;
    lessonIndex: number | null;
  },
) {
  const req = new Request("http://local/auth/create-signin-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const res = await app.request(req);
  return { status: res.status, body: await res.json() };
}

function buildSignedOutput(params: {
  privateKey: ReturnType<typeof generateKeyPairSync>["privateKey"];
  wallet: string;
  publicKey: Uint8Array;
  input: unknown;
}) {
  const message = createSignInMessage(params.input);
  const signature = sign(null, Buffer.from(message), params.privateKey);
  return {
    account: {
      address: params.wallet,
      publicKey: Array.from(params.publicKey),
      chains: ["solana:devnet"],
      features: ["solana:signIn"],
    },
    signedMessage: Array.from(message),
    signature: Array.from(signature),
    signatureType: "ed25519" as const,
  };
}

async function completeLesson(
  app: ReturnType<typeof createApp>,
  body: unknown,
) {
  const req = new Request("http://local/complete-lesson", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await app.request(req);
  return { status: res.status, body: await res.json() };
}

async function run() {
  const app = createApp({
    corsOrigin: "http://localhost:3000",
    authDomain: "localhost",
    authUri: "http://localhost:3000",
    authChainId: "solana:devnet",
  });

  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const publicKeyBytes = extractRawEd25519PublicKey(
    publicKey.export({ format: "der", type: "spki" }) as Buffer,
  );
  const wallet = encodeBase58(publicKeyBytes);

  // 1) Intent mismatch: finalize challenge used on complete endpoint => 401
  const finalizeChallenge = await createChallenge(app, {
    wallet,
    action: "finalize-course",
    courseId: "solana-101",
    lessonIndex: null,
  });
  assert.equal(finalizeChallenge.status, 200);
  const finalizeOutput = buildSignedOutput({
    privateKey,
    wallet,
    publicKey: publicKeyBytes,
    input: finalizeChallenge.body.input,
  });
  const mismatchResult = await completeLesson(app, {
    courseId: "solana-101",
    lessonIndex: 1,
    nonce: finalizeChallenge.body.nonce,
    output: finalizeOutput,
  });
  assert.equal(mismatchResult.status, 401);
  assert.equal(mismatchResult.body.error, "INTENT_MISMATCH");

  // 2) Learner tampering: body learner differs from verified wallet => 401
  const completeChallenge = await createChallenge(app, {
    wallet,
    action: "complete-lesson",
    courseId: "solana-101",
    lessonIndex: 2,
  });
  assert.equal(completeChallenge.status, 200);
  const completeOutput = buildSignedOutput({
    privateKey,
    wallet,
    publicKey: publicKeyBytes,
    input: completeChallenge.body.input,
  });
  const tamperedResult = await completeLesson(app, {
    courseId: "solana-101",
    lessonIndex: 2,
    nonce: completeChallenge.body.nonce,
    learner: "11111111111111111111111111111111",
    output: completeOutput,
  });
  assert.equal(tamperedResult.status, 401);
  assert.equal(tamperedResult.body.error, "INVALID_WALLET_BINDING");

  console.log("Gate 4 auth-binding tests passed.");
}

run().catch((error) => {
  console.error("Gate 4 auth-binding tests failed.");
  console.error(error);
  process.exit(1);
});
