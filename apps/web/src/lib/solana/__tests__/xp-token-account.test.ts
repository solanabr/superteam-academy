/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  Keypair,
  PublicKey,
  SendTransactionError,
  Transaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import bs58 from "bs58";
import {
  createFakeDb,
  type FakeDb,
} from "@/lib/platform-spend/__tests__/fake-db";

// XP token account funding end to end: the real helper, platform send path,
// ledger, slot and settlement code over an in-memory ledger and a scripted
// chain. The chain records every transaction sent, lands the creates it is
// told to, and keeps each address's history so a closed account leaves a trace.

interface ChainTx {
  signature: string;
  keys: PublicKey[];
  /** Account indexes that were token accounts in this transaction. */
  tokenAccountIndexes: number[];
}

const h = vi.hoisted(() => ({
  db: null as unknown as FakeDb,
  chain: null as unknown as {
    blockHeight: number;
    blockhashes: number;
    accounts: Map<string, { owner: PublicKey }>;
    history: Map<string, { signature: string; err: null }[]>;
    txs: Map<string, ChainTx>;
    statuses: Map<string, { confirmationStatus: string; err: unknown }>;
    sent: Transaction[];
    /**
     * Whether a sent create lands at once (true) or is broadcast and held
     * until the test lands it with `land(signature)` (false).
     */
    landSends: boolean;
    /** Broadcast creates the cluster has not reported yet. */
    inflight: Map<string, () => void>;
    /** The node rejects the next send at preflight. */
    preflightFails: boolean;
    /**
     * The next send is forwarded to the cluster, then the gateway answers
     * with a JSON-RPC error body carrying this message anyway.
     */
    forwardThenError: string | null;
    /** The next create lands and fails on-chain. */
    landFails: boolean;
    historyFails: boolean;
  },
  logEvent: vi.fn(),
}));

const sponsor = Keypair.generate();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.db }));
vi.mock("@/lib/logging", () => ({ logEvent: h.logEvent }));
vi.mock("@/lib/analytics/server-capture", () => ({
  captureServerEvent: vi.fn(),
  PLATFORM_DISTINCT_ID: "platform",
}));
vi.mock("@/lib/solana/sponsor", () => ({
  spendCluster: () => "devnet",
  getPlatformPayerKeys: () =>
    new Map([[sponsor.publicKey.toBase58(), "sponsor"]]),
}));
vi.mock("../priority-fee", () => ({ estimatePriorityFee: async () => 1 }));

import { ensureXpTokenAccount } from "../xp-token-account";
import {
  XpAccountClosedError,
  XpAccountFundingInFlightError,
} from "../xp-account-errors";
import { LedgerUnavailableError } from "@/lib/platform-spend/ledger";

const RENT = 2_096_920;

function txResponse(tx: ChainTx) {
  return {
    slot: 10,
    blockTime: null,
    meta: {
      err: null,
      fee: 5_000,
      preBalances: tx.keys.map((_, i) => (i === 0 ? 10_000_000 : 0)),
      postBalances: tx.keys.map((_, i) =>
        i === 0 ? 10_000_000 - 5_000 - RENT : 0
      ),
      preTokenBalances: [],
      postTokenBalances: tx.tokenAccountIndexes.map((accountIndex) => ({
        accountIndex,
        mint: "",
        uiTokenAmount: { amount: "0", decimals: 0, uiAmount: 0 },
      })),
      loadedAddresses: null,
    },
    transaction: {
      message: {
        version: "legacy",
        getAccountKeys: () => ({ keySegments: () => [tx.keys] }),
      },
    },
  };
}

function addHistory(address: PublicKey, tx: ChainTx) {
  h.chain.txs.set(tx.signature, tx);
  const list = h.chain.history.get(address.toBase58()) ?? [];
  list.unshift({ signature: tx.signature, err: null });
  h.chain.history.set(address.toBase58(), list);
}

/** A broadcast create lands: the account exists and its history shows it. */
function landOnChain(tx: Transaction, signature: string) {
  const create = tx.instructions.find((ix) =>
    ix.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)
  )!;
  const ata = create.keys[1]!.pubkey;
  const keys = tx.compileMessage().accountKeys;
  h.chain.accounts.set(ata.toBase58(), { owner: TOKEN_2022_PROGRAM_ID });
  h.chain.statuses.set(signature, {
    confirmationStatus: "confirmed",
    err: null,
  });
  addHistory(ata, {
    signature,
    keys,
    tokenAccountIndexes: [keys.findIndex((k) => k.equals(ata))],
  });
}

const land = (signature: string) => h.chain.inflight.get(signature)!();

