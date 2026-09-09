import { describe, it, expect, vi } from "vitest";
import type { Connection } from "@solana/web3.js";
import { estimateDeployCost } from "../cost";
import {
  BUFFER_HEADER_SIZE,
  CHUNK_SIZE,
  PROGRAM_ACCOUNT_SIZE,
  PROGRAM_DATA_HEADER_SIZE,
} from "../constants";

/** Rent priced like the real cluster: a per-byte rate over the account size. */
const LAMPORTS_PER_BYTE = 7;

function connectionWithRent() {
  const getMinimumBalanceForRentExemption = vi.fn(
    async (space: number) => space * LAMPORTS_PER_BYTE
  );
  return {
    connection: {
      getMinimumBalanceForRentExemption,
    } as unknown as Connection,
    getMinimumBalanceForRentExemption,
  };
}

describe("estimateDeployCost", () => {
  it("prices the three accounts the deploy creates plus every transaction fee", async () => {
    const programLen = 4_500; // 5 chunks at CHUNK_SIZE=900
    const { connection, getMinimumBalanceForRentExemption } =
      connectionWithRent();

    const estimate = await estimateDeployCost(connection, programLen);

    const bufferRent = (BUFFER_HEADER_SIZE + programLen) * LAMPORTS_PER_BYTE;
    const programRent = PROGRAM_ACCOUNT_SIZE * LAMPORTS_PER_BYTE;
    const programDataRent =
      (PROGRAM_DATA_HEADER_SIZE + programLen * 2) * LAMPORTS_PER_BYTE;
    // 5 write txs + buffer create + deploy, at 5_000 base + 1_000 priority.
    const feeLamports = (programLen / CHUNK_SIZE + 2) * 6_000;

    expect(estimate.bufferRent).toBe(bufferRent);
    expect(estimate.programRent).toBe(programRent);
    expect(estimate.programDataRent).toBe(programDataRent);
    expect(estimate.feeLamports).toBe(feeLamports);
    expect(estimate.totalLamports).toBe(
      Math.ceil(
        (bufferRent + programRent + programDataRent + feeLamports) * 1.2
      )
    );

    // The three account sizes are the ones deployProgram actually allocates.
    expect(
      getMinimumBalanceForRentExemption.mock.calls.map((c) => c[0])
    ).toEqual([
      BUFFER_HEADER_SIZE + programLen,
      PROGRAM_ACCOUNT_SIZE,
      PROGRAM_DATA_HEADER_SIZE + programLen * 2,
    ]);
  });

  it("rounds a partial final chunk up when counting fees", async () => {
    const { connection } = connectionWithRent();
    // 901 bytes = 2 chunks, so 4 txs in total.
    const estimate = await estimateDeployCost(connection, 901);
    expect(estimate.feeLamports).toBe(4 * 6_000);
  });
});
