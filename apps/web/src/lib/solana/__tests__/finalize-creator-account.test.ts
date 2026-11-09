/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Keypair, Transaction, type PublicKey } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

// finalize_course needs the course creator's XP token account for every
// learner who finishes the course. The creator's account is not held to the
// once-per-wallet funding slot: a creator who closed theirs must not stop
// their learners' finalize (and credential), so a missing one is recreated in
// the finalize transaction and logged. The learner's own account still goes
// through ensureXpTokenAccount.

const h = vi.hoisted(() => ({
  accounts: new Map<string, { owner: PublicKey }>(),
  sendPlatformTransaction: vi.fn(),
  ensureXpTokenAccount: vi.fn(),
  findXpAccountFundRows: vi.fn(),
  logEvent: vi.fn(),
  builderAccounts: null as Record<string, PublicKey> | null,
  builderPre: [] as unknown[],
  mint: null as unknown as PublicKey,
  creator: null as unknown as PublicKey,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    SOLANA_RPC_URL: "http://localhost:8899",
    // Read when the signer is first loaded, after the module body has run.
    get BACKEND_SIGNER_SECRET() {
      return JSON.stringify(Array.from(backend.secretKey));
    },
  },
}));
vi.mock("@/lib/logging", () => ({ logEvent: h.logEvent }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/platform-spend/ledger", () => ({
  recordPlatformTx: vi.fn(),
  findXpAccountFundRows: h.findXpAccountFundRows,
  reserveXpAccountFund: vi.fn(),
}));
vi.mock("@solana/web3.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/web3.js")>();
  return {
    ...actual,
    Connection: class {
      async getAccountInfo(address: PublicKey) {
        return h.accounts.get(address.toBase58()) ?? null;
      }
    },
  };
});
vi.mock("@coral-xyz/anchor", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@coral-xyz/anchor")>();
  const builder = {
    preInstructions(ixs: unknown[]) {
      h.builderPre = ixs;
      return builder;
    },
    accountsPartial(accounts: Record<string, PublicKey>) {
      h.builderAccounts = accounts;
      return builder;
    },
    async transaction() {
      return new Transaction();
    },
  };
  return {
    ...actual,
    AnchorProvider: class {
      constructor(readonly connection: unknown) {}
    },
    Program: class {
      programId = Keypair.generate().publicKey;
      provider: { connection: unknown };
      account = { config: { fetch: async () => ({ xpMint: h.mint }) } };
      methods = { finalizeCourse: () => builder };
      constructor(_idl: unknown, provider: { connection: unknown }) {
        this.provider = provider;
      }
    },
  };
});
vi.mock("../academy-reads", () => ({
  fetchCourse: async () => ({ creator: h.creator }),
}));
vi.mock("../sponsor", () => ({
  resolveFeePayer: async () => ({ keypair: sponsor, role: "sponsor" }),
  SponsorUnavailableError: class extends Error {},
  SPONSOR_UNAVAILABLE_MESSAGE: "",
}));
vi.mock("../platform-tx", () => ({
  sendPlatformTransaction: h.sendPlatformTransaction,
}));
vi.mock("../xp-token-account", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../xp-token-account")>()),
  ensureXpTokenAccount: h.ensureXpTokenAccount,
}));

import { finalizeCourse } from "../academy-program";

const sponsor = Keypair.generate();
const backend = Keypair.generate();

const learner = Keypair.generate().publicKey;
const ata = (owner: PublicKey) =>
  getAssociatedTokenAddressSync(
    h.mint,
    owner,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

const creates = () =>
  h.builderPre.filter((ix) =>
    (ix as { programId: PublicKey }).programId.equals(
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  ) as { keys: { pubkey: PublicKey }[] }[];

beforeEach(() => {
  vi.clearAllMocks();
  h.accounts.clear();
  h.builderAccounts = null;
  h.builderPre = [];
  h.mint = Keypair.generate().publicKey;
  h.creator = Keypair.generate().publicKey;
  h.sendPlatformTransaction.mockResolvedValue("FINALIZE_SIG");
  h.ensureXpTokenAccount.mockImplementation(
    async (_c: unknown, owner: PublicKey) => ata(owner)
  );
});

describe("finalizeCourse and the creator's XP token account", () => {
  it("recreates a closed creator account in the finalize transaction and logs it", async () => {
    // The creator's account is gone (closed after an earlier funding).
    await expect(finalizeCourse("course-1", learner)).resolves.toBe(
      "FINALIZE_SIG"
    );

    const [create] = creates();
    expect(creates()).toHaveLength(1);
    expect(create!.keys[0]!.pubkey).toEqual(sponsor.publicKey);
    expect(create!.keys[1]!.pubkey).toEqual(ata(h.creator));
    expect(h.builderAccounts?.creatorTokenAccount).toEqual(ata(h.creator));
    expect(h.sendPlatformTransaction).toHaveBeenCalledTimes(1);

    // No once-per slot for the creator: the ledger is never consulted for it.
    expect(h.findXpAccountFundRows).not.toHaveBeenCalled();
    expect(h.ensureXpTokenAccount).toHaveBeenCalledTimes(1);
    expect(
      (h.ensureXpTokenAccount.mock.calls[0]![1] as PublicKey).equals(learner)
    ).toBe(true);

    expect(h.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "warn",
        context: expect.objectContaining({
          creator: h.creator.toBase58(),
          courseId: "course-1",
        }),
      })
    );
  });

  it("adds no create and logs nothing when the creator account exists", async () => {
    h.accounts.set(ata(h.creator).toBase58(), { owner: TOKEN_2022_PROGRAM_ID });

    await finalizeCourse("course-1", learner);

    expect(creates()).toHaveLength(0);
    expect(h.builderAccounts?.creatorTokenAccount).toEqual(ata(h.creator));
    expect(h.logEvent).not.toHaveBeenCalled();
  });
});
