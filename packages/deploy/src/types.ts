import type { PublicKey, TransactionSignature } from "@solana/web3.js";

export type DeployStep = "buffer" | "upload" | "finalize" | "complete";

export interface DeploymentCallbacks {
  onStepChange: (step: DeployStep) => void;
  onChunkProgress: (current: number, total: number) => void;
  onTransactionConfirmed: (info: {
    signature: TransactionSignature;
    step: DeployStep;
    message: string;
  }) => void;
  onError: (error: DeploymentError) => void;
  /** Called after each state mutation so callers can persist for resume. */
  onStateUpdate: (state: DeploymentState) => void;
}

export interface DeploymentError {
  step: DeployStep;
  chunksCompleted: number;
  totalChunks: number;
  message: string;
  retryable: boolean;
}

export interface DeploymentState {
  buildUuid: string;
  bufferKeypairSecret: number[];
  programKeypairSecret: number[];
  lastUploadedChunk: number;
  totalChunks: number;
  phase: "buffer_created" | "uploading" | "finalizing" | "complete";
}

export interface DeployResult {
  programId: string;
  programIdPubkey: PublicKey;
  totalChunks: number;
  durationMs: number;
  rentLamports: number;
}

export interface WalletAdapter {
  publicKey: PublicKey | null;
  signTransaction: <T extends import("@solana/web3.js").Transaction>(
    tx: T
  ) => Promise<T>;
  signAllTransactions: <T extends import("@solana/web3.js").Transaction>(
    txs: T[]
  ) => Promise<T[]>;
}
