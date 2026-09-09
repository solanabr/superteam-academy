import { describe, it, expect, vi } from "vitest";
import {
  Keypair,
  PublicKey,
  SystemInstruction,
  Transaction,
  type Connection,
} from "@solana/web3.js";
import { BPF_LOADER_UPGRADEABLE_ID, BUFFER_HEADER_SIZE } from "../constants";
import { estimateSessionKeyDeployCost } from "../cost";
import { setCachedBinary } from "../deploy";
import {
  createFundingTransfer,
  isResumableDeploymentState,
  runSessionKeyDeploy,
  startOverSessionKey,
  sweepSessionKey,
  transferProgramAuthority,
} from "../session-key";
import type { DeploymentCallbacks, DeploymentState } from "../types";

const BLOCKHASH = "11111111111111111111111111111111";
const RENT = 1_000_000;
/** 5 chunks at CHUNK_SIZE=900. */
const BINARY = new Uint8Array(4500).fill(7);

function callbacks(): DeploymentCallbacks {
  return {
    onStepChange: vi.fn(),
    onChunkProgress: vi.fn(),
    onTransactionConfirmed: vi.fn(),
    onError: vi.fn(),
    onStateUpdate: vi.fn(),
    onBatchStart: vi.fn(),
  };
}

function bufferAccount(authority: PublicKey) {
  const data = Buffer.alloc(BUFFER_HEADER_SIZE);
  data.writeUInt32LE(1, 0); // Buffer tag
  data[4] = 1; // Some(authority)
  authority.toBuffer().copy(data, 5);
  return { owner: BPF_LOADER_UPGRADEABLE_ID, data, executable: false };
}

interface Harness {
  connection: Connection;
  sent: Transaction[];
  setBalance: (lamports: number) => void;
  balanceOf: (key: string) => number;
}

function harness(options: { buffer?: PublicKey } = {}): Harness {
  const sent: Transaction[] = [];
  const balances = new Map<string, number>();
  let defaultBalance = 0;

  const connection = {
    getLatestBlockhash: vi.fn(async () => ({
      blockhash: BLOCKHASH,
      lastValidBlockHeight: 1000,
    })),
    getMinimumBalanceForRentExemption: vi.fn(async () => RENT),
    getBalance: vi.fn(
      async (key: PublicKey) => balances.get(key.toBase58()) ?? defaultBalance
    ),
    sendRawTransaction: vi.fn(async (raw: Uint8Array) => {
      const tx = Transaction.from(Buffer.from(raw));
      sent.push(tx);
      return `sig-${sent.length}`;
    }),
    confirmTransaction: vi.fn(async () => ({ value: { err: null } })),
    getSignatureStatuses: vi.fn(async (sigs: string[]) => ({
      value: sigs.map(() => ({
        err: null,
        confirmationStatus: "confirmed" as const,
      })),
    })),
    getAccountInfo: vi.fn(async (key: PublicKey) =>
      options.buffer && key.equals(options.buffer)
        ? bufferAccount(options.buffer)
        : null
    ),
  } as unknown as Connection;

  return {
    connection,
    sent,
    setBalance: (lamports: number) => {
      defaultBalance = lamports;
    },
    balanceOf: (key: string) => balances.get(key) ?? defaultBalance,
  };
}

/** Instructions of a transaction that target the upgradeable loader. */
function loaderIxs(tx: Transaction) {
  return tx.instructions.filter((ix) =>
    ix.programId.equals(BPF_LOADER_UPGRADEABLE_ID)
  );
}

