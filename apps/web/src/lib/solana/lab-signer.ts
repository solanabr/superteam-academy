import type { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { keypairSigner, type WalletAdapter } from "@superteam-lms/deploy";
import nacl from "tweetnacl";
import { verifyLabDevnet } from "@/lib/solana/lab-guard";

/** The lab connection is not on devnet, or could not say. Nothing was signed. */
export class LabNotDevnetError extends Error {
  constructor() {
    super("The lab is not on devnet, so nothing was signed.");
    this.name = "LabNotDevnetError";
  }
}

/** The lab keypair as a signer. It gives out signatures, never the secret. */
export interface LabSigner extends WalletAdapter {
  publicKey: PublicKey;
  /** An Ed25519 signature over `message`, for the deploy proof. */
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}

/**
 * A signer for the lab keypair, tied to the lab connection. Every signature
 * waits for that connection's devnet check (`lab-guard.ts`): when the check
 * refuses or fails, the call throws and nothing is signed. Pass the lab
 * connection only, never the app's.
 */
export function createLabSigner(
  keypair: Keypair,
  labConnection: Pick<Connection, "getGenesisHash">
): LabSigner {
  const local = keypairSigner(keypair);
  const assertDevnet = async () => {
    if (!(await verifyLabDevnet(labConnection))) throw new LabNotDevnetError();
  };
  return {
    publicKey: keypair.publicKey,
    signTransaction: async (tx) => {
      await assertDevnet();
      return local.signTransaction(tx);
    },
    signAllTransactions: async (txs) => {
      await assertDevnet();
      return local.signAllTransactions(txs);
    },
    signMessage: async (message) => {
      await assertDevnet();
      return nacl.sign.detached(message, keypair.secretKey);
    },
  };
}
