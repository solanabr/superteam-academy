import { strict as assert } from "node:assert";
import { generateKeyPairSync, sign } from "node:crypto";
import { createSignInMessage } from "@solana/wallet-standard-util";
import { createApp } from "../src/app.ts";
import { expireNonceForTest } from "../src/auth.ts";

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
  wallet: string,
  action: "complete-lesson" | "finalize-course",
  courseId: string,
  lessonIndex: number | null,
) {
  const req = new Request("http://local/auth/create-signin-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, action, courseId, lessonIndex }),
  });
  const res = await app.request(req);
  return { status: res.status, body: await res.json() };
}

async function verifyChallenge(
  app: ReturnType<typeof createApp>,
  nonce: string,
  payload: {
    address: string;
    publicKey: Uint8Array;
    signedMessage: Uint8Array;
    signature: Uint8Array;
  },
) {
  const req = new Request("http://local/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nonce,
      output: {
        account: {
          address: payload.address,
          publicKey: Array.from(payload.publicKey),
          chains: ["solana:devnet"],
          features: ["solana:signIn"],
        },
        signedMessage: Array.from(payload.signedMessage),
        signature: Array.from(payload.signature),
        signatureType: "ed25519",
      },
    }),
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

  // 1) Valid signature => 200
  const validChallenge = await createChallenge(
    app,
    wallet,
    "complete-lesson",
    "solana-101",
    1,
  );
  assert.equal(
    validChallenge.status,
    200,
    `Expected challenge creation success: ${JSON.stringify(validChallenge.body)}`,
  );
  const validMessage = createSignInMessage(validChallenge.body.input);
  const validSignature = sign(null, Buffer.from(validMessage), privateKey);
  const validResult = await verifyChallenge(app, validChallenge.body.nonce, {
    address: wallet,
    publicKey: publicKeyBytes,
    signedMessage: validMessage,
    signature: validSignature,
  });
  assert.equal(
    validResult.status,
    200,
    "Expected valid signature to return 200",
  );
  assert.equal(
    validResult.body.ok,
    true,
    "Expected ok=true for valid signature",
  );

  // 2) Wrong signature => 401
  const wrongChallenge = await createChallenge(
    app,
    wallet,
    "complete-lesson",
    "solana-101",
    2,
  );
  const wrongMessage = createSignInMessage(wrongChallenge.body.input);
  const wrongSignature = sign(null, Buffer.from(wrongMessage), privateKey);
  wrongSignature[0] ^= 0xff;
  const wrongResult = await verifyChallenge(app, wrongChallenge.body.nonce, {
    address: wallet,
    publicKey: publicKeyBytes,
    signedMessage: wrongMessage,
    signature: wrongSignature,
  });
  assert.equal(
    wrongResult.status,
    401,
    "Expected wrong signature to return 401",
  );
  assert.equal(wrongResult.body.error, "INVALID_SIGNATURE");

  // 3) Expired timestamp => 401
  const expiredChallenge = await createChallenge(
    app,
    wallet,
    "finalize-course",
    "solana-101",
    null,
  );
  expireNonceForTest(expiredChallenge.body.nonce);
  const expiredMessage = createSignInMessage(expiredChallenge.body.input);
  const expiredSignature = sign(null, Buffer.from(expiredMessage), privateKey);
  const expiredResult = await verifyChallenge(
    app,
    expiredChallenge.body.nonce,
    {
      address: wallet,
      publicKey: publicKeyBytes,
      signedMessage: expiredMessage,
      signature: expiredSignature,
    },
  );
  assert.equal(
    expiredResult.status,
    401,
    "Expected expired nonce to return 401",
  );
  assert.equal(expiredResult.body.error, "EXPIRED_MESSAGE");

  // 4) Reused nonce => 409
  const replayChallenge = await createChallenge(
    app,
    wallet,
    "complete-lesson",
    "solana-101",
    3,
  );
  const replayMessage = createSignInMessage(replayChallenge.body.input);
  const replaySignature = sign(null, Buffer.from(replayMessage), privateKey);
  const replayFirst = await verifyChallenge(app, replayChallenge.body.nonce, {
    address: wallet,
    publicKey: publicKeyBytes,
    signedMessage: replayMessage,
    signature: replaySignature,
  });
  assert.equal(replayFirst.status, 200, "Expected first nonce use to pass");

  const replaySecond = await verifyChallenge(app, replayChallenge.body.nonce, {
    address: wallet,
    publicKey: publicKeyBytes,
    signedMessage: replayMessage,
    signature: replaySignature,
  });
  assert.equal(
    replaySecond.status,
    409,
    "Expected replayed nonce to return 409",
  );
  assert.equal(replaySecond.body.error, "REPLAYED_NONCE");

  console.log("Gate 2 SIWS auth tests passed.");
}

run().catch((error) => {
  console.error("Gate 2 SIWS auth tests failed.");
  console.error(error);
  process.exit(1);
});
