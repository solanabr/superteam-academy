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
