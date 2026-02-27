export const SIGN_IN_MESSAGE_PREFIX = "Sign in to Superteam Academy";

/** Build the message to be signed by the wallet. */
export function buildSignInMessage(nonce: string): string {
  return `${SIGN_IN_MESSAGE_PREFIX}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
}
