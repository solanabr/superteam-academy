import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  BPF_LOADER_UPGRADEABLE_ID,
  CHUNK_SIZE,
  BUFFER_HEADER_SIZE,
  PROGRAM_ACCOUNT_SIZE,
} from "./constants";
import {
  createInitializeBufferInstruction,
  createWriteInstruction,
  createDeployInstruction,
  createCloseBufferInstruction,
} from "./instructions";
import type {
  WalletAdapter,
  DeploymentCallbacks,
  DeploymentState,
  DeployResult,
} from "./types";

/**
 * Client-side binary cache stored on globalThis so it is shared across all
 * webpack dynamic-import chunks (module-level Maps can be duplicated when
 * Next.js creates separate chunks for each `dynamic()` import).
 */
const CACHE_KEY = "__academyBinaryCache";

function getGlobalCache(): Map<string, Uint8Array> {
  const g = globalThis as Record<string, unknown>;
  if (!(g[CACHE_KEY] instanceof Map)) {
    g[CACHE_KEY] = new Map<string, Uint8Array>();
  }
  return g[CACHE_KEY] as Map<string, Uint8Array>;
}

export function setCachedBinary(uuid: string, data: Uint8Array): void {
  getGlobalCache().set(uuid, data);
}

/**
 * Retrieve the compiled .so binary cached client-side after build.
 *
 * The build server returns the binary INLINE (binaryB64), which is stored in the
 * global cache via `setCachedBinary` at build time — there is no
 * `/api/deploy/:uuid` route to re-fetch it from. We intentionally do NOT delete
 * the cache entry on read: a paused deploy is resumed by reading the binary
 * again, and deleting it made the resume miss and 404 against the (removed)
 * fetch route. A genuine miss means the in-memory copy was lost (e.g. a full
 * page reload mid-deploy), which the caller treats as "expired → rebuild".
 */
function fetchBinary(uuid: string): Uint8Array {
  const cached = getGlobalCache().get(uuid);
  if (!cached) {
    throw new Error(
      "The compiled program is no longer available in this session (the build expired). Please rebuild it before deploying."
    );
  }
  return cached;
}

/**
 * Send a signed transaction with retry logic.
 */
async function sendWithRetry(
  connection: Connection,
  serializedTx: Uint8Array,
  maxRetries = 3
): Promise<string> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const sig = await connection.sendRawTransaction(serializedTx, {
        skipPreflight: true,
        maxRetries: 0,
      });
      return sig;
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

/**
 * Confirm a transaction with timeout.
 */
async function confirmTx(
  connection: Connection,
  signature: string,
  blockhash: string,
  lastValidBlockHeight: number
): Promise<void> {
  const result = await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );
  if (result.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(result.value.err)}`);
  }
}

/**
 * BATCH_SIZE controls how many write txs we sign at once via signAllTransactions.
 * Each batch = 1 wallet popup. Kept modest (not 50) so a rate-limited devnet RPC
 * isn't flooded — with rebroadcast (see confirmBatch) the whole batch reliably
 * confirms inside the blockhash window, and the resend burst stays under the
 * RPC's per-second limit.
 */
const BATCH_SIZE = 20;

/** Small stagger between sends to avoid RPC rate limits. */
const SEND_DELAY_MS = 50;

/**
 * Confirm multiple transactions in parallel using batch polling.
 * Uses `getSignatureStatuses` (one RPC call per poll cycle) instead of N
 * separate WebSocket subscriptions from `confirmTransaction`.
 *
 * This is how the Solana CLI confirms deploys — much faster than sequential.
 */
async function confirmBatch(
  connection: Connection,
  serializedTxs: Uint8Array[],
  signatures: string[],
  onConfirmed?: (localIndex: number, sig: string) => void,
  timeoutMs = 90_000
): Promise<void> {
  const unconfirmed = new Map<string, number>();
  for (let i = 0; i < signatures.length; i++) {
    unconfirmed.set(signatures[i]!, i);
  }

  const start = Date.now();
  // The txs were just sent by the caller; wait a beat before the first resend.
  let lastResend = Date.now();

  while (unconfirmed.size > 0) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timed out confirming ${unconfirmed.size}/${signatures.length} chunk transactions`
      );
    }

    await new Promise((r) => setTimeout(r, 700));

    const pending = [...unconfirmed.keys()];
    const { value: statuses } = await connection.getSignatureStatuses(pending);

    for (let i = 0; i < pending.length; i++) {
      const sig = pending[i]!;
      const status = statuses[i];
      if (!status) continue;

      if (status.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
      }

      if (
        status.confirmationStatus === "confirmed" ||
        status.confirmationStatus === "finalized"
      ) {
        const idx = unconfirmed.get(sig)!;
        unconfirmed.delete(sig);
        onConfirmed?.(idx, sig);
      }
    }

    // Rebroadcast still-unconfirmed txs every ~4s: devnet drops transactions
    // under load, and the RPC won't rebroadcast them for us (maxRetries: 0), so
    // a dropped chunk would otherwise never land and the batch would stall.
    // Re-sending the same signed tx is safe (idempotent) while its blockhash is
    // still valid, which the modest BATCH_SIZE keeps us inside.
    if (unconfirmed.size > 0 && Date.now() - lastResend > 4000) {
      for (const idx of unconfirmed.values()) {
        try {
          await connection.sendRawTransaction(serializedTxs[idx]!, {
            skipPreflight: true,
            maxRetries: 0,
          });
        } catch {
          // Ignore — the next poll cycle will resend.
        }
      }
      lastResend = Date.now();
    }
  }
}

