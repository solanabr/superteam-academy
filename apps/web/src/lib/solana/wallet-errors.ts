/**
 * Check if an error is a wallet session/keyring error that requires
 * the user to disconnect and reconnect their wallet.
 */
export function isWalletKeyringError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    msg.includes("UserKeyring not found") ||
    (msg.includes("invariant violation") && lower.includes("wallet")) ||
    msg.includes("Wallet not ready")
  );
}

/**
 * Check if the user deliberately rejected the wallet prompt.
 * This is NOT a session error — just a normal cancellation.
 */
export function isUserRejection(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("user rejected") ||
    lower.includes("transaction cancelled") ||
    lower.includes("transaction rejected") ||
    lower.includes("request was rejected") ||
    lower.includes("user denied") ||
    lower.includes("wallet window closed")
  );
}
