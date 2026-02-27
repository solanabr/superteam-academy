interface Window {
  solana?: {
    isPhantom?: boolean;
    isConnected: boolean;
    signTransaction(transaction: any): Promise<any>;
    signAllTransactions(transactions: any[]): Promise<any[]>;
    signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
    connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
    disconnect(): Promise<void>;
    on(event: string, callback: (args: any) => void): void;
    request(args: { method: string; params?: any }): Promise<any>;
  };
}
