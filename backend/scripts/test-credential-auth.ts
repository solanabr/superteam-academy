import { strict as assert } from "node:assert";
import { generateKeyPairSync, sign } from "node:crypto";
import { createSignInMessage } from "@solana/wallet-standard-util";
import { createApp } from "../src/app.ts";

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const DUMMY_ACCOUNT = "11111111111111111111111111111111";

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
    action: "issue-credential" | "upgrade-credential";
    courseId: string;
  },
) {
  const req = new Request("http://local/auth/create-signin-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...params,
      lessonIndex: null,
    }),
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

async function issueCredential(
  app: ReturnType<typeof createApp>,
  body: unknown,
) {
  const req = new Request("http://local/issue-credential", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await app.request(req);
  return { status: res.status, body: await res.json() };
}

async function upgradeCredential(
  app: ReturnType<typeof createApp>,
  body: unknown,
) {
  const req = new Request("http://local/upgrade-credential", {
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

  // 1) Intent mismatch on issue endpoint.
  const upgradeChallenge = await createChallenge(app, {
    wallet,
    action: "upgrade-credential",
    courseId: "solana-101",
  });
  assert.equal(upgradeChallenge.status, 200);
  const upgradeOutput = buildSignedOutput({
    privateKey,
    wallet,
    publicKey: publicKeyBytes,
    input: upgradeChallenge.body.input,
  });
  const issueMismatch = await issueCredential(app, {
    courseId: "solana-101",
    trackCollection: DUMMY_ACCOUNT,
    credentialName: "L1",
    metadataUri: "https://example.com/metadata.json",
    coursesCompleted: 1,
    totalXp: "100",
    nonce: upgradeChallenge.body.nonce,
    output: upgradeOutput,
  });
  assert.equal(issueMismatch.status, 401);
  assert.equal(issueMismatch.body.error, "INTENT_MISMATCH");

  // 2) Learner tampering on issue endpoint.
  const issueChallenge = await createChallenge(app, {
    wallet,
    action: "issue-credential",
    courseId: "solana-101",
  });
  assert.equal(issueChallenge.status, 200);
  const issueOutput = buildSignedOutput({
    privateKey,
    wallet,
    publicKey: publicKeyBytes,
    input: issueChallenge.body.input,
  });
  const issueTampered = await issueCredential(app, {
    courseId: "solana-101",
    trackCollection: DUMMY_ACCOUNT,
    credentialName: "L1",
    metadataUri: "https://example.com/metadata.json",
    coursesCompleted: 1,
    totalXp: "100",
    nonce: issueChallenge.body.nonce,
    learner: DUMMY_ACCOUNT,
    output: issueOutput,
  });
  assert.equal(issueTampered.status, 401);
  assert.equal(issueTampered.body.error, "INVALID_WALLET_BINDING");

  // 3) Intent mismatch on upgrade endpoint.
  const issueChallengeForUpgrade = await createChallenge(app, {
    wallet,
    action: "issue-credential",
    courseId: "solana-101",
  });
  assert.equal(issueChallengeForUpgrade.status, 200);
  const issueOutputForUpgrade = buildSignedOutput({
    privateKey,
    wallet,
    publicKey: publicKeyBytes,
    input: issueChallengeForUpgrade.body.input,
  });
  const upgradeMismatch = await upgradeCredential(app, {
    courseId: "solana-101",
    trackCollection: DUMMY_ACCOUNT,
    credentialAsset: DUMMY_ACCOUNT,
    credentialName: "L2",
    metadataUri: "https://example.com/metadata-v2.json",
    coursesCompleted: 2,
    totalXp: "300",
    nonce: issueChallengeForUpgrade.body.nonce,
    output: issueOutputForUpgrade,
  });
  assert.equal(upgradeMismatch.status, 401);
  assert.equal(upgradeMismatch.body.error, "INTENT_MISMATCH");

  // 4) Learner tampering on upgrade endpoint.
  const upgradeChallengeForTamper = await createChallenge(app, {
    wallet,
    action: "upgrade-credential",
    courseId: "solana-101",
  });
  assert.equal(upgradeChallengeForTamper.status, 200);
  const upgradeOutputForTamper = buildSignedOutput({
    privateKey,
    wallet,
    publicKey: publicKeyBytes,
    input: upgradeChallengeForTamper.body.input,
  });
  const upgradeTampered = await upgradeCredential(app, {
    courseId: "solana-101",
    trackCollection: DUMMY_ACCOUNT,
    credentialAsset: DUMMY_ACCOUNT,
    credentialName: "L2",
    metadataUri: "https://example.com/metadata-v2.json",
    coursesCompleted: 2,
    totalXp: "300",
    nonce: upgradeChallengeForTamper.body.nonce,
    learner: DUMMY_ACCOUNT,
    output: upgradeOutputForTamper,
  });
  assert.equal(upgradeTampered.status, 401);
  assert.equal(upgradeTampered.body.error, "INVALID_WALLET_BINDING");

  console.log("Gate 8 credential auth-binding tests passed.");
}

run().catch((error) => {
  console.error("Gate 8 credential auth-binding tests failed.");
  console.error(error);
  process.exit(1);
});
