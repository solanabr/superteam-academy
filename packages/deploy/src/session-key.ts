import {
  Connection,
  Keypair,
  PublicKey,
  type SignatureStatus,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  BPF_LOADER_UPGRADEABLE_ID,
  BUFFER_HEADER_SIZE,
  CHUNK_SIZE,
} from "./constants";
import { estimateSessionKeyDeployCost } from "./cost";
import {
  confirmTx,
  deployProgram,
  getCachedBinaryLength,
  priorityFeeIx,
  resumeDeployment,
  sendWithRetry,
} from "./deploy";
import {
  createCloseBufferInstruction,
  createSetAuthorityInstruction,
} from "./instructions";
import type {
  DeploymentCallbacks,
  DeploymentState,
  DeployResult,
  WalletAdapter,
} from "./types";

/**
 * Deploying through a locally generated session key.
 *
 * An embedded (Dynamic) wallet signs through an MPC service, one network round
 * trip per signature, rate-limited. A 74-chunk program is 76 signatures, which
 * in production hit `WalletApiError: Rate limited` at chunk 3. So the embedded
 * wallet signs exactly ONE transaction — a SystemProgram transfer of the
 * estimated cost into a fresh keypair — and that keypair, held only in this
 * browser tab, is payer and authority for the whole upload. When the deploy
 * confirms, a Loader-v3 `SetAuthority` moves the upgrade authority to the
 * learner (the new authority does not sign, so no second MPC signature), and
 * the session key sweeps its remainder back.
 *
 * The learner still pays every lamport from their own wallet and still owns the
 * program: `verifyProgramDeployment` on the server keeps requiring
 * `upgrade_authority == profiles.wallet_address`, and only the SetAuthority
 * makes that true.
 */

/** Base fee for the single-signature sweep transaction. */
const SWEEP_FEE_LAMPORTS = 5_000;

/** How long to wait for the learner's funding transfer to land. */
const FUNDING_TIMEOUT_MS = 90_000;
const FUNDING_POLL_MS = 1_500;

/**
 * How long to wait on a funding signature left over from an attempt that threw.
 * Long enough to outlive the blockhash it was signed with (~90 s): a transfer
 * that is merely slow must not be declared lost while it can still land.
 */
const PENDING_FUNDING_TIMEOUT_MS = 90_000;
const PENDING_FUNDING_POLL_MS = 3_000;

/** Attempts for `SetAuthority`, which must succeed or the deploy is unowned. */
const AUTHORITY_ATTEMPTS = 4;
const AUTHORITY_BACKOFF_MS = 1_000;

const BUFFER_STATE_TAG = 1;
/** Buffer layout: tag(u32) | Option flag(u8) | authority(32). */
const BUFFER_AUTHORITY_OPTION_OFFSET = 4;
const BUFFER_AUTHORITY_OFFSET = 5;

export interface SessionKeyEvents {
  /**
   * The session key exists, before a single lamport moves. Callers persist the
   * secret HERE — a crash between the transfer and the first write would
   * otherwise strand the funds with no key to spend them.
   */
  onSessionKey?: (secret: number[], publicKey: PublicKey) => void;
  /**
   * The funding transfer has a signature — it is on the wire, and may land even
   * if the very next line throws. Callers persist it HERE, so a retry can ask
   * the cluster what happened instead of transferring a second time.
   */
  onFundingBroadcast?: (info: { signature: string }) => void;
  onFunded?: (info: { lamports: number; signature: string }) => void;
  onOwnershipTransferred?: (info: {
    signature: string;
    newAuthority: PublicKey;
  }) => void;
  onRefunded?: (info: { signature: string; lamports: number }) => void;
  onRefundFailed?: (info: { sessionKey: PublicKey; message: string }) => void;
}

export interface SessionKeyDeployParams {
  connection: Connection;
  /** The learner's wallet: funds the session key, ends up owning the program. */
  learner: PublicKey;
  buildUuid: string;
  /**
   * Sign and send the funding transfer from the learner's wallet, returning its
   * signature. This is the ONE transaction the embedded wallet signs.
   *
   * `onSignature` is called with the signature BEFORE the transaction is
   * broadcast, because a `fund` that throws after broadcasting still moves the
   * learner's SOL — and without the signature a retry has no way to find out.
   */
  fund: (
    lamports: number,
    to: PublicKey,
    onSignature: (signature: string) => void
  ) => Promise<string>;
  callbacks: DeploymentCallbacks;
  programKeypairSecret?: number[];
  /** Session-key secret from a paused deploy; a new key is generated without it. */
  persistedSessionKey?: number[] | null;
  /** Deployment state from a paused deploy — set together with the key. */
  resumeState?: DeploymentState | null;
  /**
   * A funding signature persisted by an attempt that threw before it could
   * confirm. Passed with `persistedSessionKey` and no `resumeState`: the upload
   * never started, but the transfer may well have landed.
   */
  pendingFundingSignature?: string | null;
  events?: SessionKeyEvents;
}