describe("runSessionKeyDeploy", () => {
  it("funds the session key once, for exactly the estimate, and signs everything else locally", async () => {
    setCachedBinary("uuid-fund", BINARY);
    const h = harness();
    h.setBalance(5_000_000);
    const learner = Keypair.generate().publicKey;

    const fund = vi.fn(async () => "fund-sig");
    let sessionKey: PublicKey | null = null;

    const result = await runSessionKeyDeploy({
      connection: h.connection,
      learner,
      buildUuid: "uuid-fund",
      fund,
      callbacks: callbacks(),
      events: {
        onSessionKey: (_secret, publicKey) => {
          sessionKey = publicKey;
        },
      },
    });

    const estimate = await estimateSessionKeyDeployCost(
      h.connection,
      BINARY.length
    );

    // The embedded wallet signs ONE transaction: the funding transfer.
    expect(fund).toHaveBeenCalledTimes(1);
    expect(fund).toHaveBeenCalledWith(estimate.totalLamports, sessionKey);
    expect(result.fundedLamports).toBe(estimate.totalLamports);

    // Everything actually sent — buffer create, 5 writes, deploy, SetAuthority,
    // sweep — carries the session key's signature and no learner signature.
    expect(h.sent.length).toBe(9);
    for (const tx of h.sent) {
      const signers = tx.signatures.map((s) => s.publicKey.toBase58());
      expect(signers).toContain(sessionKey!.toBase58());
      expect(signers).not.toContain(learner.toBase58());
    }
  });

  it("hands the upgrade authority to the learner and sweeps the remainder back", async () => {
    setCachedBinary("uuid-authority", BINARY);
    const h = harness();
    // Funded up front, drained by rent by the time the sweep reads it.
    const remaining = 2_345_678;
    h.setBalance(9_000_000);
    let balanceReads = 0;
    (h.connection.getBalance as ReturnType<typeof vi.fn>).mockImplementation(
      async () => (balanceReads++ === 0 ? 9_000_000 : remaining)
    );
    const learner = Keypair.generate().publicKey;

    const transferred: string[] = [];
    const refunded: number[] = [];

    const result = await runSessionKeyDeploy({
      connection: h.connection,
      learner,
      buildUuid: "uuid-authority",
      fund: async () => "fund-sig",
      callbacks: callbacks(),
      events: {
        onOwnershipTransferred: (info) => transferred.push(info.signature),
        onRefunded: (info) => refunded.push(info.lamports),
      },
    });

    const [programData] = PublicKey.findProgramAddressSync(
      [result.programIdPubkey.toBuffer()],
      BPF_LOADER_UPGRADEABLE_ID
    );

    // SetAuthority: variant 4, programdata writable, session key signs, learner
    // is the (non-signing) new authority.
    const setAuthority = h.sent
      .flatMap(loaderIxs)
      .find((ix) => ix.data.length === 4 && ix.data.readUInt32LE(0) === 4);
    expect(setAuthority).toBeDefined();
    expect(setAuthority!.keys[0]!.pubkey.equals(programData)).toBe(true);
    expect(setAuthority!.keys[0]!.isWritable).toBe(true);
    expect(setAuthority!.keys[1]!.isSigner).toBe(true);
    expect(setAuthority!.keys[2]!.pubkey.equals(learner)).toBe(true);
    expect(setAuthority!.keys[2]!.isSigner).toBe(false);
    expect(transferred).toHaveLength(1);
    expect(result.authoritySignature).toBe(transferred[0]);

    // Sweep: balance minus the sweep's own fee, to the learner.
    const sweep = h.sent.at(-1)!;
    const decoded = SystemInstruction.decodeTransfer(sweep.instructions[0]!);
    expect(decoded.toPubkey.equals(learner)).toBe(true);
    expect(Number(decoded.lamports)).toBe(remaining - 5_000);
    expect(refunded).toEqual([remaining - 5_000]);
    expect(result.refundError).toBeNull();
  });

  it("resume reuses the persisted key and starts at the saved offset without a second transfer", async () => {
    setCachedBinary("uuid-resume", BINARY);
    const session = Keypair.generate();
    const bufferKp = Keypair.generate();
    const programKp = Keypair.generate();
    const h = harness({ buffer: bufferKp.publicKey });
    h.setBalance(3_000_000);
    // The persisted buffer's authority is the persisted session key.
    (
      h.connection.getAccountInfo as ReturnType<typeof vi.fn>
    ).mockImplementation(async (key: PublicKey) =>
      key.equals(bufferKp.publicKey) ? bufferAccount(session.publicKey) : null
    );

    const fund = vi.fn(async () => "fund-sig");
    const state: DeploymentState = {
      buildUuid: "uuid-resume",
      bufferKeypairSecret: Array.from(bufferKp.secretKey),
      programKeypairSecret: Array.from(programKp.secretKey),
      lastUploadedChunk: 2,
      totalChunks: 5,
      phase: "uploading",
    };

    const result = await runSessionKeyDeploy({
      connection: h.connection,
      learner: Keypair.generate().publicKey,
      buildUuid: "uuid-resume",
      fund,
      callbacks: callbacks(),
      persistedSessionKey: Array.from(session.secretKey),
      resumeState: state,
    });

    expect(fund).not.toHaveBeenCalled();
    expect(result.fundedLamports).toBe(0);
    expect(result.programId).toBe(programKp.publicKey.toBase58());
    expect(result.sessionKeySecret).toEqual(Array.from(session.secretKey));

    // Writes resume at chunk 3 (offset 2700), not at zero.
    const writes = h.sent
      .flatMap(loaderIxs)
      .filter((ix) => ix.data.readUInt32LE(0) === 1);
    expect(writes).toHaveLength(2);
    expect(writes[0]!.data.readUInt32LE(4)).toBe(3 * 900);
  });

  it("refuses to resume into a buffer the session key does not control", async () => {
    setCachedBinary("uuid-foreign", BINARY);
    const session = Keypair.generate();
    const bufferKp = Keypair.generate();
    const h = harness();
    (
      h.connection.getAccountInfo as ReturnType<typeof vi.fn>
    ).mockImplementation(async (key: PublicKey) =>
      key.equals(bufferKp.publicKey)
        ? bufferAccount(Keypair.generate().publicKey) // someone else's buffer
        : null
    );

    const fund = vi.fn(async () => "fund-sig");
    await expect(
      runSessionKeyDeploy({
        connection: h.connection,
        learner: Keypair.generate().publicKey,
        buildUuid: "uuid-foreign",
        fund,
        callbacks: callbacks(),
        persistedSessionKey: Array.from(session.secretKey),
        resumeState: {
          buildUuid: "uuid-foreign",
          bufferKeypairSecret: Array.from(bufferKp.secretKey),
          programKeypairSecret: Array.from(Keypair.generate().secretKey),
          lastUploadedChunk: 2,
          totalChunks: 5,
          phase: "uploading",
        },
      })
    ).rejects.toThrow(/buffer this key cannot use/i);

    expect(fund).not.toHaveBeenCalled();
    expect(h.sent).toHaveLength(0);
  });
});

