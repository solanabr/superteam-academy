/**
 * Check if an error is a wallet session/keyring error that requires
 * the user to disconnect and reconnect their wallet.
 */
export function isWalletKeyringError(msg: string): boolean {
  return (
    msg.includes("UserKeyring not found") ||
    msg.includes("invariant violation") ||
    msg.includes("Wallet not ready") ||
    msg.includes("User rejected the request")
  );
}