export interface SessionKeyDeployResult extends DeployResult {
  sessionKeySecret: number[];
  /** 0 on a resume, which reuses the transfer the first attempt already made. */
  fundedLamports: number;
  authoritySignature: string;
  refundLamports: number;
  /** Set when the sweep failed; the deploy itself is complete regardless. */
  refundError: string | null;
}

/**
 * The session key as a `WalletAdapter`, signing locally.
 *
 * `signAllTransactions` has no batch ceiling here: the reason a batch is capped
 * at all is remote-signer latency against the shared blockhash, and a
 * `partialSign` costs microseconds.
 */
export function keypairSigner(keypair: Keypair): WalletAdapter {
  return {
    publicKey: keypair.publicKey,
    signTransaction: async (tx) => {
      tx.partialSign(keypair);
      return tx;
    },
    signAllTransactions: async (txs) => {
      for (const tx of txs) tx.partialSign(keypair);
      return txs;
    },
  };
}

/**
 * The learner's one transaction: move `lamports` into the session key.
 *
 * Built here rather than at the call site so the payer can never drift from
 * the learner — the fee, like the funds, is theirs.
 */
export function createFundingTransfer(params: {
  learner: PublicKey;
  sessionKey: PublicKey;
  lamports: number;
  blockhash: string;
}): Transaction {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: params.learner,
      toPubkey: params.sessionKey,
      lamports: params.lamports,
    })
  );
  tx.feePayer = params.learner;
  tx.recentBlockhash = params.blockhash;
  return tx;
}

/**
 * Raised when the deploy landed but the upgrade authority is still the session
 * key. The program is on-chain and paid for; the panel offers "claim
 * ownership", which re-runs only `transferProgramAuthority`.
 *
 * It carries the program it deployed and the session key's ADDRESS — never the
 * secret. An error object gets rethrown, logged and captured by Sentry; a
 * spendable key riding on one is a live key in an error report. The caller
 * already holds the secret (it persisted it from `onSessionKey`), so putting it
 * here bought nothing.
 */
export class OwnershipTransferError extends Error {
  constructor(
    message: string,
    readonly deployResult: DeployResult,
    readonly sessionKeyAddress: PublicKey
  ) {
    super(message);
    this.name = "OwnershipTransferError";
  }

  get programId(): PublicKey {
    return this.deployResult.programIdPubkey;
  }
}