const connection = {
  getAccountInfo: async (address: PublicKey) =>
    h.chain.accounts.get(address.toBase58()) ?? null,
  getLatestBlockhash: async () => {
    h.chain.blockhashes += 1;
    return {
      blockhash: bs58.encode(Buffer.alloc(32, h.chain.blockhashes)),
      lastValidBlockHeight: h.chain.blockHeight + 150,
    };
  },
  sendRawTransaction: async (bytes: Buffer) => {
    const tx = Transaction.from(bytes);
    const signature = bs58.encode(tx.signature!);
    // web3.js turns any JSON-RPC error body into a SendTransactionError, with
    // action "simulate" whenever preflight is on.
    if (h.chain.preflightFails) {
      h.chain.preflightFails = false;
      throw new SendTransactionError({
        action: "simulate",
        signature: "",
        transactionMessage:
          "Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1",
        logs: [],
      });
    }
    h.chain.sent.push(tx);
    if (h.chain.landFails) {
      h.chain.landFails = false;
      h.chain.statuses.set(signature, {
        confirmationStatus: "confirmed",
        err: { InstructionError: [0, "Custom"] },
      });
      return signature;
    }
    const apply = () => landOnChain(tx, signature);
    if (h.chain.landSends) apply();
    else h.chain.inflight.set(signature, apply);
    if (h.chain.forwardThenError) {
      const transactionMessage = h.chain.forwardThenError;
      h.chain.forwardThenError = null;
      throw new SendTransactionError({
        action: "simulate",
        signature: "",
        transactionMessage,
      });
    }
    return signature;
  },
  confirmTransaction: async ({ signature }: { signature: string }) => ({
    context: { slot: 1 },
    value: { err: h.chain.statuses.get(signature)?.err ?? null },
  }),
  getEpochInfo: async () => ({
    epoch: 1,
    slotIndex: 0,
    slotsInEpoch: 1,
    absoluteSlot: 50,
    blockHeight: h.chain.blockHeight,
  }),
  getSignatureStatuses: async (sigs: string[]) => ({
    context: { slot: 60 },
    value: sigs.map((s) => h.chain.statuses.get(s) ?? null),
  }),
  getTransaction: async (sig: string) => {
    const tx = h.chain.txs.get(sig);
    return tx ? txResponse(tx) : null;
  },
  getSignaturesForAddress: async (
    address: PublicKey,
    options?: { limit?: number }
  ) => {
    if (h.chain.historyFails) throw new Error("rpc down");
    return (h.chain.history.get(address.toBase58()) ?? [])
      .slice(0, options?.limit ?? 1000)
      .map((s) => ({ ...s, slot: 1, blockTime: null, memo: null }));
  },
  getTransactions: async (sigs: string[]) =>
    sigs.map((sig) => {
      const tx = h.chain.txs.get(sig);
      return tx ? txResponse(tx) : null;
    }),
};

const mint = Keypair.generate().publicKey;
const feePayer = { keypair: sponsor, role: "sponsor" as const };

const ataOf = (owner: PublicKey) =>
  getAssociatedTokenAddressSync(
    mint,
    owner,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

const ensure = (owner: PublicKey, courseId = "course-1") =>
  ensureXpTokenAccount(connection as never, owner, mint, feePayer, {
    courseId,
  });

/** The learner closes the account: it is gone, and the close is in its history. */
function learnerCloses(owner: PublicKey) {
  const ata = ataOf(owner);
  h.chain.accounts.delete(ata.toBase58());
  addHistory(ata, {
    signature: bs58.encode(Buffer.alloc(64, h.chain.txs.size + 1)),
    keys: [owner, ata],
    tokenAccountIndexes: [1],
  });
}

const fundRows = () =>
  h.db.tables.platform_spend!.filter((r) => r.action === "xp_account_fund");

const createsSent = () =>
  h.chain.sent.flatMap((tx) =>
    tx.instructions.filter((ix) =>
      ix.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)
    )
  );

beforeEach(() => {
  h.db = createFakeDb();
  h.chain = {
    blockHeight: 1_000,
    blockhashes: 0,
    accounts: new Map(),
    history: new Map(),
    txs: new Map(),
    statuses: new Map(),
    sent: [],
    landSends: true,
    inflight: new Map(),
    preflightFails: false,
    forwardThenError: null,
    landFails: false,
    historyFails: false,
  };
  h.logEvent.mockReset();
});

