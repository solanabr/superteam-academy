import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";

interface WalletVerifyParams {
  publicKey: string;
  signature: number[];
  nonce: string;
}

interface WalletVerifyResponse {
  success: boolean;
  error?: string;
}

class WalletAuthService {
  /**
   * Reconstruct the exact message the frontend signed.
   * Must match character-for-character what the frontend built:
   *   const message = new TextEncoder().encode(`Sign in to SolLearn\nNonce: ${nonce}`)
   */
  buildMessage(nonce: string): Uint8Array {
    return new TextEncoder().encode(`Sign in to SolLearn\nNonce: ${nonce}`);
  }

  /**
   * Validate that a string is a legitimate Solana public key
   */
  isValidPublicKey(publicKey: string): boolean {
    try {
      new PublicKey(publicKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify a wallet signature using Ed25519 (tweetnacl)
   * @param publicKey - base58 Solana wallet address
   * @param signature - Array.from(signature) sent by the frontend
   * @param nonce     - the raw nonce string used to build the message
   */
  verifySignature({ publicKey, signature, nonce }: WalletVerifyParams): WalletVerifyResponse {
    try {
      // 1. Validate public key format
      if (!this.isValidPublicKey(publicKey)) {
        return { success: false, error: "Invalid Solana public key" };
      }

      // 2. Reconstruct the message exactly as the frontend built it
      const message = this.buildMessage(nonce);

      // 3. Convert signature from number[] → Uint8Array
      const signatureBytes = Uint8Array.from(signature);

      // 4. Get public key bytes from base58
      const publicKeyBytes = new PublicKey(publicKey).toBytes();

      // 5. Verify Ed25519 signature
      const isValid = nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes);

      if (!isValid) {
        return { success: false, error: "Signature verification failed" };
      }

      return { success: true };
    } catch (error) {
      console.error("Wallet signature verification error:", error);
      return { success: false, error: "Failed to verify wallet signature" };
    }
  }
}

export default new WalletAuthService();