function toKeypair(secret: number[]): Keypair {
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function sameBytes(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((byte, i) => byte === b[i]);
}

/**
 * Is this saved state safe to resume into?
 *
 * Saved state comes back from `sessionStorage`, which anything running in the
 * origin can write. Resuming replays rent-paying transactions against whatever
 * accounts the state names, so a crafted state is a way to make a learner fund
 * an attacker's buffer or, worse, deploy the lesson's binary to an attacker's
 * program id. Every field that names an account is therefore checked against
 * something this session already knows: the build it belongs to, and the
 * program keypair the build server injected via `declare_id!`.
 */
export function isResumableDeploymentState(
  state: unknown,
  expected: { buildUuid: string; programKeypairSecret?: number[] }
): state is DeploymentState {
  if (typeof state !== "object" || state === null) return false;
  const candidate = state as Partial<DeploymentState>;

  if (candidate.buildUuid !== expected.buildUuid) return false;
  if (
    typeof candidate.totalChunks !== "number" ||
    candidate.totalChunks <= 0 ||
    !Number.isInteger(candidate.totalChunks)
  ) {
    return false;
  }
  if (
    typeof candidate.lastUploadedChunk !== "number" ||
    !Number.isInteger(candidate.lastUploadedChunk) ||
    candidate.lastUploadedChunk < -1 ||
    candidate.lastUploadedChunk >= candidate.totalChunks
  ) {
    return false;
  }

  const cachedLen = getCachedBinaryLength(expected.buildUuid);
  if (
    cachedLen !== null &&
    candidate.totalChunks !== Math.ceil(cachedLen / CHUNK_SIZE)
  ) {
    return false;
  }

  if (
    !isKeypairSecret(candidate.bufferKeypairSecret) ||
    !isKeypairSecret(candidate.programKeypairSecret)
  ) {
    return false;
  }

  // The deployed address must be the one `declare_id!()` was compiled with, so
  // a swapped program keypair — the crafted state that would hand the deploy to
  // someone else's program id — cannot be resumed into.
  if (
    expected.programKeypairSecret &&
    !sameBytes(candidate.programKeypairSecret, expected.programKeypairSecret)
  ) {
    return false;
  }

  return (
    candidate.phase === "buffer_created" ||
    candidate.phase === "uploading" ||
    candidate.phase === "finalizing" ||
    candidate.phase === "complete"
  );
}

function isKeypairSecret(value: unknown): value is number[] {
  if (!Array.isArray(value) || value.length !== 64) return false;
  if (!value.every((b) => Number.isInteger(b) && b >= 0 && b <= 255)) {
    return false;
  }
  try {
    Keypair.fromSecretKey(Uint8Array.from(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Refuse to resume into a buffer this session key cannot write to.
 *
 * The state check above proves the buffer secret is well-formed; this proves
 * the on-chain account it names is a loader buffer whose authority is our
 * session key. Without it a crafted state could point the resume at a foreign
 * buffer and burn the learner's fees on writes that can only fail.
 */
export async function assertSessionOwnsBuffer(
  connection: Connection,
  buffer: PublicKey,
  sessionKey: PublicKey
): Promise<void> {
  const info = await connection.getAccountInfo(buffer, {
    dataSlice: { offset: 0, length: BUFFER_HEADER_SIZE },
  });
  if (!info) {
    throw new Error(
      "Buffer account no longer exists. Please start a new deployment."
    );
  }
  const data = Buffer.from(info.data);
  if (
    !info.owner.equals(BPF_LOADER_UPGRADEABLE_ID) ||
    data.length < BUFFER_HEADER_SIZE ||
    data.readUInt32LE(0) !== BUFFER_STATE_TAG ||
    data[BUFFER_AUTHORITY_OPTION_OFFSET] !== 1
  ) {
    throw new Error("Saved deployment does not point at a usable buffer.");
  }
  const authority = new PublicKey(
    data.subarray(BUFFER_AUTHORITY_OFFSET, BUFFER_AUTHORITY_OFFSET + 32)
  );
  if (!authority.equals(sessionKey)) {
    throw new Error("Saved deployment points at a buffer this key cannot use.");
  }
}

/** Wait for the learner's transfer to leave the session key spendable. */
async function waitForFunding(
  connection: Connection,
  signature: string,
  sessionKey: PublicKey,
  requiredLamports: number,
  timeoutMs = FUNDING_TIMEOUT_MS
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const { value } = await connection.getSignatureStatuses([signature]);
    const status = value[0];
    if (status?.err) {
      throw new Error(`Funding transfer failed: ${JSON.stringify(status.err)}`);
    }
    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      const balance = await connection.getBalance(sessionKey, "confirmed");
      if (balance >= requiredLamports) return;
      throw new Error(
        `Funding transfer landed short: ${balance} of ${requiredLamports} lamports.`
      );
    }
    if (Date.now() > deadline) {
      throw new Error("Timed out waiting for the funding transfer to confirm.");
    }
    await new Promise((r) => setTimeout(r, FUNDING_POLL_MS));
  }
}

/**
 * Does this session key already hold the deploy's cost?
 *
 * Three answers, not two. `"funded"` — the balance is there, or the persisted
 * transfer confirmed — and `"failed"` — the transfer is on chain and errored —
 * are both definitive, so the caller can transfer again on the second one. The
 * third is the one that matters: when the check itself cannot answer (the RPC
 * read failed, or the signature is still pending past the blockhash it was
 * signed with) the transfer MIGHT have landed, and sending a second one would
 * double the learner's bill. That fails closed into a retry.
 */
type FundingCheck = "funded" | "failed";

/** Thrown when the funding check could not tell whether the learner paid. */
export class FundingCheckError extends Error {
  readonly reason: "rpc-error" | "still-pending";

  constructor(reason: "rpc-error" | "still-pending") {
    super(
      "Could not confirm the previous funding transfer, so no second transfer was sent."
    );
    this.name = "FundingCheckError";
    this.reason = reason;
  }
}

async function checkPendingFunding(
  connection: Connection,
  signature: string,
  sessionKey: PublicKey,
  requiredLamports: number
): Promise<FundingCheck> {
  const deadline = Date.now() + PENDING_FUNDING_TIMEOUT_MS;
  for (;;) {
    let status: SignatureStatus | null;
    try {
      const { value } = await connection.getSignatureStatuses([signature]);
      status = value[0] ?? null;
    } catch {
      // The read failed, not the transfer.
      throw new FundingCheckError("rpc-error");
    }
    if (status?.err) return "failed";
    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      const balance = await connection.getBalance(sessionKey, "confirmed");
      return balance >= requiredLamports ? "funded" : "failed";
    }
    if (Date.now() > deadline) throw new FundingCheckError("still-pending");
    await new Promise((r) => setTimeout(r, PENDING_FUNDING_POLL_MS));
  }
}

async function checkExistingFunding(
  connection: Connection,
  sessionKey: PublicKey,
  requiredLamports: number,
  pendingSignature: string | null
): Promise<FundingCheck> {
  const balance = await connection.getBalance(sessionKey, "confirmed");
  if (balance >= requiredLamports) return "funded";
  if (!pendingSignature) return "failed";
  return checkPendingFunding(
    connection,
    pendingSignature,
    sessionKey,
    requiredLamports
  );
}

async function sendLocal(
  connection: Connection,
  tx: Transaction,
  signer: Keypair
): Promise<string> {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.feePayer = signer.publicKey;
  tx.recentBlockhash = blockhash;
  tx.sign(signer);
  const signature = await sendWithRetry(connection, tx.serialize());
  await confirmTx(connection, signature, blockhash, lastValidBlockHeight);
  return signature;
}

/**
 * Hand the program's upgrade authority to `newAuthority`.
 *
 * Retried with backoff: until this lands the learner does not own what they
 * paid for, and `/api/deploy/save` will refuse the record.
 */
export async function transferProgramAuthority(params: {
  connection: Connection;
  sessionKeySecret: number[];
  programId: PublicKey;
  newAuthority: PublicKey;
  attempts?: number;
}): Promise<string> {
  const { connection, programId, newAuthority } = params;
  const session = toKeypair(params.sessionKeySecret);
  const attempts = params.attempts ?? AUTHORITY_ATTEMPTS;

  const [programData] = PublicKey.findProgramAddressSync(
    [programId.toBuffer()],
    BPF_LOADER_UPGRADEABLE_ID
  );

  let lastError: unknown = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const tx = new Transaction().add(
        priorityFeeIx(),
        createSetAuthorityInstruction(
          programData,
          session.publicKey,
          newAuthority
        )
      );
      return await sendLocal(connection, tx, session);
    } catch (err) {
      lastError = err;
      if (attempt < attempts - 1) {
        await new Promise((r) =>
          setTimeout(r, AUTHORITY_BACKOFF_MS * 2 ** attempt)
        );
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError ?? "SetAuthority failed"));
}

/**
 * Return whatever the session key still holds to `destination`, keeping back
 * only this transaction's own fee. Null when there is nothing worth sending.
 */
export async function sweepSessionKey(params: {
  connection: Connection;
  sessionKeySecret: number[];
  destination: PublicKey;
}): Promise<{ signature: string; lamports: number } | null> {
  const { connection, destination } = params;
  const session = toKeypair(params.sessionKeySecret);

  const balance = await connection.getBalance(session.publicKey, "confirmed");
  const lamports = balance - SWEEP_FEE_LAMPORTS;
  if (lamports <= 0) return null;

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: session.publicKey,
      toPubkey: destination,
      lamports,
    })
  );
  const signature = await sendLocal(connection, tx, session);
  return { signature, lamports };
}

