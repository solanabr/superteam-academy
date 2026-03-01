export const SOLANA_WEB3_TYPES = `
declare module "@solana/web3.js" {
  export class PublicKey {
    constructor(value: string | Uint8Array | number[]);
    static default: PublicKey;
    static findProgramAddressSync(
      seeds: Array<Buffer | Uint8Array>,
      programId: PublicKey,
    ): [PublicKey, number];
    toBase58(): string;
    toBuffer(): Buffer;
    toBytes(): Uint8Array;
    toString(): string;
    equals(other: PublicKey): boolean;
  }

  export class Keypair {
    constructor();
    static generate(): Keypair;
    static fromSecretKey(secretKey: Uint8Array): Keypair;
    readonly publicKey: PublicKey;
    readonly secretKey: Uint8Array;
  }

  export class Connection {
    constructor(endpoint: string, commitment?: string);
    getBalance(publicKey: PublicKey): Promise<number>;
    getLatestBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }>;
    sendTransaction(transaction: Transaction, signers: Keypair[]): Promise<string>;
    confirmTransaction(signature: string): Promise<{ value: { err: unknown } }>;
    getAccountInfo(publicKey: PublicKey): Promise<AccountInfo<Buffer> | null>;
  }

  export interface AccountInfo<T> {
    data: T;
    executable: boolean;
    lamports: number;
    owner: PublicKey;
    rentEpoch?: number;
  }

  export class Transaction {
    constructor();
    add(...instructions: TransactionInstruction[]): Transaction;
    recentBlockhash?: string;
    feePayer?: PublicKey;
    signatures: Array<{ publicKey: PublicKey; signature: Buffer | null }>;
  }

  export class TransactionInstruction {
    constructor(opts: {
      programId: PublicKey;
      keys: Array<AccountMeta>;
      data?: Buffer;
    });
    programId: PublicKey;
    keys: Array<AccountMeta>;
    data: Buffer;
  }

  export interface AccountMeta {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }

  export class SystemProgram {
    static readonly programId: PublicKey;
    static transfer(params: {
      fromPubkey: PublicKey;
      toPubkey: PublicKey;
      lamports: number | bigint;
    }): TransactionInstruction;
    static createAccount(params: {
      fromPubkey: PublicKey;
      newAccountPubkey: PublicKey;
      lamports: number;
      space: number;
      programId: PublicKey;
    }): TransactionInstruction;
    static assign(params: {
      accountPubkey: PublicKey;
      programId: PublicKey;
    }): TransactionInstruction;
  }

  export const LAMPORTS_PER_SOL: number;
  export const SYSVAR_RENT_PUBKEY: PublicKey;
  export const SYSVAR_CLOCK_PUBKEY: PublicKey;

  export function sendAndConfirmTransaction(
    connection: Connection,
    transaction: Transaction,
    signers: Keypair[],
  ): Promise<string>;
}
`;

export const BUFFER_TYPES = `
interface Buffer extends Uint8Array {
  toString(encoding?: string): string;
}

interface BufferConstructor {
  from(value: string | ArrayBuffer | number[] | Uint8Array, encoding?: string): Buffer;
  alloc(size: number, fill?: number): Buffer;
  allocUnsafe(size: number): Buffer;
  concat(list: Uint8Array[], totalLength?: number): Buffer;
  isBuffer(obj: unknown): obj is Buffer;
}

declare const Buffer: BufferConstructor;
`;