describe("ensureXpTokenAccount", () => {
  it("sends no create for an account that exists", async () => {
    const owner = Keypair.generate().publicKey;
    h.chain.accounts.set(ataOf(owner).toBase58(), {
      owner: TOKEN_2022_PROGRAM_ID,
    });

    await expect(ensure(owner)).resolves.toEqual(ataOf(owner));

    expect(h.chain.sent).toHaveLength(0);
    expect(fundRows()).toHaveLength(0);
  });

  it("funds a fresh wallet with exactly one create, paid by the platform payer", async () => {
    const owner = Keypair.generate().publicKey;

    await expect(ensure(owner)).resolves.toEqual(ataOf(owner));

    expect(h.chain.sent).toHaveLength(1);
    const creates = createsSent();
    expect(creates).toHaveLength(1);
    expect(creates[0]!.keys[0]!.pubkey).toEqual(sponsor.publicKey);
    expect(creates[0]!.keys[1]!.pubkey).toEqual(ataOf(owner));
    expect(h.chain.sent[0]!.feePayer).toEqual(sponsor.publicKey);
    // The slot row was written before the broadcast, under the same signature.
    expect(fundRows()).toEqual([
      expect.objectContaining({
        signature: bs58.encode(h.chain.sent[0]!.signature!),
        wallet: owner.toBase58(),
        token_mint: mint.toBase58(),
        payer: sponsor.publicKey.toBase58(),
        status: "pending",
      }),
    ]);

    // A second call finds the account and sends nothing more.
    await ensure(owner, "course-2");
    expect(createsSent()).toHaveLength(1);
  });

  it("refuses a second funding after the learner closes the account, on any course", async () => {
    const owner = Keypair.generate().publicKey;
    await ensure(owner, "course-1");
    learnerCloses(owner);

    // First lesson of a different course: the slot is per wallet, not per course.
    const refused = ensure(owner, "course-2");
    await expect(refused).rejects.toBeInstanceOf(XpAccountClosedError);
    await expect(refused).rejects.toMatchObject({
      code: "xp_account_closed",
      owner: owner.toBase58(),
    });

    expect(createsSent()).toHaveLength(1);
    // The inline check settled the landed funding: the slot reads as used.
    expect(fundRows()[0]!.status).toBe("confirmed");
  });

  it("refuses from the ledger alone when the chain shows no history", async () => {
    const owner = Keypair.generate().publicKey;
    await ensure(owner, "course-1");
    h.chain.accounts.delete(ataOf(owner).toBase58());
    h.chain.history.clear();

    await expect(ensure(owner, "course-2")).rejects.toBeInstanceOf(
      XpAccountClosedError
    );
    expect(createsSent()).toHaveLength(1);
  });

  it("refuses a wallet whose account was funded and closed before the ledger knew it", async () => {
    const owner = Keypair.generate().publicKey;
    learnerCloses(owner);

    await expect(ensure(owner)).rejects.toBeInstanceOf(XpAccountClosedError);
    expect(h.chain.sent).toHaveLength(0);
    expect(fundRows()).toHaveLength(0);
  });

  it("does not count an address that only appeared as a plain account", async () => {
    const owner = Keypair.generate().publicKey;
    const ata = ataOf(owner);
    addHistory(ata, {
      signature: bs58.encode(Buffer.alloc(64, 9)),
      keys: [Keypair.generate().publicKey, ata],
      tokenAccountIndexes: [],
    });

    await ensure(owner);
    expect(createsSent()).toHaveLength(1);
  });

  it("refuses when the history window is full and shows no token account", async () => {
    const owner = Keypair.generate().publicKey;
    const ata = ataOf(owner);
    for (let i = 1; i <= 100; i++) {
      addHistory(ata, {
        signature: bs58.encode(Buffer.alloc(64, i)),
        keys: [Keypair.generate().publicKey, ata],
        tokenAccountIndexes: [],
      });
    }

    await expect(ensure(owner)).rejects.toBeInstanceOf(XpAccountClosedError);
    expect(h.chain.sent).toHaveLength(0);
  });

  it("treats a lamports-only account at the address as missing", async () => {
    const owner = Keypair.generate().publicKey;
    h.chain.accounts.set(ataOf(owner).toBase58(), {
      owner: new PublicKey("11111111111111111111111111111111"),
    });

    await ensure(owner);
    expect(createsSent()).toHaveLength(1);
  });

  it("does not fund while another funding for the wallet is landing", async () => {
    const owner = Keypair.generate().publicKey;
    h.chain.landSends = false;
    await ensure(owner);
    const first = fundRows()[0]!.signature as string;
    h.chain.statuses.set(first, { confirmationStatus: "processed", err: null });

    await expect(ensure(owner)).rejects.toBeInstanceOf(
      XpAccountFundingInFlightError
    );
    expect(h.chain.sent).toHaveLength(1);
  });

  it("keeps a broadcast create in flight while the cluster has not reported it", async () => {
    const owner = Keypair.generate().publicKey;
    // A is broadcast, its blockhash still valid, the cluster silent about it.
    h.chain.landSends = false;
    await ensure(owner, "lesson-a");
    const a = fundRows()[0]!.signature as string;

    // B a moment later: the account is still missing, and A may still land.
    await expect(ensure(owner, "lesson-b")).rejects.toBeInstanceOf(
      XpAccountFundingInFlightError
    );
    expect(createsSent()).toHaveLength(1);
    expect(fundRows().map((r) => r.status)).toEqual(["pending"]);

    // A lands and the learner closes the account: no second funding.
    land(a);
    learnerCloses(owner);
    h.chain.history.clear();
    await expect(ensure(owner, "lesson-c")).rejects.toBeInstanceOf(
      XpAccountClosedError
    );
    expect(createsSent()).toHaveLength(1);
  });

  it("frees the slot once the broadcast create's blockhash has expired", async () => {
    const owner = Keypair.generate().publicKey;
    h.chain.landSends = false;
    await ensure(owner);
    h.chain.blockHeight += 1_000;
    h.chain.landSends = true;

    await ensure(owner);

    expect(createsSent()).toHaveLength(2);
    expect(fundRows().map((r) => r.status)).toEqual(["expired", "pending"]);
  });

  it("frees the slot at once when the node rejects the create at preflight", async () => {
    const owner = Keypair.generate().publicKey;
    h.chain.preflightFails = true;
    await expect(ensure(owner)).rejects.toBeInstanceOf(SendTransactionError);
    expect(fundRows().map((r) => r.status)).toEqual(["failed"]);

    await ensure(owner);

    expect(createsSent()).toHaveLength(1);
    expect(fundRows().map((r) => r.status)).toEqual(["failed", "pending"]);
  });

  // A gateway that fans the same bytes out to several upstreams can answer
  // with a lagging upstream's simulation failure after another one forwarded.
  it.each([
    "Internal error: request timed out",
    "Transaction simulation failed: Blockhash not found",
    "Transaction simulation failed: This transaction has already been processed",
  ])(
    "keeps the slot when the gateway answers %j after forwarding the create",
    async (message) => {
      const owner = Keypair.generate().publicKey;
      h.chain.landSends = false;
      h.chain.forwardThenError = message;
      await expect(ensure(owner, "lesson-a")).rejects.toBeInstanceOf(
        SendTransactionError
      );
      const a = fundRows()[0]!.signature as string;
      expect(fundRows().map((r) => r.status)).toEqual(["pending"]);

      // B must not fund while A can still land.
      await expect(ensure(owner, "lesson-b")).rejects.toBeInstanceOf(
        XpAccountFundingInFlightError
      );
      expect(createsSent()).toHaveLength(1);

      // A lands after all; a close afterwards gets no second funding.
      land(a);
      learnerCloses(owner);
      h.chain.history.clear();
      await expect(ensure(owner, "lesson-c")).rejects.toBeInstanceOf(
        XpAccountClosedError
      );
      expect(createsSent()).toHaveLength(1);
    }
  );

  it("frees the slot at once when the create landed and failed", async () => {
    const owner = Keypair.generate().publicKey;
    h.chain.landFails = true;
    await expect(ensure(owner)).rejects.toThrow();
    expect(fundRows().map((r) => r.status)).toEqual(["failed"]);

    await ensure(owner);

    expect(createsSent()).toHaveLength(2);
    expect(fundRows().map((r) => r.status)).toEqual(["failed", "pending"]);
  });

  describe("fails closed", () => {
    it("denies when the slot reservation cannot be written", async () => {
      const owner = Keypair.generate().publicKey;
      h.db.failNext("platform_spend", { message: "connection refused" });

      await expect(ensure(owner)).rejects.toBeInstanceOf(
        LedgerUnavailableError
      );
      expect(h.chain.sent).toHaveLength(0);
    });

    it("denies when the slot cannot be read", async () => {
      const owner = Keypair.generate().publicKey;
      h.db.failNextRead("platform_spend", { message: "connection refused" });

      await expect(ensure(owner)).rejects.toBeInstanceOf(
        LedgerUnavailableError
      );
      expect(h.chain.sent).toHaveLength(0);
    });

    it("denies when the account history cannot be read", async () => {
      const owner = Keypair.generate().publicKey;
      h.chain.historyFails = true;

      await expect(ensure(owner)).rejects.toThrow("rpc down");
      expect(h.chain.sent).toHaveLength(0);
      expect(fundRows()).toHaveLength(0);
    });

    it("denies when another request holds the reservation", async () => {
      const owner = Keypair.generate().publicKey;
      // Another request reserved between this one's read and its insert.
      h.db.tables.platform_spend!.push({
        signature: "OTHER",
        action: "xp_account_fund",
        cluster: "devnet",
        wallet: owner.toBase58(),
        token_mint: mint.toBase58(),
        status: "pending",
        created_at: new Date().toISOString(),
      });
      h.db.hideNextRead("platform_spend");

      await expect(ensure(owner)).rejects.toBeInstanceOf(
        XpAccountFundingInFlightError
      );
      expect(h.chain.sent).toHaveLength(0);
    });
  });
});
