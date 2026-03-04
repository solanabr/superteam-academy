/**
 * Custom error types for the Superteam Academy frontend.
 * Follows rules/typescript.md: "Custom error types" pattern.
 *
 * @see security.md §Client-Side Checklist for error handling requirements
 */

/** Thrown when a wallet-connected operation is attempted without a wallet. */
export class WalletNotConnectedError extends Error {
  constructor() {
    super("Wallet not connected");
    this.name = "WalletNotConnectedError";
  }
}

/** Thrown when an RPC call fails after retries. */
export class RPCError extends Error {
  constructor(method: string, cause?: unknown) {
    super(`RPC call failed: ${method}`);
    this.name = "RPCError";
    this.cause = cause;
  }
}

/** Thrown when a Photon indexer query fails. */
export class PhotonIndexerError extends Error {
  constructor(message: string, cause?: unknown) {
    super(`Photon indexer error: ${message}`);
    this.name = "PhotonIndexerError";
    this.cause = cause;
  }
}

/** Thrown when on-chain daily XP cap would be exceeded. */
export class DailyXPLimitError extends Error {
  constructor(attempted: number, remaining: number) {
    super(
      `Daily XP limit: attempted ${attempted}, only ${remaining} remaining`
    );
    this.name = "DailyXPLimitError";
  }
}

/** Thrown when a transaction simulation fails before signing. */
export class SimulationFailedError extends Error {
  constructor(details: string) {
    super(`Transaction simulation failed: ${details}`);
    this.name = "SimulationFailedError";
  }
}

/** Thrown when a prerequisite course has not been completed. */
export class PrerequisiteNotMetError extends Error {
  constructor(courseSlug: string, prerequisiteSlug: string) {
    super(
      `Course "${courseSlug}" requires completing "${prerequisiteSlug}" first`
    );
    this.name = "PrerequisiteNotMetError";
  }
}

/** Thrown when enrollment cooldown period hasn't elapsed. */
export class CooldownNotElapsedError extends Error {
  constructor(remainingSeconds: number) {
    super(
      `Unenroll cooldown: ${Math.ceil(remainingSeconds / 3600)}h remaining`
    );
    this.name = "CooldownNotElapsedError";
  }
}

/**
 * Maps common Solana/Anchor error codes to user-friendly messages.
 * Per security.md §Client-Side Checklist: "Show clear error messages for common failure modes"
 *
 * @param error - The caught error
 * @returns User-friendly error message string
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof WalletNotConnectedError) {
    return "Please connect your wallet to continue";
  }
  if (error instanceof RPCError) {
    return "Network error — please check your connection and try again";
  }
  if (error instanceof PhotonIndexerError) {
    return "Unable to load credential data — please try again shortly";
  }
  if (error instanceof DailyXPLimitError) {
    return error.message;
  }
  if (error instanceof SimulationFailedError) {
    return "Transaction would fail — please try again";
  }
  if (error instanceof PrerequisiteNotMetError) {
    return error.message;
  }
  if (error instanceof CooldownNotElapsedError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Common Solana error codes
    if (error.message.includes("0x1")) {
      return "Insufficient funds for transaction fee";
    }
    if (error.message.includes("0x0")) {
      return "Transaction failed — please try again";
    }
    if (error.message.includes("blockhash")) {
      return "Transaction expired — please retry";
    }
    if (error.message.includes("AccountNotFound")) {
      return "Account not found on-chain";
    }
  }

  return "An unexpected error occurred";
}
