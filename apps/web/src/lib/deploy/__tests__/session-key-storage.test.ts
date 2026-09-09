// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { Keypair } from "@solana/web3.js";
import {
  clearDeployState,
  decryptSessionKey,
  encryptSessionKey,
  readDeployState,
  writeDeployState,
} from "../session-key-storage";

const BUILD = "build-uuid-123";
const WALLET = "B7o8NfV8";

beforeEach(() => {
  sessionStorage.clear();
});

describe("session-key encryption", () => {
  it("round-trips a session key secret", async () => {
    const secret = Array.from(Keypair.generate().secretKey);
    const ciphertext = await encryptSessionKey(secret, BUILD);

    expect(ciphertext).not.toBeNull();
    // Nothing recognisable from the secret survives into storage.
    expect(ciphertext).not.toContain(secret.slice(0, 8).join(","));
    expect(await decryptSessionKey(ciphertext!, BUILD)).toEqual(secret);
  });

  it("gives two encryptions of the same secret different ciphertexts", async () => {
    const secret = Array.from(Keypair.generate().secretKey);
    const a = await encryptSessionKey(secret, BUILD);
    const b = await encryptSessionKey(secret, BUILD);
    expect(a).not.toBe(b);
  });

  it("refuses a ciphertext bound to another build, or a tampered one", async () => {
    const secret = Array.from(Keypair.generate().secretKey);
    const ciphertext = (await encryptSessionKey(secret, BUILD))!;

    expect(await decryptSessionKey(ciphertext, "other-build")).toBeNull();
    expect(
      await decryptSessionKey(`AAAA${ciphertext.slice(4)}`, BUILD)
    ).toBeNull();
    expect(await decryptSessionKey("not-base64-at-all!!", BUILD)).toBeNull();
  });
});

describe("deploy state storage", () => {
  const deployment = {
    buildUuid: BUILD,
    bufferKeypairSecret: Array.from(Keypair.generate().secretKey),
    programKeypairSecret: Array.from(Keypair.generate().secretKey),
    lastUploadedChunk: 3,
    totalChunks: 10,
    phase: "uploading" as const,
  };

  it("round-trips the deployment, the wrapped key and its address", () => {
    writeDeployState(BUILD, WALLET, {
      deployment,
      session: "cipher",
      sessionAddress: "SessionAddr",
    });

    expect(readDeployState(BUILD, WALLET)).toEqual({
      deployment,
      session: "cipher",
      sessionAddress: "SessionAddr",
    });
    clearDeployState(BUILD, WALLET);
    expect(readDeployState(BUILD, WALLET)).toBeNull();
  });

  it("stays wallet-scoped and reads back a pre-session-key record", () => {
    writeDeployState(BUILD, WALLET, {
      deployment,
      session: null,
      sessionAddress: null,
    });
    expect(readDeployState(BUILD, "9WzDXwBb")).toBeNull();

    // The shape written before session keys existed: the DeploymentState alone.
    sessionStorage.setItem(
      `deploy-state-${WALLET}-legacy`,
      JSON.stringify(deployment)
    );
    expect(readDeployState("legacy", WALLET)).toEqual({
      deployment,
      session: null,
      sessionAddress: null,
    });
  });
});
