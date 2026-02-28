/**
 * Retry utility for Solana transaction submission.
 *
 * Retries on transient errors (expired blockhash, timeout, rate limit).
 * Fails immediately on permanent errors (InstructionError, insufficient funds).
 */

const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 3000, 6000];

const TRANSIENT_RE =
  /TransactionExpiredBlockheightExceeded|BlockhashNotFound|timeout|ETIMEDOUT|ECONNRESET|429|Too Many Requests|503|Service Unavailable/;

const PERMANENT_RE =
  /InstructionError|insufficient funds|Insufficient|custom program error|Error processing Instruction|AccountNotFound|InvalidAccountData/;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);

      if (PERMANENT_RE.test(msg)) throw err;
      if (attempt >= MAX_RETRIES) throw err;
      if (!TRANSIENT_RE.test(msg)) throw err;

      const base = BACKOFF_MS[attempt] ?? 6000;
      const jitter = Math.floor(Math.random() * base * 0.3);
      const delay = base + jitter;
      console.warn(
        `Solana tx attempt ${attempt + 1} failed (transient), retrying in ${delay}ms`,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}
