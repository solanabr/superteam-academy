import type { Transaction } from "@solana/web3.js";

/**
 * Surviving Dynamic's MPC signing throttle.
 *
 * The owner's first production deploy of `your-first-solana-program` (74
 * chunks) stopped at chunk 3 with `WalletApiError: Rate limited`: Dynamic
 * throttles its wallet API, and one `signAllTransactions` call for a
 * 15-transaction batch asks for 15 signatures at once. "Retomar Deploy" hit
 * the same wall, because an immediate retry is the same request again.
 *
 * Two changes, both here: ask for fewer signatures per call
 * (`EMBEDDED_SUB_BATCH_SIZE`), and when the throttle answers anyway, wait and
 * ask again instead of discarding the batch.
 *
 * This is the EMBEDDED path only. An extension wallet signs locally and is
 * never rate limited, so `use-deploy-signer` leaves the adapter path alone.
 */

/** First wait after a throttled call. */
export const RATE_LIMIT_BASE_DELAY_MS = 2_000;

/** Ceiling for one wait — beyond this the learner is just watching a spinner. */
export const RATE_LIMIT_MAX_DELAY_MS = 30_000;

/** Attempts per sub-batch, including the first. */
export const RATE_LIMIT_MAX_ATTEMPTS = 8;

/**
 * How long a batch may spend signing before its shared blockhash is refetched.
 *
 * A recent blockhash is valid ~60-90s on devnet, and the deploy fetches ONE per
 * batch just before signing. Backoff can spend that on waiting alone, so past
 * this age the batch is re-stamped and re-signed rather than sent against a
 * blockhash about to expire.
 */
export const BLOCKHASH_MAX_AGE_MS = 45_000;

/**
 * Transactions per MPC `signAllTransactions` call on the embedded path.
 *
 * The batch (`EMBEDDED_BATCH_SIZE`) still shares one blockhash; this only
 * splits how many signatures are requested at a time. Five keeps a throttled
 * call from discarding fourteen already-signed transactions, and gives the
 * backoff something small to retry.
 */
export const EMBEDDED_SUB_BATCH_SIZE = 5;

/** How many times one batch may re-stamp its blockhash before giving up. */
const MAX_BLOCKHASH_REFRESHES = 2;

export interface RateLimitWaitInfo {
  /** 1 for the first wait. */
  attempt: number;
  waitMs: number;
}

export interface SignAllWithBackoffOptions {
  /** The underlying MPC batch signer. */
  signAll: (transactions: Transaction[]) => Promise<Transaction[]>;
  subBatchSize?: number;
  maxAttempts?: number;
  /** Called before each wait, so the UI can say why nothing is happening. */
  onRateLimitWait?: (info: RateLimitWaitInfo) => void;
  /**
   * Fetch a fresh blockhash. Without it (tests, callers holding no connection)
   * the batch keeps the blockhash it arrived with.
   */
  refreshBlockhash?: () => Promise<string>;
  /** Injected in tests. */
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

/**
 * Did the wallet service throttle us, rather than reject the transaction?
 *
 * Matched structurally, not by class. The installed `@dynamic-labs-sdk/client`
 * exports no `WalletApiError` — the name the owner saw in production comes
 * from the WaaS layer the SDK loads at runtime — so an `instanceof` check
 * would silently match nothing. What every shape of this failure does carry is
 * at least one of: a 429 status, a `rate_limit`-ish code, a name that says
 * rate limit, or the message itself. `cause` is walked one level for the same
 * reason `isDynamicSessionExpiredError` does it: the WaaS signer wraps
 * failures once.
 */
export function isDynamicRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (
    isRateLimited(error) || isRateLimited((error as { cause?: unknown }).cause)
  );
}

function isRateLimited(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    name?: unknown;
    code?: unknown;
    status?: unknown;
    message?: unknown;
  };

  if (candidate.status === 429) return true;
  if (
    typeof candidate.name === "string" &&
    /rate.?limit/i.test(candidate.name)
  ) {
    return true;
  }
  if (
    typeof candidate.code === "string" &&
    /rate.?limit|too.?many.?requests/i.test(candidate.code)
  ) {
    return true;
  }
  return (
    typeof candidate.message === "string" &&
    /rate.?limit|too.?many.?requests|\b429\b/i.test(candidate.message)
  );
}

/** Exponential backoff with jitter, capped. */
export function rateLimitDelayMs(
  attempt: number,
  random: () => number = Math.random
): number {
  const base = Math.min(
    RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt,
    RATE_LIMIT_MAX_DELAY_MS
  );
  // Half fixed, half jittered: two learners throttled at once don't retry in
  // lockstep, and the wait never collapses to nothing either.
  return Math.round(base / 2 + random() * (base / 2));
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Sign `transactions` in sub-batches, waiting out Dynamic's rate limit.
 *
 * Order is load-bearing — the deploy maps signature i back to chunk i — so
 * sub-batches are signed in sequence and concatenated in order.
 *
 * On a blockhash refresh the WHOLE batch restarts. Refreshing only the
 * remaining tail would leave the sub-batches signed a minute earlier holding
 * the stale blockhash, and nothing in a batch is sent until all of it is
 * signed — so those would be exactly the transactions that die on send.
 */
export async function signAllWithRateLimitBackoff(
  transactions: Transaction[],
  options: SignAllWithBackoffOptions
): Promise<Transaction[]> {
  const {
    signAll,
    subBatchSize = EMBEDDED_SUB_BATCH_SIZE,
    maxAttempts = RATE_LIMIT_MAX_ATTEMPTS,
    onRateLimitWait,
    refreshBlockhash,
    now = Date.now,
    sleep = defaultSleep,
    random = Math.random,
  } = options;

  if (transactions.length === 0) return [];

  let refreshes = 0;
  let batchStartedAt = now();

  for (;;) {
    const signed: Transaction[] = [];
    let restart = false;

    for (let i = 0; i < transactions.length && !restart; i += subBatchSize) {
      const subBatch = transactions.slice(i, i + subBatchSize);

      for (let attempt = 0; ; attempt++) {
        try {
          signed.push(...(await signAll(subBatch)));
          break;
        } catch (error) {
          if (!isDynamicRateLimitError(error) || attempt >= maxAttempts - 1) {
            throw error;
          }

          const waitMs = rateLimitDelayMs(attempt, random);
          onRateLimitWait?.({ attempt: attempt + 1, waitMs });
          await sleep(waitMs);

          if (
            refreshBlockhash &&
            refreshes < MAX_BLOCKHASH_REFRESHES &&
            now() - batchStartedAt > BLOCKHASH_MAX_AGE_MS
          ) {
            refreshes++;
            const blockhash = await refreshBlockhash();
            for (const tx of transactions) tx.recentBlockhash = blockhash;
            batchStartedAt = now();
            restart = true;
            break;
          }
        }
      }
    }

    if (!restart) return signed;
  }
}
