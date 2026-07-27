import {
  Connection,
  ComputeBudgetProgram,
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
 * BATCH_SIZE controls how many write txs are signed at once via
 * signAllTransactions. Each batch = 1 wallet popup, so this is the main lever
 * for the "too many prompts" complaint (#349) — without giving up the
 * reliability work in #348 (priority fees + poll-and-rebroadcast, both
 * unchanged below).
 *
 * Raised 20 -> 50 (#349). A typical buildable-challenge .so is roughly
 * 100-250 KB, i.e. ~110-280 chunks at CHUNK_SIZE=900B: BATCH_SIZE=50 turns
 * that into ~3-6 upload-batch prompts (+2 for buffer-create/finalize)
 * instead of ~6-14.
 *
 * Blockhash-window budget per batch (a recent blockhash is valid ~150 slots,
 * ~60-90s on devnet) at BATCH_SIZE=50 (#776 updated the dispatch + resend math):
 *   - dispatch all 50 via the bounded pool (SEND_CONCURRENCY=12,
 *     ~ceil(50/12)=5 waves of ~1 RTT):                             ≈ 0.5-2s
 *   - typical confirm (priority fee lands most on the first send): ≈ 1-2s
 *   - pessimistic confirm (a few chunks dropped, 1-2 rebroadcast
 *     cycles at the ~4s base cadence in confirmBatch, each capped
 *     at MAX_RESENDS_PER_CYCLE and staggered):                     ≈ 8-12s
 *   realistic worst case total                                     ≈ 12-20s
 * — comfortably inside the ~90s window, with room left over for the time the
 * user takes to see the wallet popup and click Approve (that delay counts
 * against the same blockhash, since it's fetched just before signing).
 *
 * The whole batch shares the ONE blockhash fetched just before signing; neither
 * the send pool nor the resend loop re-fetches or re-signs, so both only spend
 * the window faster/leaner, never extend what must fit in it.
 *
 * Why not go straight to 100+ (the issue's outer bound): a resend cycle is now
 * capped at MAX_RESENDS_PER_CYCLE and backs off on 429, so a bad pass no longer
 * fires the whole set back-to-back; but at 100+ a batch that mostly drops still
 * needs several capped cycles to re-cover, and clearing it inside one blockhash
 * window gets tight. 50 keeps a full recovery comfortably inside the window.
 */
const BATCH_SIZE = 50;

/** Small stagger between staggered rebroadcast sends to avoid RPC rate limits. */
const SEND_DELAY_MS = 50;

/**
 * Max write-txs kept in flight when firing an upload batch (item 3 / #776).
 * Replaces the old one-RTT-per-tx serial loop. 12 sits in the issue's 8–16
 * band: enough to collapse a 50-tx batch's dispatch from ~50 serial round trips
 * to ~5 waves, while staying well under a keyed RPC's rate limit so the initial
 * burst itself does not provoke the 429s that confirmBatch then has to nurse.
 */
const SEND_CONCURRENCY = 12;

/**
 * Priority fee (compute-unit price, micro-lamports) added to every deploy tx.
 * Without it, devnet leaders drop the rapid write txs under load — the RPC
 * accepts them (200) but they never land. A write ix burns only a few thousand
 * CU, so even this rate costs a tiny fraction of a lamport per tx while making
 * inclusion far more reliable.
 */
const PRIORITY_FEE_MICROLAMPORTS = 100_000;

/**
 * Compute-unit LIMIT for a single buffer WRITE tx (item 4 / #776).
 *
 * A Loader-v3 Write instruction is a bounded memcpy of <=CHUNK_SIZE (900) bytes
 * into the buffer account; the Anchor CLI measures it at ~2,670 CU and sets its
 * own tight `WRITE_COMPUTE_UNIT_LIMIT` on exactly these txs. Plus the two
 * ComputeBudget ixs (~150 CU each), a write tx consumes ~3k CU.
 *
 * Without an explicit limit each non-builtin ix is reserved the ~200k default,
 * which (a) the leader must reserve when packing — so far fewer write txs fit a
 * block — and (b) is what the priority fee is charged against (fee = price ×
 * REQUESTED limit, not actual). 10k is ~3.5x the measured cost (comfortable
 * headroom for chunk-size variance — a too-tight limit fails the tx outright)
 * while cutting the reserved/charged budget ~20x. Verification is unit-level (no
 * on-chain sends), so the figure is the Anchor-measured cost, not a live sim.
 *
 * Applied ONLY to the write burst — NOT the one-off buffer-create/deploy txs:
 * those are a single tx each (packing is irrelevant) and the deploy ix needs the
 * full default budget for the loader's ELF verification. This mirrors the Anchor
 * CLI, which tightens only its write txs.
 */
const WRITE_CU_LIMIT = 10_000;

/** Compute-unit-price instruction prepended to the one-off (buffer/deploy) txs. */
export function priorityFeeIx() {
  return ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: PRIORITY_FEE_MICROLAMPORTS,
  });
}

/**
 * Compute-budget instructions for a WRITE tx: an explicit unit LIMIT plus the
 * price. The limit is the packing/fee fix (item 4); the price is unchanged.
 */
export function writeComputeBudgetIxs() {
  return [
    ComputeBudgetProgram.setComputeUnitLimit({ units: WRITE_CU_LIMIT }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: PRIORITY_FEE_MICROLAMPORTS,
    }),
  ];
}

/**
 * Fire a batch of pre-signed, serialized txs with BOUNDED concurrency, returning
 * index-aligned signatures (item 3 / #776). Up to `concurrency` sends are in
 * flight at once, replacing the old one-`await`-per-tx serial loop that cost one
 * RTT + a 50ms sleep per chunk (~20–40s for a 100KB program). `signatures[i]`
 * corresponds to `serializedTxs[i]` — the alignment confirmBatch relies on to
 * rebroadcast the right bytes for a dropped signature.
 *
 * Blockhash-window interaction: the caller fetched ONE blockhash for the whole
 * batch and signed every tx against it; this pool only compresses the DISPATCH
 * phase and never re-signs or re-fetches, so it does not change any tx's
 * validity. It strictly WIDENS the confirmation margin inside the same ~150-slot
 * (~60–90s devnet) window — all N are simply sent sooner — rather than consuming
 * more of it. Concurrency stays modest so the burst itself does not trip the RPC
 * rate limit (a 429 storm would delay landing and eat the window instead).
 */
export async function sendAllBounded(
  connection: Connection,
  serializedTxs: Uint8Array[],
  concurrency = SEND_CONCURRENCY
): Promise<string[]> {
  const signatures = new Array<string>(serializedTxs.length);
  let cursor = 0;
  const worker = async (): Promise<void> => {
    for (let i = cursor++; i < serializedTxs.length; i = cursor++) {
      signatures[i] = await sendWithRetry(connection, serializedTxs[i]!);
    }
  };
  const workerCount = Math.min(concurrency, serializedTxs.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return signatures;
}

/** Base interval between rebroadcast cycles in confirmBatch (item 7 / #776). */
const RESEND_INTERVAL_MS = 4_000;
/** Ceiling for the backed-off rebroadcast interval after 429s (item 7). */
const MAX_RESEND_INTERVAL_MS = 30_000;
/**
 * Max txs rebroadcast per cycle — caps the old up-to-50 back-to-back resend
 * storm so one cycle can't burn a large fraction of the blockhash window (item
 * 7). The still-unconfirmed remainder is picked up on the next cycle.
 */
const MAX_RESENDS_PER_CYCLE = 15;

/** True if an RPC error looks like an HTTP 429 / rate-limit response. */
export function is429(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b429\b|too many requests|rate.?limit/i.test(msg);
}

/**
 * Retry-After delay (ms) parsed from an error message if the RPC surfaced one,
 * else null. web3.js flattens the HTTP response into an Error message, so this
 * is a best-effort scrape of a "Retry-After: N" / "retry after N seconds" hint.
 */
export function parseRetryAfterMs(err: unknown): number | null {
  const msg = err instanceof Error ? err.message : String(err);
  const m = /retry[- ]?after[:\s]+(\d+)/i.exec(msg);
  if (!m) return null;
  const seconds = Number(m[1]);
  return Number.isFinite(seconds) ? seconds * 1000 : null;
}

/**
 * Next rebroadcast interval after a resend cycle (item 7). A 429 WIDENS the
 * cadence — honoring an explicit Retry-After when present, else exponential
 * (double) — capped at MAX_RESEND_INTERVAL_MS. Any clean cycle relaxes back to
 * the base cadence. `err` is null when the cycle hit no 429.
 */
export function nextResendInterval(
  current: number,
  err: unknown | null
): number {
  if (err !== null && is429(err)) {
    const retryAfter = parseRetryAfterMs(err);
    return Math.min(retryAfter ?? current * 2, MAX_RESEND_INTERVAL_MS);
  }
  return RESEND_INTERVAL_MS;
}

/**
 * Confirm multiple transactions in parallel using batch polling.
 * Uses `getSignatureStatuses` (one RPC call per poll cycle) instead of N
 * separate WebSocket subscriptions from `confirmTransaction`.
 *
 * This is how the Solana CLI confirms deploys — much faster than sequential.
 */
export async function confirmBatch(
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
  // Rebroadcast cadence, widened on 429 and relaxed on a clean cycle (item 7).
  let resendIntervalMs = RESEND_INTERVAL_MS;

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

    // Rebroadcast still-unconfirmed txs: devnet drops transactions under load,
    // and the RPC won't rebroadcast them for us (maxRetries: 0), so a dropped
    // chunk would otherwise never land and the batch would stall. Re-sending the
    // same signed tx is safe (idempotent) while its blockhash is still valid,
    // which the BATCH_SIZE tuning above keeps us inside even pessimistically.
    //
    // Unlike the old loop — which re-fired the ENTIRE unconfirmed set back to
    // back and swallowed every error including 429s — this (item 7 / #776):
    //   • caps the cycle at MAX_RESENDS_PER_CYCLE (a big batch can't turn one
    //     resend into a 50-deep synchronous RPC storm),
    //   • STAGGERS each resend by SEND_DELAY_MS, and
    //   • BACKS OFF on a 429: stops hammering for the rest of the cycle and
    //     widens the interval (Retry-After if given, else exponential).
    if (unconfirmed.size > 0 && Date.now() - lastResend > resendIntervalMs) {
      const toResend = [...unconfirmed.values()].slice(
        0,
        MAX_RESENDS_PER_CYCLE
      );
      let cycleErr: unknown | null = null;
      for (const idx of toResend) {
        try {
          await connection.sendRawTransaction(serializedTxs[idx]!, {
            skipPreflight: true,
            maxRetries: 0,
          });
        } catch (err) {
          if (is429(err)) {
            // Rate-limited — stop this cycle and let the interval widen below.
            cycleErr = err;
            break;
          }
          // Non-429: ignore; the next cycle picks it up.
        }
        await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
      }
      resendIntervalMs = nextResendInterval(resendIntervalMs, cycleErr);
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
    priorityFeeIx(),
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
        ...writeComputeBudgetIxs(),
        createWriteInstruction(bufferKeypair.publicKey, payer, offset, chunk)
      );
      writeTx.feePayer = payer;
      writeTx.recentBlockhash = blockhash;
      batchTxs.push(writeTx);
    }

    // Let the UI know which batch (of how many) is about to prompt the
    // wallet, before the popup actually appears.
    callbacks.onBatchStart({
      batchNumber: Math.floor(batchStart / BATCH_SIZE) + 1,
      totalBatches: Math.ceil(totalChunks / BATCH_SIZE),
    });

    // Batch sign (1 wallet popup per batch)
    const signedBatch = await wallet.signAllTransactions(batchTxs);

    // Serialize (kept so confirmBatch can rebroadcast any that get dropped),
    // then fire the whole batch with BOUNDED concurrency. Signatures come back
    // index-aligned to serializedTxs, which confirmBatch's bookkeeping requires.
    const serializedTxs = signedBatch.map((tx) => tx.serialize());
    const signatures = await sendAllBounded(connection, serializedTxs);

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
    priorityFeeIx(),
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
          priorityFeeIx(),
          createWriteInstruction(bufferKeypair.publicKey, payer, offset, chunk)
        );
        writeTx.feePayer = payer;
        writeTx.recentBlockhash = blockhash;
        batchTxs.push(writeTx);
      }

      // Let the UI know which batch (of how many) is about to prompt the
      // wallet, before the popup actually appears.
      callbacks.onBatchStart({
        batchNumber: Math.floor(batchStart / BATCH_SIZE) + 1,
        totalBatches: Math.ceil(totalChunks / BATCH_SIZE),
      });

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
  deployTx.add(priorityFeeIx());

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