describe("isResumableDeploymentState", () => {
  setCachedBinary("uuid-check", BINARY);
  const good: DeploymentState = {
    buildUuid: "uuid-check",
    bufferKeypairSecret: Array.from(Keypair.generate().secretKey),
    programKeypairSecret: Array.from(Keypair.generate().secretKey),
    lastUploadedChunk: 1,
    totalChunks: 5,
    phase: "uploading",
  };

  it("accepts the state this build actually produced", () => {
    expect(
      isResumableDeploymentState(good, {
        buildUuid: "uuid-check",
        programKeypairSecret: good.programKeypairSecret,
      })
    ).toBe(true);
  });

  it("rejects a state whose program keypair is not the build's", () => {
    expect(
      isResumableDeploymentState(good, {
        buildUuid: "uuid-check",
        programKeypairSecret: Array.from(Keypair.generate().secretKey),
      })
    ).toBe(false);
  });

  it("rejects a state from another build, a malformed key, or a bad offset", () => {
    expect(isResumableDeploymentState(good, { buildUuid: "other-build" })).toBe(
      false
    );
    expect(
      isResumableDeploymentState(
        { ...good, bufferKeypairSecret: [1, 2, 3] },
        { buildUuid: "uuid-check" }
      )
    ).toBe(false);
    expect(
      isResumableDeploymentState(
        { ...good, lastUploadedChunk: 5 },
        { buildUuid: "uuid-check" }
      )
    ).toBe(false);
    // totalChunks must match the cached binary, so a state claiming a bigger
    // program cannot make the resume write past its end.
    expect(
      isResumableDeploymentState(
        { ...good, totalChunks: 500 },
        { buildUuid: "uuid-check" }
      )
    ).toBe(false);
  });
});

