import { z } from "zod";
import bs58 from "bs58";
import { ed25519 } from "@noble/curves/ed25519";

/**
 * A Solana wallet address: base58, decodes to exactly 32 bytes, and lies ON the
 * ed25519 curve.
 *
 * On-curve is the load-bearing check, not a formality. `Course.creator` must own
 * an associated token account for the creator XP reward, and
 * `getAssociatedTokenAddressSync` refuses an off-curve owner (a PDA) unless
 * `allowOwnerOffCurve` is set — which it is not, on the reward path. So an
 * off-curve address would pass base58/length and then break at reward time. We
 * reject it here instead. This mirrors `@solana/web3.js`'s `isOnCurve`
 * (`ed25519.ExtendedPoint.fromHex`) without pulling web3.js into this
 * browser-imported package.
 */
function isOnCurve(bytes: Uint8Array): boolean {
  try {
    ed25519.ExtendedPoint.fromHex(bytes);
    return true;
  } catch {
    return false;
  }
}

/** The base58 alphabet, so editors and JSON Schema get a `pattern` hint. */
const BASE58 = "^[1-9A-HJ-NP-Za-km-z]{32,44}$";

export const SolanaAddress = z
  .string()
  .regex(new RegExp(BASE58), "must be a base58 Solana address")
  .refine(
    (v) => {
      let bytes: Uint8Array;
      try {
        bytes = bs58.decode(v);
      } catch {
        return false;
      }
      return bytes.length === 32 && isOnCurve(bytes);
    },
    { message: "must be a valid on-curve ed25519 public key (32 bytes)" }
  );

export type SolanaAddressT = z.infer<typeof SolanaAddress>;
