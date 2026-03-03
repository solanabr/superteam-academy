# Wallet Service

## Overview

The Wallet Service manages wallet connections using Solana Wallet Adapter.

## Configuration

```typescript
// Wallet adapters to support
const wallets = [
  phantom(),
  backpack(),
  solflare(),
  torus(),
  walletConnect(),
];

// Network configuration
const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK as Network; // 'mainnet' | 'devnet'
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
```

## Implementation

### 1. Wallet Provider Setup

```typescript
// providers/WalletProvider.tsx
'use client';

import { ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new BackpackWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

### 2. Wallet Hook

```typescript
// hooks/useWallet.ts
import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useState } from 'react';

export function useWallet() {
  const { 
    publicKey, 
    connected, 
    connect, 
    disconnect, 
    signMessage, 
    signTransaction,
    signAllTransactions 
  } = useWallet();
  
  const [connecting, setConnecting] = useState(false);
  
  const connectWallet = useCallback(async () => {
    setConnecting(true);
    try {
      await connect();
    } finally {
      setConnecting(false);
    }
  }, [connect]);
  
  return {
    publicKey,
    connected,
    connecting,
    connect: connectWallet,
    disconnect,
    signMessage,
    signTransaction,
    signAllTransactions,
  };
}
```

### 3. Wallet Store (Zustand)

```typescript
// stores/walletStore.ts
import { create } from 'zustand';
import { PublicKey } from '@solana/web3.js';

interface WalletState {
  publicKey: PublicKey | null;
  connected: boolean;
  chain: string | null;
  
  // Actions
  setPublicKey: (publicKey: PublicKey | null) => void;
  setConnected: (connected: boolean) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  publicKey: null,
  connected: false,
  chain: 'solana:mainnet',
  
  setPublicKey: (publicKey) => set({ publicKey }),
  setConnected: (connected) => set({ connected }),
}));
```

### 4. Wallet Button Component

```typescript
// components/wallet/WalletButton.tsx
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useCallback } from 'react';

export function WalletButton() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  
  const formatAddress = (pubkey: PublicKey) => {
    const addr = pubkey.toBase58();
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };
  
  if (connected && publicKey) {
    return (
      <button className="wallet-button connected">
        <span className="address">{formatAddress(publicKey)}</span>
        <span className="disconnect" onClick={disconnect}>
          Disconnect
        </span>
      </button>
    );
  }
  
  return (
    <button 
      className="wallet-button connect"
      onClick={() => setVisible(true)}
    >
      Connect Wallet
    </button>
  );
}
```

### 5. Sign Message (Auth)

```typescript
// lib/auth.ts
const MESSAGE = 'Sign this message to authenticate with Superteam Academy';

export async function signAuthMessage(wallet: WalletContextState) {
  if (!wallet.signMessage) {
    throw new Error('Wallet does not support message signing');
  }
  
  const message = new TextEncoder().encode(MESSAGE);
  const signature = await wallet.signMessage(message);
  
  return {
    message: MESSAGE,
    signature: Buffer.from(signature).toString('base64'),
    publicKey: wallet.publicKey!.toBase58(),
  };
}
```

## Environment Variables

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3
```
