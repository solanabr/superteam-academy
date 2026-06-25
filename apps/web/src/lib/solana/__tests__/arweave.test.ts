import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// `arweave.ts` is a server-only module that pulls in the UMI Irys uploader and
// the validated server env. Stub all three so the unit under test is just the
// secret parsing + graceful-fallback logic — no network, no env boot.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { SOLANA_RPC_URL: "https://api.devnet.solana.com" },
}));
// If a test ever reaches the uploader, fail loudly: the fallback paths must
// return BEFORE constructing UMI / hitting Irys.
const uploadJson = vi.fn(() => {
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
vi.mock("@metaplex-foundation/umi-uploader-irys", () => ({
  irysUploader: () => ({}),
}));

import { uploadCertificateMetadata } from "../arweave";

const METADATA = { name: "Test Credential", symbol: "STACAD" };

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
    if (originalSecret === undefined) delete process.env.ARWEAVE_UPLOADER_SECRET;
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
});
