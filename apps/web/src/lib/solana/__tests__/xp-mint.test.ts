import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted spies so the module mocks can reference them.
const h = vi.hoisted(() => ({
  createAta: vi.fn((..._args: unknown[]) => ({ ix: "create-ata" })),
  createMintTo: vi.fn((..._args: unknown[]) => ({ ix: "mint-to" })),
  sendPlatformTransaction: vi.fn(),
  resolveFeePayer: vi.fn(),
  getAccount: vi.fn(),
  getAssociatedTokenAddressSync: vi.fn(() => ({ toBase58: () => "ATA" })),
  burn: vi.fn(),
  ensureXpTokenAccount: vi.fn(),
}));

vi.mock("server-only", () => ({}));
// `serverEnv.XP_MINT_AUTHORITY_SECRET` is read live via a getter (not a frozen
// property) so `loadXpMint`'s per-test `process.env` mutation + `resetModules()`
// is reflected regardless of whether vitest re-invokes this factory on reimport.
vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    SOLANA_RPC_URL: "https://rpc.test",
    get XP_MINT_AUTHORITY_SECRET() {
      return process.env.XP_MINT_AUTHORITY_SECRET;
    },
  },
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
  Transaction: class {
    instructions: unknown[] = [];
    add(...ixs: unknown[]) {
      this.instructions.push(...ixs);
      return this;
    }
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
  createAssociatedTokenAccountIdempotentInstruction: h.createAta,
  createMintToInstruction: h.createMintTo,
  getAccount: h.getAccount,
  getAssociatedTokenAddressSync: h.getAssociatedTokenAddressSync,
  burn: h.burn,
}));

vi.mock("../sponsor", () => ({ resolveFeePayer: h.resolveFeePayer }));
vi.mock("../platform-tx", () => ({
  sendPlatformTransaction: h.sendPlatformTransaction,
}));
vi.mock("../xp-token-account", () => ({
  ensureXpTokenAccount: h.ensureXpTokenAccount,
}));

const SPONSOR = {
  keypair: { publicKey: { toBase58: () => "SPONSOR" } },
  role: "sponsor",
};

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
  h.resolveFeePayer.mockResolvedValue(SPONSOR);
  h.ensureXpTokenAccount.mockResolvedValue({ toBase58: () => "ATA" });
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
    expect(h.sendPlatformTransaction).not.toHaveBeenCalled();
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
    expect(h.sendPlatformTransaction).not.toHaveBeenCalled();
  });

  it("mints via Token-2022 in a sponsor-paid tx with no create, and returns the signature + amount", async () => {
    h.sendPlatformTransaction.mockResolvedValue("mint-sig");

    const { mintXpToWallet } = await loadXpMint({
      NEXT_PUBLIC_XP_MINT_ADDRESS: "MINT",
      XP_MINT_AUTHORITY_SECRET: VALID_SECRET,
    });
    const res = await mintXpToWallet("WALLET", 50);

    expect(res).toEqual({ success: true, signature: "mint-sig", amount: 50 });
    const mintArgs = h.createMintTo.mock.calls[0];
    expect(mintArgs).toContain(50); // amount
    expect(mintArgs).toContain("TOKEN2022"); // Token-2022 program id
    // The token account goes through the one funding helper, paid by the
    // sponsor; the mint transaction itself creates nothing.
    const [, owner, mint, payer] = h.ensureXpTokenAccount.mock.calls[0] as [
      unknown,
      { toBase58: () => string },
      { toBase58: () => string },
      unknown,
    ];
    expect(owner.toBase58()).toBe("WALLET");
    expect(mint.toBase58()).toBe("MINT");
    expect(payer).toBe(SPONSOR);
    expect(h.createAta).not.toHaveBeenCalled();
    const [, tx, options] = h.sendPlatformTransaction.mock.calls[0] as [
      unknown,
      { instructions: unknown[] },
      { feePayer: unknown; computeUnits: number; context: unknown },
    ];
    expect(tx.instructions).toEqual([{ ix: "mint-to" }]);
    expect(options.feePayer).toBe(SPONSOR);
    expect(options.computeUnits).toBe(60_000);
    expect(options.context).toEqual({ action: "xp_mint", wallet: "WALLET" });
  });

  it("reports a closed XP account as its own reason and sends nothing", async () => {
    const { mintXpToWallet } = await loadXpMint({
      NEXT_PUBLIC_XP_MINT_ADDRESS: "MINT",
      XP_MINT_AUTHORITY_SECRET: VALID_SECRET,
    });
    // Imported after the module reset, so it is the class xp-mint checks.
    const { XpAccountClosedError } = await import("../xp-account-errors");
    h.ensureXpTokenAccount.mockRejectedValue(
      new XpAccountClosedError("WALLET", "MINT")
    );
    expect(await mintXpToWallet("WALLET", 10)).toEqual({
      success: false,
      error: "xp_account_closed",
    });
    expect(h.sendPlatformTransaction).not.toHaveBeenCalled();
  });

  it("returns the error message when the send throws", async () => {
    h.sendPlatformTransaction.mockRejectedValue(new Error("rpc down"));

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
  it("reports not-configured when the authority secret is missing", async () => {
    const { burnXpFromWallet } = await loadXpMint({
      NEXT_PUBLIC_XP_MINT_ADDRESS: "MINT",
      XP_MINT_AUTHORITY_SECRET: undefined,
    });
    const res = await burnXpFromWallet("WALLET");
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not configured/i);
    expect(h.getAccount).not.toHaveBeenCalled();
    expect(h.burn).not.toHaveBeenCalled();
  });

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
