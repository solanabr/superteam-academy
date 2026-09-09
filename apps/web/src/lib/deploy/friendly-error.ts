/**
 * Turning deploy failures into something a learner can act on.
 *
 * The owner's production run of `your-first-solana-program` printed
 * `Airdrop failed after 3 attempts: 403 : {"jsonrpc":"2.0",...}` and
 * `WalletApiError: Rate limited` straight into the lesson. A learner cannot do
 * anything with either. Every failure that reaches the UI goes through here
 * first and comes back as a message key, its params, and the ONE thing to do
 * next; the raw text survives only for `unknown`, where it is rendered inside a
 * collapsed "show details" disclosure and nowhere else.
 */

export type FriendlyErrorKey =
  | "airdropRateLimited"
  | "airdropFailed"
  | "walletRateLimited"
  | "sessionExpired"
  | "buildExpired"
  | "insufficientSol"
  | "blockhashExpired"
  | "unknown";

/**
 * What the learner does about it. `wait` means the app is already retrying —
 * it renders no button, because there is nothing to press.
 */
export type FriendlyErrorAction =
  | "wait"
  | "retry"
  | "resume"
  | "rebuild"
  | "reauth"
  | "fund"
  | "none";

export interface FriendlyError {
  key: FriendlyErrorKey;
  params: Record<string, string>;
  action: FriendlyErrorAction;
  /**
   * Present ONLY for `unknown`. Anything mapped has copy that says more than
   * the original text did, so carrying the original would just be a second,
   * worse sentence for the learner to read.
   */
  raw?: string;
}

export interface FriendlyErrorContext {
  /** Where the failure came from — the faucet and the deploy read differently. */
  source?: "airdrop" | "deploy";
  /** Seconds the faucet asked us to wait, when it said. */
  retryAfterSeconds?: number;
  /** How much more SOL the deploy needs, for the insufficient-funds copy. */
  shortfallSol?: number;
}

/** Fallback wait when a throttle gives no retry-after. */
const DEFAULT_RETRY_SECONDS = 60;

function messageOf(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "string") return input;
  if (input instanceof Error) return input.message;
  if (typeof input === "object" && "message" in input) {
    const m = (input as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return String(input);
}

const RATE_LIMITED = /rate.?limit|429|too many requests|faucet is busy/i;
const SESSION_DEAD =
  /session (has )?expired|not authenticated|re-?authenticat|jwt expired/i;
const BUILD_GONE = /build (is )?(expired|not found)|expired build|\b404\b/i;
const NO_FUNDS =
  /insufficient (funds|lamports|sol)|not enough sol|debit an account|0x1\b/i;
const STALE_BLOCKHASH =
  /blockhash|block height exceeded|was not confirmed|timed? ?out/i;

export function toFriendlyError(
  input: unknown,
  ctx: FriendlyErrorContext = {}
): FriendlyError {
  const message = messageOf(input);
  const fromAirdrop = ctx.source === "airdrop";

  if (SESSION_DEAD.test(message)) {
    return { key: "sessionExpired", params: {}, action: "reauth" };
  }

  if (RATE_LIMITED.test(message) || (fromAirdrop && /\b403\b/.test(message))) {
    if (fromAirdrop) {
      return {
        key: "airdropRateLimited",
        params: {
          seconds: String(ctx.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS),
        },
        action: "wait",
      };
    }
    return { key: "walletRateLimited", params: {}, action: "wait" };
  }

  if (fromAirdrop) {
    return { key: "airdropFailed", params: {}, action: "retry" };
  }

  if (BUILD_GONE.test(message)) {
    return { key: "buildExpired", params: {}, action: "rebuild" };
  }

  if (NO_FUNDS.test(message)) {
    return {
      key: "insufficientSol",
      params: { amount: (ctx.shortfallSol ?? 0).toFixed(2) },
      action: "fund",
    };
  }

  if (STALE_BLOCKHASH.test(message)) {
    return { key: "blockhashExpired", params: {}, action: "resume" };
  }

  return {
    key: "unknown",
    params: {},
    action: "retry",
    raw: message || undefined,
  };
}