/**
 * Deploy a compiled Solana program to devnet (or any cluster).
 *
 * The deployment follows the standard BPF Loader Upgradeable flow:
 * 1. Create buffer account (holds binary during upload)
 * 2. Write binary in ~1000-byte chunks (batched for fewer wallet popups)
 * 3. Deploy: create program account + link buffer -> program
 *
 * Returns the program ID and deployment stats.
 */
export async function deployProgram(params: {
  connection: Connection;
  wallet: WalletAdapter;
  buildServerUrl: string;
  buildUuid: string;
  callbacks: DeploymentCallbacks;
  /** Pre-generated program keypair (from build-time declare_id injection). */
  programKeypairSecret?: number[];
}): Promise<DeployResult> {
  // `buildServerUrl` is accepted for API compatibility but no longer used: the
  // binary is read from the client-side cache, not fetched over HTTP.
  const { connection, wallet, buildUuid, callbacks } = params;
  const startTime = Date.now();

  if (!wallet.publicKey) throw new Error("Wallet not connected");
  const payer = wallet.publicKey;

  // Fetch the compiled binary
  callbacks.onStepChange("buffer");
  const binary = fetchBinary(buildUuid);
  const programLen = binary.length;
  const totalChunks = Math.ceil(programLen / CHUNK_SIZE);

  // Generate keypairs for buffer and program accounts.
  // If a pre-generated program keypair was provided (from declare_id injection
  // at build time), use it so the deployed address matches declare_id!().
  const bufferKeypair = Keypair.generate();
  const programKeypair = params.programKeypairSecret
    ? Keypair.fromSecretKey(Uint8Array.from(params.programKeypairSecret))
    : Keypair.generate();

  // --- Phase 1: Create buffer account ---
  const bufferSize = BUFFER_HEADER_SIZE + programLen;
  const bufferRent =
    await connection.getMinimumBalanceForRentExemption(bufferSize);

  const { blockhash: bh1, lastValidBlockHeight: lvbh1 } =
    await connection.getLatestBlockhash("confirmed");

  const createBufferTx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: bufferKeypair.publicKey,
      lamports: bufferRent,
      space: bufferSize,
      programId: BPF_LOADER_UPGRADEABLE_ID,
    }),
    createInitializeBufferInstruction(bufferKeypair.publicKey, payer)
  );
  createBufferTx.feePayer = payer;
  createBufferTx.recentBlockhash = bh1;
  createBufferTx.partialSign(bufferKeypair);

  const signedBufferTx = await wallet.signTransaction(createBufferTx);
  const bufferSig = await sendWithRetry(connection, signedBufferTx.serialize());
  await confirmTx(connection, bufferSig, bh1, lvbh1);

  callbacks.onTransactionConfirmed({
    signature: bufferSig,
    step: "buffer",
    message: `Buffer account created: ${bufferKeypair.publicKey.toBase58().slice(0, 8)}...`,
  });

  // Save state for resume capability (exposed to callers via onStateUpdate)
  const state: DeploymentState = {
    buildUuid,
    bufferKeypairSecret: Array.from(bufferKeypair.secretKey),
    programKeypairSecret: Array.from(programKeypair.secretKey),
    lastUploadedChunk: -1,
    totalChunks,
    phase: "buffer_created",
  };
  callbacks.onStateUpdate(state);

  // --- Phase 2: Write chunks in batches ---
  callbacks.onStepChange("upload");
  state.phase = "uploading";

  for (let batchStart = 0; batchStart < totalChunks; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, totalChunks);
    const batchTxs: Transaction[] = [];

    // Get fresh blockhash for each batch (prevents expiry)
    const { blockhash } = await connection.getLatestBlockhash("confirmed");

    for (let i = batchStart; i < batchEnd; i++) {
      const offset = i * CHUNK_SIZE;
      const chunk = binary.slice(offset, offset + CHUNK_SIZE);

      const writeTx = new Transaction().add(
        createWriteInstruction(bufferKeypair.publicKey, payer, offset, chunk)
      );
      writeTx.feePayer = payer;
      writeTx.recentBlockhash = blockhash;
      batchTxs.push(writeTx);
    }

    // Batch sign (1 wallet popup per batch)
    const signedBatch = await wallet.signAllTransactions(batchTxs);

    // Send all txs rapidly (parallel fire with small stagger). Keep each
    // serialized so confirmBatch can rebroadcast any that get dropped.
    const signatures: string[] = [];
    const serializedTxs: Uint8Array[] = [];
    for (let j = 0; j < signedBatch.length; j++) {
      const serialized = signedBatch[j]!.serialize();
      serializedTxs.push(serialized);
      const sig = await sendWithRetry(connection, serialized);
      signatures.push(sig);
      if (j < signedBatch.length - 1) {
        await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
      }
    }

    // Confirm all via batch polling; rebroadcasts dropped txs until they land.
    let batchConfirmed = 0;
    await confirmBatch(
      connection,
      serializedTxs,
      signatures,
      (localIdx, sig) => {
        batchConfirmed++;
        const chunkIndex = batchStart + localIdx;
        callbacks.onChunkProgress(batchStart + batchConfirmed, totalChunks);
        callbacks.onTransactionConfirmed({
          signature: sig,
          step: "upload",
          message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded`,
        });
      }
    );

    state.lastUploadedChunk = batchEnd - 1;
    callbacks.onStateUpdate(state);
  }

  // --- Phase 3: Create program account + deploy ---
  callbacks.onStepChange("finalize");
  state.phase = "finalizing";
  callbacks.onStateUpdate(state);

  const [programDataAddress] = PublicKey.findProgramAddressSync(
    [programKeypair.publicKey.toBuffer()],
    BPF_LOADER_UPGRADEABLE_ID
  );

  const programAccountRent =
    await connection.getMinimumBalanceForRentExemption(PROGRAM_ACCOUNT_SIZE);

  const { blockhash: bh3, lastValidBlockHeight: lvbh3 } =
    await connection.getLatestBlockhash("confirmed");

  const deployTx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: programKeypair.publicKey,
      lamports: programAccountRent,
      space: PROGRAM_ACCOUNT_SIZE,
      programId: BPF_LOADER_UPGRADEABLE_ID,
    }),
    createDeployInstruction(
      payer,
      programDataAddress,
      programKeypair.publicKey,
      bufferKeypair.publicKey,
      payer,
      programLen * 2 // 2x for future upgrades
    )
  );
  deployTx.feePayer = payer;
  deployTx.recentBlockhash = bh3;
  deployTx.partialSign(programKeypair);

  const signedDeployTx = await wallet.signTransaction(deployTx);
  const deploySig = await sendWithRetry(connection, signedDeployTx.serialize());
  await confirmTx(connection, deploySig, bh3, lvbh3);

  callbacks.onTransactionConfirmed({
    signature: deploySig,
    step: "finalize",
    message: `Program deployed: ${programKeypair.publicKey.toBase58()}`,
  });

  callbacks.onStepChange("complete");
  state.phase = "complete";

  return {
    programId: programKeypair.publicKey.toBase58(),
    programIdPubkey: programKeypair.publicKey,
    totalChunks,
    durationMs: Date.now() - startTime,
    rentLamports: bufferRent + programAccountRent,
  };
}

/**
 * Resume a failed deployment from the last successfully uploaded chunk.
 * Reuses the existing buffer account on-chain.
 */
export async function resumeDeployment(params: {
  connection: Connection;
  wallet: WalletAdapter;
  buildServerUrl: string;
  state: DeploymentState;
  callbacks: DeploymentCallbacks;
}): Promise<DeployResult> {
  // `buildServerUrl` accepted for API compatibility but unused (see deployProgram).
  const { connection, wallet, state, callbacks } = params;
  const startTime = Date.now();

  if (!wallet.publicKey) throw new Error("Wallet not connected");
  const payer = wallet.publicKey;

  const bufferKeypair = Keypair.fromSecretKey(
    Uint8Array.from(state.bufferKeypairSecret)
  );
  const programKeypair = Keypair.fromSecretKey(
    Uint8Array.from(state.programKeypairSecret)
  );

  // Verify buffer account still exists
  const bufferInfo = await connection.getAccountInfo(bufferKeypair.publicKey);
  if (!bufferInfo) {
    throw new Error(
      "Buffer account no longer exists. Please start a new deployment."
    );
  }

  // Read the cached binary again (kept in-cache so resume can re-read it)
  const binary = fetchBinary(state.buildUuid);
  const programLen = binary.length;
  const totalChunks = state.totalChunks;
  const startChunk = state.lastUploadedChunk + 1;

  if (state.phase === "uploading" || state.phase === "buffer_created") {
    // Resume uploading from where we left off
    callbacks.onStepChange("upload");

    for (
      let batchStart = startChunk;
      batchStart < totalChunks;
      batchStart += BATCH_SIZE
    ) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, totalChunks);
      const batchTxs: Transaction[] = [];

      const { blockhash } = await connection.getLatestBlockhash("confirmed");

      for (let i = batchStart; i < batchEnd; i++) {
        const offset = i * CHUNK_SIZE;
        const chunk = binary.slice(offset, offset + CHUNK_SIZE);

        const writeTx = new Transaction().add(
          createWriteInstruction(bufferKeypair.publicKey, payer, offset, chunk)
        );
        writeTx.feePayer = payer;
        writeTx.recentBlockhash = blockhash;
        batchTxs.push(writeTx);
      }

      const signedBatch = await wallet.signAllTransactions(batchTxs);

      // Send all txs rapidly (parallel fire with small stagger). Keep each
      // serialized so confirmBatch can rebroadcast any that get dropped.
      const signatures: string[] = [];
      const serializedTxs: Uint8Array[] = [];
      for (let j = 0; j < signedBatch.length; j++) {
        const serialized = signedBatch[j]!.serialize();
        serializedTxs.push(serialized);
        const sig = await sendWithRetry(connection, serialized);
        signatures.push(sig);
        if (j < signedBatch.length - 1) {
          await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
        }
      }

      // Confirm all via batch polling; rebroadcasts dropped txs until they land.
      let batchConfirmed = 0;
      await confirmBatch(
        connection,
        serializedTxs,
        signatures,
        (localIdx, sig) => {
          batchConfirmed++;
          const chunkIndex = batchStart + localIdx;
          callbacks.onChunkProgress(batchStart + batchConfirmed, totalChunks);
          callbacks.onTransactionConfirmed({
            signature: sig,
            step: "upload",
            message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded`,
          });
        }
      );

      state.lastUploadedChunk = batchEnd - 1;
      callbacks.onStateUpdate(state);
    }
  }

  // Finalize deployment
  callbacks.onStepChange("finalize");

  const [programDataAddress] = PublicKey.findProgramAddressSync(
    [programKeypair.publicKey.toBuffer()],
    BPF_LOADER_UPGRADEABLE_ID
  );

  const programAccountRent =
    await connection.getMinimumBalanceForRentExemption(PROGRAM_ACCOUNT_SIZE);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  // Check if program account already exists (possible if previous resume failed
  // after createAccount succeeded but before deploy instruction confirmed)
  const existingProgramInfo = await connection.getAccountInfo(
    programKeypair.publicKey
  );

  const deployTx = new Transaction();

  if (!existingProgramInfo) {
    deployTx.add(
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: programKeypair.publicKey,
        lamports: programAccountRent,
        space: PROGRAM_ACCOUNT_SIZE,
        programId: BPF_LOADER_UPGRADEABLE_ID,
      })
    );
  }

  deployTx.add(
    createDeployInstruction(
      payer,
      programDataAddress,
      programKeypair.publicKey,
      bufferKeypair.publicKey,
      payer,
      programLen * 2
    )
  );
  deployTx.feePayer = payer;
  deployTx.recentBlockhash = blockhash;

  if (!existingProgramInfo) {
    deployTx.partialSign(programKeypair);
  }

  const signedDeployTx = await wallet.signTransaction(deployTx);
  const deploySig = await sendWithRetry(connection, signedDeployTx.serialize());
  await confirmTx(connection, deploySig, blockhash, lastValidBlockHeight);

  callbacks.onTransactionConfirmed({
    signature: deploySig,
    step: "finalize",
    message: `Program deployed: ${programKeypair.publicKey.toBase58()}`,
  });

  callbacks.onStepChange("complete");

  return {
    programId: programKeypair.publicKey.toBase58(),
    programIdPubkey: programKeypair.publicKey,
    totalChunks,
    durationMs: Date.now() - startTime,
    rentLamports: programAccountRent,
  };
}

/**
 * Close a buffer account and reclaim rent SOL.
 * Useful after failed deployments or cleanup.
 */
export async function closeBuffer(params: {
  connection: Connection;
  wallet: WalletAdapter;
  bufferKeypairSecret: number[];
}): Promise<string> {
  const { connection, wallet } = params;
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const bufferKeypair = Keypair.fromSecretKey(
    Uint8Array.from(params.bufferKeypairSecret)
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const closeTx = new Transaction().add(
    createCloseBufferInstruction(
      bufferKeypair.publicKey,
      wallet.publicKey,
      wallet.publicKey
    )
  );
  closeTx.feePayer = wallet.publicKey;
  closeTx.recentBlockhash = blockhash;

  const signedTx = await wallet.signTransaction(closeTx);
  const sig = await sendWithRetry(connection, signedTx.serialize());
  await confirmTx(connection, sig, blockhash, lastValidBlockHeight);
  return sig;
}
