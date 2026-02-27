'use client';

import {
  createContext,
  useContext,
  type ReactNode,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  TrustWalletAdapter,
  NightlyWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

interface WalletContextValue {
  connected: boolean;
  publicKey: string | null;
  address: string | null; // Alias for publicKey
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  walletName: string | null;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

function WalletContextBridge({ children }: WalletProviderProps) {
  const {
    wallets,
    wallet,
    publicKey,
    connected,
    connecting,
    connect: adapterConnect,
    disconnect,
    select,
  } = useWallet();
  const [localConnecting, setLocalConnecting] = useState(false);
  const [pendingConnect, setPendingConnect] = useState(false);

  // Effect to connect after wallet is selected
  useEffect(() => {
    if (pendingConnect && wallet && !connected && !connecting) {
      const doConnect = async () => {
        try {
          await adapterConnect();
        } catch (error) {
          console.error('Wallet connection error:', error);
        } finally {
          setPendingConnect(false);
          setLocalConnecting(false);
        }
      };
      void doConnect();
    }
  }, [pendingConnect, wallet, connected, connecting, adapterConnect]);

  const connect = useCallback(async () => {
    setLocalConnecting(true);

    try {
      if (!wallet) {
        const preferredWallet =
          wallets.find(
            (entry) =>
              entry.adapter.name === 'Phantom' && entry.readyState !== WalletReadyState.Unsupported
          ) ||
          wallets.find(
            (entry) =>
              entry.adapter.name === 'Solflare' && entry.readyState !== WalletReadyState.Unsupported
          ) ||
          wallets.find((entry) => entry.readyState === WalletReadyState.Installed) ||
          wallets.find((entry) => entry.readyState === WalletReadyState.Loadable) ||
          wallets[0];

        if (!preferredWallet) {
          setLocalConnecting(false);
          throw new Error('No wallet adapters are available');
        }

        // Select the wallet and mark pending - the effect will handle connection
        select(preferredWallet.adapter.name);
        setPendingConnect(true);
        return;
      }

      // Wallet already selected, connect directly
      await adapterConnect();
    } catch (error) {
      setLocalConnecting(false);
      throw error;
    }
  }, [adapterConnect, select, wallet, wallets]);

  const disconnectWallet = useCallback(() => {
    void disconnect();
  }, [disconnect]);

  return (
    <WalletContext.Provider
      value={{
        connected,
        publicKey: publicKey?.toBase58() ?? null,
        address: publicKey?.toBase58() ?? null,
        connecting: connecting || localConnecting,
        connect,
        disconnect: disconnectWallet,
        walletName: wallet?.adapter.name ?? null,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

/**
 * WalletProvider
 *
 * Solana Wallet Adapter provider with multi-wallet support.
 */
export function WalletProvider({ children }: WalletProviderProps) {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet'),
    []
  );

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TrustWalletAdapter(),
      new NightlyWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletContextBridge>{children}</WalletContextBridge>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}