/**
 * Abandon a paused session-key deploy: close the buffer (rent refunded to the
 * session key, which paid it) and sweep the key back to the learner. What is
 * left after this is a session key worth nothing, safe to discard.
 */
export async function startOverSessionKey(params: {
  connection: Connection;
  sessionKeySecret: number[];
  bufferKeypairSecret?: number[] | null;
  destination: PublicKey;
}): Promise<{
  closeSignature: string | null;
  refund: { signature: string; lamports: number } | null;
}> {
  const { connection, destination } = params;
  const session = toKeypair(params.sessionKeySecret);

  let closeSignature: string | null = null;
  if (params.bufferKeypairSecret) {
    const buffer = toKeypair(params.bufferKeypairSecret);
    const info = await connection.getAccountInfo(buffer.publicKey);
    if (info) {
      const tx = new Transaction().add(
        createCloseBufferInstruction(
          buffer.publicKey,
          session.publicKey,
          session.publicKey
        )
      );
      closeSignature = await sendLocal(connection, tx, session);
    }
  }

  const refund = await sweepSessionKey({
    connection,
    sessionKeySecret: params.sessionKeySecret,
    destination,
  });
  return { closeSignature, refund };
}

/**
 * The whole embedded-wallet deploy: fund a session key with one remote
 * signature, upload and deploy locally, hand ownership to the learner, sweep.
 */
