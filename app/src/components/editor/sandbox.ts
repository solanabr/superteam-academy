/**
 * Lightweight mock implementations of @solana/web3.js classes
 * injected into the challenge sandbox so user code can actually execute.
 */

class MockPublicKey {
  private _key: string;

  constructor(value: string | Uint8Array | number[]) {
    if (typeof value === "string") {
      this._key = value;
    } else {
      this._key = Array.from(value).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  }

  static default = new MockPublicKey("11111111111111111111111111111111");

  static findProgramAddressSync(
    seeds: Array<Buffer | Uint8Array>,
    programId: MockPublicKey,
  ): [MockPublicKey, number] {
    let hash = 0;
    for (const seed of seeds) {
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash + seed[i]) | 0;
      }
    }
    const bump = Math.abs(hash) % 256;
    const addr = `PDA${Math.abs(hash).toString(16).padStart(40, "0").slice(0, 40)}`;
    return [new MockPublicKey(addr), bump];
  }

  toBase58(): string { return this._key; }
  toBuffer(): Buffer { return Buffer.alloc(32); }
  toBytes(): Uint8Array { return new Uint8Array(32); }
  toString(): string { return this._key; }
  equals(other: MockPublicKey): boolean { return this._key === other._key; }
}

class MockTransactionInstruction {
  programId: MockPublicKey;
  keys: Array<{ pubkey: MockPublicKey; isSigner: boolean; isWritable: boolean }>;
  data: Buffer;

  constructor(opts: {
    programId: MockPublicKey;
    keys: Array<{ pubkey: MockPublicKey; isSigner: boolean; isWritable: boolean }>;
    data?: Buffer;
  }) {
    this.programId = opts.programId;
    this.keys = opts.keys;
    this.data = opts.data ?? Buffer.alloc(0);
  }
}

const MockSystemProgram = {
  programId: new MockPublicKey("11111111111111111111111111111111"),

  transfer(params: {
    fromPubkey: MockPublicKey;
    toPubkey: MockPublicKey;
    lamports: number | bigint;
  }): MockTransactionInstruction {
    const data = Buffer.alloc(12);
    data.writeUInt32LE(2, 0);
    const lamportsNum = typeof params.lamports === "bigint"
      ? Number(params.lamports)
      : params.lamports;
    data.writeUInt32LE(lamportsNum & 0xFFFFFFFF, 4);

    return new MockTransactionInstruction({
      programId: MockSystemProgram.programId,
      keys: [
        { pubkey: params.fromPubkey, isSigner: true, isWritable: true },
        { pubkey: params.toPubkey, isSigner: false, isWritable: true },
      ],
      data,
    });
  },

  createAccount(params: {
    fromPubkey: MockPublicKey;
    newAccountPubkey: MockPublicKey;
    lamports: number;
    space: number;
    programId: MockPublicKey;
  }): MockTransactionInstruction {
    return new MockTransactionInstruction({
      programId: MockSystemProgram.programId,
      keys: [
        { pubkey: params.fromPubkey, isSigner: true, isWritable: true },
        { pubkey: params.newAccountPubkey, isSigner: true, isWritable: true },
      ],
      data: Buffer.alloc(52),
    });
  },

  assign(params: {
    accountPubkey: MockPublicKey;
    programId: MockPublicKey;
  }): MockTransactionInstruction {
    return new MockTransactionInstruction({
      programId: MockSystemProgram.programId,
      keys: [
        { pubkey: params.accountPubkey, isSigner: true, isWritable: true },
      ],
    });
  },
};

export const SANDBOX_GLOBALS: Record<string, unknown> = {
  PublicKey: MockPublicKey,
  TransactionInstruction: MockTransactionInstruction,
  SystemProgram: MockSystemProgram,
  LAMPORTS_PER_SOL: 1_000_000_000,
  Buffer,
};

export { MockPublicKey, MockTransactionInstruction, MockSystemProgram };
