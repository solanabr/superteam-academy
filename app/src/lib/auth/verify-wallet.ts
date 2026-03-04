/**
 * Verify an Ed25519 message signature from a Solana wallet.
 * Message and signature must match what the client sent (message as string, signature as base64).
 */
export async function verify_wallet_signature(params: {
  public_key: string;
  message: string;
  signature_base64: string;
}): Promise<boolean> {
  const { public_key, message, signature_base64 } = params;
  try {
    const nacl = await import("tweetnacl");
    const bs58 = await import("bs58");
    const message_bytes = new TextEncoder().encode(message);
    const signature_bytes = Buffer.from(signature_base64, "base64");
    const public_key_bytes = bs58.default.decode(public_key);
    if (signature_bytes.length !== 64 || public_key_bytes.length !== 32) return false;
    return nacl.default.sign.detached.verify(message_bytes, signature_bytes, public_key_bytes);
  } catch {
    return false;
  }
}
