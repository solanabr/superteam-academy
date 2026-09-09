import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

/**
 * The faucet endpoint, deliberately NOT the app's RPC connection.
 *
 * The app talks to devnet through a keyed Helius endpoint, and Helius meters
 * `requestAirdrop` per PROJECT: "The devnet faucet has a limit of 1 SOL per
 * project per day". So the first learner to fund a wallet spent the whole
 * platform's daily quota and everyone after them got a 403 — which is exactly
 * what the owner hit on 09-09-2026 while testing the embedded-wallet deploy.
 *
 * The public devnet RPC meters per ADDRESS instead (2 SOL a request, with the
 * occasional 429 when the faucet is busy), so each learner gets their own
 * allowance. Balance reads stay on the app connection; only the airdrop moves.
 */
export const DEVNET_FAUCET_ENDPOINT = "https://api.devnet.solana.com";

export interface AirdropResult {
  success: boolean;
  signature?: string;
  newBalance?: number;
  error?: string;
  rateLimited?: boolean;
  /** Seconds the faucet asked us to wait, when it said. */
  retryAfterSeconds?: number;
}

export interface AirdropOptions {
  /** Override the faucet RPC. Tests and local validators only. */
  endpoint?: string;
}

/**
 * Request an airdrop with exponential backoff retry.
 * Returns a structured result (never throws).
 *
 * @param walletAddress - who to fund
 * @param amount - SOL to request (default: 2, the public faucet's per-request cap)
 */
export async function createAirdropRequest(
  walletAddress: PublicKey,
  amount: number = 2,
  options: AirdropOptions = {}
): Promise<AirdropResult> {
  const connection = new Connection(
    options.endpoint ?? DEVNET_FAUCET_ENDPOINT,
    "confirmed"
  );
  const lamports = amount * LAMPORTS_PER_SOL;
  const maxRetries = 3;
  let lastError = "";

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const signature = await connection.requestAirdrop(
        walletAddress,
        lamports
      );

      // Wait for confirmation
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      const newBalance = await connection.getBalance(
        walletAddress,
        "confirmed"
      );

      return {
        success: true,
        signature,
        newBalance: newBalance / LAMPORTS_PER_SOL,
      };
    } catch (err) {
      const message = (err as Error).message ?? String(err);
      lastError = message;

      // Detect rate limiting. The Helius 403 ("1 SOL per project per day") is
      // matched by the `rate limit` test below, not by its status — a bare 403
      // otherwise means "this endpoint won't serve you", which retrying and
      // calling a cooldown would both misreport.
      if (
        message.includes("429") ||
        message.includes("Too Many Requests") ||
        /rate limit/i.test(message) ||
        message.includes("airdrop request limit")
      ) {
        return {
          success: false,
          error:
            "Devnet faucet is busy. Please wait 30-60 seconds and try again.",
          rateLimited: true,
          retryAfterSeconds: parseRetryAfterSeconds(message),
        };
      }

      // Exponential backoff for transient errors
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  return {
    success: false,
    error: `Airdrop failed after ${maxRetries} attempts: ${lastError}`,
    rateLimited: false,
  };
}

/**
 * The wait the faucet asked for, when the error carries one.
 *
 * web3.js throws the response body as text, so a `Retry-After` header or a
 * "try again in 30 seconds" body both arrive as part of the message — there is
 * no structured field to read. Undefined when nothing plausible is there; the
 * caller then falls back to its own cooldown.
 */
function parseRetryAfterSeconds(message: string): number | undefined {
  const match =
    /retry[- ]after[":\s]*(\d+)/i.exec(message) ??
    /(?:try again|wait)(?: again)? in (\d+)\s*(?:second|sec|s)\b/i.exec(
      message
    );
  if (!match) return undefined;
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}
