import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted spies so the module mocks can reference them.
const h = vi.hoisted(() => ({
  mintTo: vi.fn(),
  getOrCreateAssociatedTokenAccount: vi.fn(),
  getAccount: vi.fn(),
  getAssociatedTokenAddressSync: vi.fn(() => ({ toBase58: () => "ATA" })),
  burn: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { SOLANA_RPC_URL: "https://rpc.test" },
}));
vi.mock("@solana/web3.js", () => ({
  // Classes so `new Connection(...)` / `new PublicKey(...)` are constructable
  // (an arrow-backed vi.fn throws "is not a constructor" under `new`).
  Connection: class {
    constructor(_url: string, _commitment: string) {}
  },
  Keypair: {
    fromSecretKey: vi.fn(() => ({ publicKey: { toBase58: () => "AUTH" } })),
  },
  PublicKey: class {
    constructor(public value: string) {}
    toBase58() {
      return this.value;
    }
  },
}));
vi.mock("@solana/spl-token", () => ({
  TOKEN_2022_PROGRAM_ID: "TOKEN2022",
  mintTo: h.mintTo,
  getOrCreateAssociatedTokenAccount: h.getOrCreateAssociatedTokenAccount,
  getAccount: h.getAccount,
  getAssociatedTokenAddressSync: h.getAssociatedTokenAddressSync,
  burn: h.burn,
}));

// 64-byte fake secret key (valid JSON array — Keypair.fromSecretKey is mocked).
const VALID_SECRET = JSON.stringify(
  Array.from({ length: 64 }, (_, i) => i % 251)
);

// Reset the module each time so the lazy `_initialized` singleton re-reads env.
async function loadXpMint(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return import("../xp-mint");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("mintXpToWallet", () => {
  it("reports not-configured when the authority secret is missing", async () => {
    const { mintXpToWallet } = await loadXpMint({
      NEXT_PUBLIC_XP_MINT_ADDRESS: "MINT",
      XP_MINT_AUTHORITY_SECRET: undefined,
    });
    const res = await mintXpToWallet("WALLET", 50);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not configured/i);
    expect(h.getOrCreateAssociatedTokenAccount).not.toHaveBeenCalled();
    expect(h.mintTo).not.toHaveBeenCalled();
  });

  it("reports not-configured when the mint address is missing", async () => {
    const { mintXpToWallet } = await loadXpMint({
      NEXT_PUBLIC_XP_MINT_ADDRESS: undefined,
      XP_MINT_AUTHORITY_SECRET: VALID_SECRET,
    });
    expect((await mintXpToWallet("WALLET", 1)).success).toBe(false);
  });

  it("treats an unparseable authority secret as not-configured", async () => {
    const { mintXpToWallet } = await loadXpMint({
      NEXT_PUBLIC_XP_MINT_ADDRESS: "MINT",
      XP_MINT_AUTHORITY_SECRET: "not-json",
    });
    expect((await mintXpToWallet("WALLET", 5)).success).toBe(false);
    expect(h.mintTo).not.toHaveBeenCalled();
  });

  it("mints via Token-2022 and returns the signature + amount", async () => {
    h.getOrCreateAssociatedTokenAccount.mockResolvedValue({
      address: { toBase58: () => "ATA" },
    });
    h.mintTo.mockResolvedValue("mint-sig");

    const { mintXpToWallet } = await loadXpMint({
      NEXT_PUBLIC_XP_MINT_ADDRESS: "MINT",
      XP_MINT_AUTHORITY_SECRET: VALID_SECRET,
    });
    const res = await mintXpToWallet("WALLET", 50);

    expect(res).toEqual({ success: true, signature: "mint-sig", amount: 50 });
    const mintArgs = h.mintTo.mock.calls[0];
    expect(mintArgs).toContain(50); // amount
    expect(mintArgs).toContain("TOKEN2022"); // Token-2022 program id
  });

  it("returns the error message when mintTo throws", async () => {
    h.getOrCreateAssociatedTokenAccount.mockResolvedValue({ address: {} });
    h.mintTo.mockRejectedValue(new Error("rpc down"));

    const { mintXpToWallet } = await loadXpMint({
      NEXT_PUBLIC_XP_MINT_ADDRESS: "MINT",
      XP_MINT_AUTHORITY_SECRET: VALID_SECRET,
    });
    expect(await mintXpToWallet("WALLET", 10)).toEqual({
      success: false,
      error: "rpc down",
    });
  });
});

describe("burnXpFromWallet", () => {
  it("skips the burn when the balance is zero", async () => {
    h.getAccount.mockResolvedValue({ amount: 0n });
    const { burnXpFromWallet } = await loadXpMint({
      NEXT_PUBLIC_XP_MINT_ADDRESS: "MINT",
      XP_MINT_AUTHORITY_SECRET: VALID_SECRET,
    });
    expect(await burnXpFromWallet("WALLET")).toEqual({
      success: true,
      amount: 0,
    });
    expect(h.burn).not.toHaveBeenCalled();
  });

  it("returns 0 (no burn) when the ATA does not exist", async () => {
    h.getAccount.mockRejectedValue(new Error("could not find account"));
    const { burnXpFromWallet } = await loadXpMint({
      NEXT_PUBLIC_XP_MINT_ADDRESS: "MINT",
      XP_MINT_AUTHORITY_SECRET: VALID_SECRET,
    });
    expect(await burnXpFromWallet("WALLET")).toEqual({
      success: true,
      amount: 0,
    });
    expect(h.burn).not.toHaveBeenCalled();
  });

  it("burns the full balance and returns the amount", async () => {
    h.getAccount.mockResolvedValue({ amount: 123n });
    h.burn.mockResolvedValue("burn-sig");
    const { burnXpFromWallet } = await loadXpMint({
      NEXT_PUBLIC_XP_MINT_ADDRESS: "MINT",
      XP_MINT_AUTHORITY_SECRET: VALID_SECRET,
    });
    const res = await burnXpFromWallet("WALLET");
    expect(res).toEqual({ success: true, signature: "burn-sig", amount: 123 });
    expect(h.burn.mock.calls[0]).toContain(123); // burns the full balance
  });
});
