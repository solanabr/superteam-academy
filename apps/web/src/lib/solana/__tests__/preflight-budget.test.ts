import { describe, it, expect, vi, afterEach } from "vitest";
import {
  ComputeBudgetInstruction,
  ComputeBudgetProgram,
  Keypair,
  Transaction,
} from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import bs58 from "bs58";
import { buildEnrollInstruction } from "../instructions";
import { preflightTransaction } from "../program-errors";
import {
  COMPUTE_UNIT_LIMITS,
  PRIORITY_FEE_FLOOR_MICROLAMPORTS,
} from "../compute-budget";

const learner = Keypair.generate().publicKey;
const programId = Keypair.generate().publicKey;
const BLOCKHASH = bs58.encode(Buffer.alloc(32, 9));

function fakeConnection(sim: {
  err: unknown;
  unitsConsumed?: number;
  logs?: string[];
}) {
  return {
    getLatestBlockhash: vi.fn(async () => ({
      blockhash: BLOCKHASH,
      lastValidBlockHeight: 100,
    })),
    simulateTransaction: vi.fn(async () => ({ value: { logs: [], ...sim } })),
  } as unknown as Connection;
}

function enrollTx(): Transaction {
  return new Transaction().add(
    buildEnrollInstruction("course-x", learner, programId)
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("preflightTransaction with a compute budget", () => {
  it("prepends a limit sized from the simulation and the fetched price", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ microLamports: 55_000 })
    );
    vi.stubGlobal("fetch", fetchMock);
    const tx = enrollTx();

    await preflightTransaction(
      tx,
      fakeConnection({ err: null, unitsConsumed: 9_000 }),
      learner,
      { fallbackUnits: COMPUTE_UNIT_LIMITS.enroll }
    );

    expect(tx.instructions).toHaveLength(3);
    const [limitIx, priceIx, enrollIx] = tx.instructions;
    expect(limitIx!.programId.equals(ComputeBudgetProgram.programId)).toBe(
      true
    );
    // 20% over the 9,000 simulated, plus the fixed margin.
    expect(
      ComputeBudgetInstruction.decodeSetComputeUnitLimit(limitIx!)
    ).toEqual({ units: 15_800 });
    expect(
      ComputeBudgetInstruction.decodeSetComputeUnitPrice(priceIx!).microLamports
    ).toBe(55_000n);
    expect(enrollIx!.programId.equals(programId)).toBe(true);

    // Priced on the accounts enroll writes, through the app route.
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("/api/solana/priority-fee");
    const { accounts } = JSON.parse(init.body as string) as {
      accounts: string[];
    };
    expect(accounts[0]).toBe(learner.toBase58());
    expect(accounts).toHaveLength(3); // learner, Course PDA, Enrollment PDA
  });

  it("uses the fallback limit and the floor price when neither answers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 }))
    );
    const tx = enrollTx();

    await preflightTransaction(tx, fakeConnection({ err: null }), learner, {
      fallbackUnits: COMPUTE_UNIT_LIMITS.enroll,
    });

    expect(
      ComputeBudgetInstruction.decodeSetComputeUnitLimit(tx.instructions[0]!)
    ).toEqual({ units: COMPUTE_UNIT_LIMITS.enroll });
    expect(
      ComputeBudgetInstruction.decodeSetComputeUnitPrice(tx.instructions[1]!)
        .microLamports
    ).toBe(BigInt(PRIORITY_FEE_FLOOR_MICROLAMPORTS));
  });

  it("leaves a failing transaction alone and throws the program error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ microLamports: 1 }))
    );
    const tx = enrollTx();

    await expect(
      preflightTransaction(
        tx,
        fakeConnection({
          err: { InstructionError: [0, { Custom: 6001 }] },
          logs: ["Program failed: custom program error: 0x1771"],
        }),
        learner,
        { fallbackUnits: COMPUTE_UNIT_LIMITS.enroll }
      )
    ).rejects.toThrow("custom program error: 0x1771");
    expect(tx.instructions).toHaveLength(1);
  });

  it("adds nothing without a budget", async () => {
    const tx = enrollTx();
    await preflightTransaction(tx, fakeConnection({ err: null }), learner);
    expect(tx.instructions).toHaveLength(1);
  });
});
