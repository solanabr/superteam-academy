import type Monaco from "monaco-editor";
import { registerRustLanguage } from "./rust-language";

// Prevent duplicate addExtraLib calls across hot-reloads in dev
const _registered = new Set<string>();

/**
 * One-time Monaco editor setup called in `beforeMount`.
 * Registers Rust syntax, configures TypeScript, and injects Solana type stubs.
 */
export function configureMonaco(monaco: typeof Monaco) {
  registerRustLanguage(monaco);

  // monaco-editor types don't expose languages.typescript in the default export;
  // use unknown intermediate cast (no-any compliant) to access it at runtime.
  interface MonacoTS {
    ScriptTarget: { ES2020: number };
    typescriptDefaults: {
      setCompilerOptions(opts: Record<string, unknown>): void;
      addExtraLib(content: string, path: string): void;
    };
    javascriptDefaults: { setCompilerOptions(opts: Record<string, unknown>): void };
  }
  const tsLang = (monaco.languages as unknown as { typescript: MonacoTS }).typescript;

  // Suppress "Cannot find module" errors — sandbox can't resolve node_modules
  const tsOpts: Record<string, unknown> = {
    target: tsLang.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    strict: false,
    noResolve: true,
    allowSyntheticDefaultImports: true,
  };
  tsLang.typescriptDefaults.setCompilerOptions(tsOpts);
  tsLang.javascriptDefaults.setCompilerOptions(tsOpts);

  if (_registered.has("solana")) return;
  _registered.add("solana");

  tsLang.typescriptDefaults.addExtraLib(
    `declare module '@solana/web3.js' {
      export class Keypair {
        static generate(): Keypair;
        static fromSecretKey(secretKey: Uint8Array): Keypair;
        publicKey: PublicKey;
        secretKey: Uint8Array;
      }
      export class PublicKey {
        constructor(value: string | Uint8Array | number[]);
        static findProgramAddressSync(seeds: Uint8Array[], programId: PublicKey): [PublicKey, number];
        toBase58(): string;
        toString(): string;
        toBuffer(): Buffer;
        equals(other: PublicKey): boolean;
      }
      export class Connection {
        constructor(endpoint: string, commitment?: string);
        getBalance(publicKey: PublicKey): Promise<number>;
        getAccountInfo(publicKey: PublicKey, commitment?: string): Promise<AccountInfo | null>;
      }
      export interface AccountInfo {
        data: Buffer;
        executable: boolean;
        lamports: number;
        owner: PublicKey;
      }
      export class Transaction {
        add(...items: TransactionInstruction[]): Transaction;
        sign(...signers: Keypair[]): void;
      }
      export class TransactionInstruction {
        constructor(opts: {
          keys: AccountMeta[];
          programId: PublicKey;
          data?: Buffer;
        });
      }
      export interface AccountMeta {
        pubkey: PublicKey;
        isSigner: boolean;
        isWritable: boolean;
      }
      export namespace SystemProgram {
        function transfer(params: {
          fromPubkey: PublicKey;
          toPubkey: PublicKey;
          lamports: number;
        }): TransactionInstruction;
        function createAccount(params: object): TransactionInstruction;
        const programId: PublicKey;
      }
      export const LAMPORTS_PER_SOL: number;
      export type Commitment = 'processed' | 'confirmed' | 'finalized';
      export function clusterApiUrl(cluster: 'mainnet-beta' | 'devnet' | 'testnet'): string;
      export function sendAndConfirmTransaction(
        connection: Connection,
        transaction: Transaction,
        signers: Keypair[],
      ): Promise<string>;
    }`,
    "file:///node_modules/@solana/web3.js/index.d.ts",
  );
}