export async function runSessionKeyDeploy(
  params: SessionKeyDeployParams
): Promise<SessionKeyDeployResult> {
  const {
    connection,
    learner,
    buildUuid,
    fund,
    callbacks,
    programKeypairSecret,
    resumeState = null,
    events = {},
  } = params;

  const session = params.persistedSessionKey
    ? toKeypair(params.persistedSessionKey)
    : Keypair.generate();
  const sessionKeySecret = Array.from(session.secretKey);
  events.onSessionKey?.(sessionKeySecret, session.publicKey);

  const wallet = keypairSigner(session);

  let fundedLamports = 0;
  if (resumeState) {
    // A resume is only allowed to continue the buffer this key already owns.
    await assertSessionOwnsBuffer(
      connection,
      toKeypair(resumeState.bufferKeypairSecret).publicKey,
      session.publicKey
    );
  } else {
    const programLen = getCachedBinaryLength(buildUuid);
    if (programLen === null) {
      throw new Error(
        "The compiled program is no longer available in this session (the build expired). Please rebuild it before deploying."
      );
    }
    const estimate = await estimateSessionKeyDeployCost(connection, programLen);

    // A carried-over key may already be paid for: a `fund` that broadcast and
    // then threw — a dropped response, a confirm timeout — leaves the learner's
    // SOL on chain, and funding a second time would double the bill for a
    // deploy they have already paid for. A key generated a line ago cannot be,
    // so it is not asked.
    const funded = params.persistedSessionKey
      ? await checkExistingFunding(
          connection,
          session.publicKey,
          estimate.totalLamports,
          params.pendingFundingSignature ?? null
        )
      : "failed";

    if (funded === "failed") {
      const signature = await fund(
        estimate.totalLamports,
        session.publicKey,
        (broadcast) => events.onFundingBroadcast?.({ signature: broadcast })
      );
      events.onFundingBroadcast?.({ signature });
      await waitForFunding(
        connection,
        signature,
        session.publicKey,
        estimate.totalLamports
      );
      fundedLamports = estimate.totalLamports;
      events.onFunded?.({ lamports: fundedLamports, signature });
    }
  }

  const deployResult = resumeState
    ? await resumeDeployment({
        connection,
        wallet,
        buildServerUrl: "",
        state: resumeState,
        callbacks,
      })
    : await deployProgram({
        connection,
        wallet,
        buildServerUrl: "",
        buildUuid,
        callbacks,
        programKeypairSecret,
      });

  let authoritySignature: string;
  try {
    authoritySignature = await transferProgramAuthority({
      connection,
      sessionKeySecret,
      programId: deployResult.programIdPubkey,
      newAuthority: learner,
    });
  } catch (err) {
    throw new OwnershipTransferError(
      err instanceof Error ? err.message : String(err),
      deployResult,
      session.publicKey
    );
  }
  events.onOwnershipTransferred?.({
    signature: authoritySignature,
    newAuthority: learner,
  });

  // The refund is the one step allowed to fail without failing the deploy: the
  // program is live and owned by the learner either way.
  let refundLamports = 0;
  let refundError: string | null = null;
  try {
    const refund = await sweepSessionKey({
      connection,
      sessionKeySecret,
      destination: learner,
    });
    if (refund) {
      refundLamports = refund.lamports;
      events.onRefunded?.(refund);
    }
  } catch (err) {
    refundError = err instanceof Error ? err.message : String(err);
    events.onRefundFailed?.({
      sessionKey: session.publicKey,
      message: refundError,
    });
  }

  return {
    ...deployResult,
    sessionKeySecret,
    fundedLamports,
    authoritySignature,
    refundLamports,
    refundError,
  };
}
