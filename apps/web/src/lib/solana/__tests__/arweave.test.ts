/* eslint-disable import/order -- vi.mock() must sit between the vitest import
   and the module-under-test import (vitest hoists mocks), so imports can't be
   contiguous as import/order wants. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// `arweave.ts` is a server-only module that pulls in the UMI Irys uploader and
// the validated server env. Stub all three so the unit under test is just the
// secret parsing + graceful-fallback logic — no network, no env boot.
vi.mock("server-only", () => ({}));
// `serverEnv.ARWEAVE_UPLOADER_SECRET` is read live via a getter (not a frozen
// property) so each test's direct `process.env.ARWEAVE_UPLOADER_SECRET`
// mutation below is reflected — this file never calls `resetModules()`.
vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    SOLANA_RPC_URL: "https://api.devnet.solana.com",
    get ARWEAVE_UPLOADER_SECRET() {
      return process.env.ARWEAVE_UPLOADER_SECRET;
    },
  },
}));
// If a test ever reaches the uploader, fail loudly: the fallback paths must
// return BEFORE constructing UMI / hitting Irys.
const uploadJson = vi.fn((): string => {
  throw new Error("uploader should not be reached on the fallback path");
});
vi.mock("@metaplex-foundation/umi-bundle-defaults", () => ({
  createUmi: () => ({
    use: () => ({ use: () => ({ uploader: { uploadJson } }) }),
  }),
}));
vi.mock("@metaplex-foundation/umi", () => ({ keypairIdentity: () => ({}) }));
vi.mock("@metaplex-foundation/umi-web3js-adapters", () => ({
  fromWeb3JsKeypair: () => ({}),
}));
const irysUploader = vi.fn((_opts: { address: string }) => ({}));
vi.mock("@metaplex-foundation/umi-uploader-irys", () => ({
  irysUploader: (opts: { address: string }) => irysUploader(opts),
}));

import { Keypair } from "@solana/web3.js";
import { irysNodeFor, uploadCertificateMetadata } from "../arweave";

const METADATA = { name: "Test Credential", symbol: "STACAD" };

// A genuinely valid ed25519 secret key, so `getUploaderKeypair` accepts it and
// execution reaches the upload path (the URL guard). The UMI adapter is mocked,
// so this key is never used to sign anything.
const VALID_SECRET = JSON.stringify(Array.from(Keypair.generate().secretKey));

describe("uploadCertificateMetadata — graceful fallback", () => {
  const originalSecret = process.env.ARWEAVE_UPLOADER_SECRET;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    uploadJson.mockClear();
  });

  afterEach(() => {
    if (originalSecret === undefined)
      delete process.env.ARWEAVE_UPLOADER_SECRET;
    else process.env.ARWEAVE_UPLOADER_SECRET = originalSecret;
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("returns null (not throw) when the secret is absent", async () => {
    delete process.env.ARWEAVE_UPLOADER_SECRET;
    await expect(uploadCertificateMetadata(METADATA)).resolves.toBeNull();
    expect(uploadJson).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("returns null (not throw) when the secret is not valid JSON", async () => {
    process.env.ARWEAVE_UPLOADER_SECRET = "not-json-at-all";
    await expect(uploadCertificateMetadata(METADATA)).resolves.toBeNull();
    expect(uploadJson).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns null (not throw) when the secret is JSON but not 64 bytes", async () => {
    process.env.ARWEAVE_UPLOADER_SECRET = JSON.stringify([1, 2, 3]);
    await expect(uploadCertificateMetadata(METADATA)).resolves.toBeNull();
    expect(uploadJson).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns null (not throw) when the uploader returns a non-https URL", async () => {
    // Valid keypair → the upload path runs and reaches the URL guard.
    process.env.ARWEAVE_UPLOADER_SECRET = VALID_SECRET;
    // Malformed-but-non-throwing return must not be pinned on-chain.
    uploadJson.mockReturnValueOnce("ar://deadbeef");
    await expect(uploadCertificateMetadata(METADATA)).resolves.toBeNull();
    expect(uploadJson).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns the gateway URL when the uploader returns a valid https URL", async () => {
    process.env.ARWEAVE_UPLOADER_SECRET = VALID_SECRET;
    const gatewayUrl = "https://gateway.irys.xyz/abc123";
    uploadJson.mockReturnValueOnce(gatewayUrl);
    await expect(uploadCertificateMetadata(METADATA)).resolves.toBe(gatewayUrl);
    expect(uploadJson).toHaveBeenCalledTimes(1);
  });
});

describe("Irys node selection", () => {
  const originalNetwork = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  const originalSecret = process.env.ARWEAVE_UPLOADER_SECRET;
  const DEVNET_RPC = "https://api.devnet.solana.com";
  const MAINNET_RPC = "https://mainnet.helius-rpc.com/?api-key=x";
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalNetwork === undefined)
      delete process.env.NEXT_PUBLIC_SOLANA_NETWORK;
    else process.env.NEXT_PUBLIC_SOLANA_NETWORK = originalNetwork;
    if (originalSecret === undefined)
      delete process.env.ARWEAVE_UPLOADER_SECRET;
    else process.env.ARWEAVE_UPLOADER_SECRET = originalSecret;
    irysUploader.mockClear();
    warnSpy.mockRestore();
  });

  it.each(["mainnet", "mainnet-beta", " Mainnet-Beta "])(
    "uses the mainnet node for the label %j",
    (label) => {
      expect(irysNodeFor(label, MAINNET_RPC)).toBe("https://uploader.irys.xyz");
      expect(irysNodeFor(label, "https://rpc.example.com")).toBe(
        "https://uploader.irys.xyz"
      );
      expect(warnSpy).not.toHaveBeenCalled();
    }
  );

  it.each(["devnet", "", undefined])(
    "uses the devnet node for the label %j on a devnet RPC",
    (label) => {
      expect(irysNodeFor(label, DEVNET_RPC)).toBe("https://devnet.irys.xyz");
      expect(warnSpy).not.toHaveBeenCalled();
    }
  );

  it("uses mainnet and warns when the label says devnet but the RPC is mainnet", () => {
    expect(irysNodeFor("devnet", MAINNET_RPC)).toBe(
      "https://uploader.irys.xyz"
    );
    expect(irysNodeFor(undefined, "https://api.mainnet-beta.solana.com")).toBe(
      "https://uploader.irys.xyz"
    );
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("uses mainnet and warns when the label says mainnet but the RPC is devnet", () => {
    expect(irysNodeFor("mainnet", DEVNET_RPC)).toBe(
      "https://uploader.irys.xyz"
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('uploads through the mainnet node when the label is "mainnet"', async () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "mainnet";
    process.env.ARWEAVE_UPLOADER_SECRET = VALID_SECRET;
    uploadJson.mockReturnValueOnce("https://gateway.irys.xyz/abc123");
    await uploadCertificateMetadata(METADATA);
    expect(irysUploader).toHaveBeenCalledWith({
      address: "https://uploader.irys.xyz",
    });
  });
});
