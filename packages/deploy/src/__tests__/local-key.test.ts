import { describe, it, expect, vi } from "vitest";
import {
  Keypair,
  SystemProgram,
  Transaction,
  type Connection,
  type PublicKey,
} from "@solana/web3.js";
import { BPF_LOADER_UPGRADEABLE_ID } from "../constants";
import { closeBuffer, getCachedBinary, setCachedBinary } from "../deploy";
import { keypairSigner } from "../keypair-signer";
import { isResumableDeploymentState } from "../resume-state";
import type { DeploymentState } from "../types";

const BLOCKHASH = "11111111111111111111111111111111";
/** 5 chunks at CHUNK_SIZE=900. */
const BINARY = new Uint8Array(4500).fill(7);

function transfer(from: PublicKey): Transaction {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: Keypair.generate().publicKey,
      lamports: 1,
    })
  );
  tx.feePayer = from;
  tx.recentBlockhash = BLOCKHASH;
  return tx;
}

describe("keypairSigner", () => {
  it("signs one transaction and a batch with the keypair, with no prompt", async () => {
    const keypair = Keypair.generate();
    const signer = keypairSigner(keypair);
    expect(signer.publicKey?.equals(keypair.publicKey)).toBe(true);

    const one = await signer.signTransaction(transfer(keypair.publicKey));
    expect(one.verifySignatures()).toBe(true);

    const batch = await signer.signAllTransactions([
      transfer(keypair.publicKey),
      transfer(keypair.publicKey),
    ]);
    expect(batch.every((tx) => tx.verifySignatures())).toBe(true);
  });
});

describe("getCachedBinary", () => {
  it("returns the cached bytes, or null when the build is not cached", () => {
    setCachedBinary("uuid-cached", BINARY);
    expect(getCachedBinary("uuid-cached")).toBe(BINARY);
    expect(getCachedBinary("uuid-unknown")).toBeNull();
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

describe("closeBuffer", () => {
  function harness(bufferExists: boolean) {
    const sent: Transaction[] = [];
    const connection = {
      getAccountInfo: vi.fn(async () =>
        bufferExists ? { data: Buffer.alloc(0) } : null
      ),
      getLatestBlockhash: vi.fn(async () => ({
        blockhash: BLOCKHASH,
        lastValidBlockHeight: 1000,
      })),
      sendRawTransaction: vi.fn(async (raw: Uint8Array) => {
        sent.push(Transaction.from(raw));
        return "close-sig";
      }),
      confirmTransaction: vi.fn(async () => ({ value: { err: null } })),
    } as unknown as Connection;
    return { connection, sent };
  }

  it("closes the buffer to the signer, signed by the signer alone", async () => {
    const owner = Keypair.generate();
    const buffer = Keypair.generate();
    const { connection, sent } = harness(true);

    const signature = await closeBuffer({
      connection,
      wallet: keypairSigner(owner),
      bufferKeypairSecret: Array.from(buffer.secretKey),
    });

    expect(signature).toBe("close-sig");
    expect(sent).toHaveLength(1);
    const tx = sent[0] as Transaction;
    expect(tx.feePayer?.equals(owner.publicKey)).toBe(true);
    expect(tx.verifySignatures()).toBe(true);
    const close = tx.instructions.find((ix) =>
      ix.programId.equals(BPF_LOADER_UPGRADEABLE_ID)
    );
    // Close: [buffer, recipient, authority]. The rent goes back to the signer.
    expect(close?.keys.map((k) => k.pubkey.toBase58())).toEqual([
      buffer.publicKey.toBase58(),
      owner.publicKey.toBase58(),
      owner.publicKey.toBase58(),
    ]);
  });

  it("sends nothing when the buffer account is already gone", async () => {
    const { connection, sent } = harness(false);

    const signature = await closeBuffer({
      connection,
      wallet: keypairSigner(Keypair.generate()),
      bufferKeypairSecret: Array.from(Keypair.generate().secretKey),
    });

    expect(signature).toBeNull();
    expect(sent).toHaveLength(0);
  });
});
