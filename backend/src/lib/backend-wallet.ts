import { Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

export class BackendWallet {
  constructor(private readonly keypair: Keypair) {}

  get publicKey(): PublicKey {
    return this.keypair.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (tx instanceof Transaction) {
      tx.partialSign(this.keypair);
    }
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    for (const tx of txs) {
      if (tx instanceof Transaction) tx.partialSign(this.keypair);
    }
    return txs;
  }
}