describe("sweepSessionKey / startOverSessionKey", () => {
  it("sends nothing when the balance cannot cover the fee", async () => {
    const h = harness();
    h.setBalance(4_000);
    const result = await sweepSessionKey({
      connection: h.connection,
      sessionKeySecret: Array.from(Keypair.generate().secretKey),
      destination: Keypair.generate().publicKey,
    });
    expect(result).toBeNull();
    expect(h.sent).toHaveLength(0);
  });

  it("start over closes the buffer to the session key, then sweeps to the learner", async () => {
    const session = Keypair.generate();
    const bufferKp = Keypair.generate();
    const learner = Keypair.generate().publicKey;
    const h = harness({ buffer: bufferKp.publicKey });
    h.setBalance(1_000_000);

    const { closeSignature, refund } = await startOverSessionKey({
      connection: h.connection,
      sessionKeySecret: Array.from(session.secretKey),
      bufferKeypairSecret: Array.from(bufferKp.secretKey),
      destination: learner,
    });

    expect(closeSignature).not.toBeNull();
    const close = loaderIxs(h.sent[0]!)[0]!;
    expect(close.data.readUInt32LE(0)).toBe(5); // Close
    expect(close.keys[0]!.pubkey.equals(bufferKp.publicKey)).toBe(true);
    expect(close.keys[1]!.pubkey.equals(session.publicKey)).toBe(true); // refund

    const decoded = SystemInstruction.decodeTransfer(
      h.sent[1]!.instructions[0]!
    );
    expect(decoded.toPubkey.equals(learner)).toBe(true);
    expect(refund!.lamports).toBe(1_000_000 - 5_000);
  });
});

describe("transferProgramAuthority", () => {
  it("retries a failing SetAuthority before giving up", async () => {
    const h = harness();
    let attempts = 0;
    (
      h.connection.sendRawTransaction as ReturnType<typeof vi.fn>
    ).mockImplementation(async () => {
      attempts++;
      if (attempts < 4) throw new Error("blockhash not found");
      return "authority-sig";
    });

    const signature = await transferProgramAuthority({
      connection: h.connection,
      sessionKeySecret: Array.from(Keypair.generate().secretKey),
      programId: Keypair.generate().publicKey,
      newAuthority: Keypair.generate().publicKey,
      attempts: 4,
    });

    expect(signature).toBe("authority-sig");
    expect(attempts).toBe(4);
  });
});

describe("createFundingTransfer", () => {
  it("pays from the learner into the session key, for the exact amount", () => {
    const learner = Keypair.generate().publicKey;
    const sessionKey = Keypair.generate().publicKey;

    const tx = createFundingTransfer({
      learner,
      sessionKey,
      lamports: 1_337_000,
      blockhash: BLOCKHASH,
    });

    expect(tx.feePayer!.equals(learner)).toBe(true);
    expect(tx.recentBlockhash).toBe(BLOCKHASH);
    const transfer = SystemInstruction.decodeTransfer(tx.instructions[0]!);
    expect(transfer.fromPubkey.equals(learner)).toBe(true);
    expect(transfer.toPubkey.equals(sessionKey)).toBe(true);
    expect(Number(transfer.lamports)).toBe(1_337_000);
  });
});
