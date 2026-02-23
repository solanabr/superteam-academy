export function isRetriableRpcError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    const name = error.name ?? "";
    if (
      name === "RpcTimeoutError" ||
      msg.includes("timeout") ||
      msg.includes("econnreset") ||
      msg.includes("econnrefused") ||
      msg.includes("etimedout") ||
      msg.includes("fetch failed") ||
      msg.includes("network") ||
      msg.includes("socket hang up") ||
      msg.includes("503") ||
      msg.includes("502") ||
      msg.includes("504")
    ) {
      return true;
    }
    if (msg.includes("account does not exist") || msg.includes("could not find account")) {
      return false;
    }
  }
  return false;
}

const DEFAULT_TIMEOUT_MS = Math.max(
  1_000,
  Number(process.env.RPC_TIMEOUT_MS) || 15_000
);
const DEFAULT_MAX_RETRIES = Math.max(0, Number(process.env.RPC_MAX_RETRIES) || 2);

export async function withRpcRetry<T>(
  fn: () => Promise<T>,
  options?: {
    timeoutMs?: number;
    maxRetries?: number;
    label?: string;
  }
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const label = options?.label ?? "rpc";

  async function attempt(attemptNum: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new RpcTimeoutError(`${label} timed out after ${timeoutMs}ms`)),
        timeoutMs
      );
    });

    try {
      return await Promise.race([fn(), timeoutPromise]);
    } catch (err) {
      if (isRetriableRpcError(err) && attemptNum < maxRetries) {
        return attempt(attemptNum + 1);
      }
      throw err;
    }
  }

  return attempt(0);
}

export class RpcTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RpcTimeoutError";
  }
}
