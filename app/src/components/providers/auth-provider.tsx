'use client';

import {
  createContext,
  useContext,
  type ReactNode,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { WalletInstallModal } from '@/components/modals/wallet-install-modal';

interface AuthContextValue {
  // Session state
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    walletAddress?: string | null;
    role?: string | null;
    authProvider?: 'solana' | 'google' | 'github' | null;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Auth methods
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithWallet: (callbackUrl?: string) => Promise<void>;
  signOutUser: () => Promise<void>;

  // Loading states for each auth method
  googleLoading: boolean;
  githubLoading: boolean;
  walletLoading: boolean;

  // Wallet state (for direct wallet interactions)
  walletConnected: boolean;
  walletConnecting: boolean;
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;

  // Wallet install modal state
  walletInstallModalOpen: boolean;
  setWalletInstallModalOpen: (open: boolean) => void;
  pendingWalletInstall: { name: string; url?: string } | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();
  const { connected, connecting, publicKey, connect, disconnect, signMessage, wallet } =
    useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletInstallModalOpen, setWalletInstallModalOpen] = useState(false);
  const [pendingWalletInstall, setPendingWalletInstall] = useState<{
    name: string;
    url?: string;
  } | null>(null);
  const hasAutoSignedOutRef = useRef(false);

  const user = useMemo(() => {
    if (!session?.user) return null;
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      walletAddress: session.user.walletAddress,
      role: session.user.role,
      authProvider: session.user.authProvider,
    };
  }, [session]);

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const walletConnected = !!(user?.walletAddress || (connected && publicKey));

  useEffect(() => {
    // Don't check wallet connection during session loading
    if (isLoading) return;

    if (!isAuthenticated || !user?.walletAddress || user.authProvider !== 'solana') {
      hasAutoSignedOutRef.current = false;
      return;
    }

    // Give wallet adapter time to auto-reconnect on page load/navigation
    // Only sign out if wallet remains disconnected after a delay
    const timeoutId = setTimeout(() => {
      if (!connected && !connecting && !walletConnecting && !hasAutoSignedOutRef.current) {
        hasAutoSignedOutRef.current = true;
        toast.error('Wallet disconnected. Please sign in again.');
        void signOut({ callbackUrl: '/auth/signin?callbackUrl=/dashboard' });
      }
    }, 2000); // 2 second grace period for auto-reconnect

    return () => clearTimeout(timeoutId);
  }, [
    isAuthenticated,
    isLoading,
    user?.walletAddress,
    user?.authProvider,
    connected,
    connecting,
    walletConnecting,
  ]);

  /**
   * Connect wallet (without signing in)
   */
  const connectWallet = useCallback(async (): Promise<string | null> => {
    setWalletConnecting(true);

    try {
      if (!wallet) {
        setWalletModalVisible(true);
        toast.error('Select a wallet first');
        return null;
      }

      if (wallet.readyState === WalletReadyState.NotDetected) {
        setWalletModalVisible(false);
        setPendingWalletInstall({
          name: wallet.adapter.name,
          url: wallet.adapter.url,
        });
        setWalletInstallModalOpen(true);
        toast.error(`Wallet not detected. Install or enable ${wallet.adapter.name}.`);
        return null;
      }

      if (wallet.readyState === WalletReadyState.Unsupported) {
        toast.error('This wallet is not supported in your browser.');
        return null;
      }

      if (!connected) {
        await connect();
      }

      const address = publicKey?.toBase58() ?? null;

      if (!address) {
        toast.error('Wallet connection failed');
        return null;
      }

      return address;
    } catch (error) {
      if (error instanceof Error && error.name === 'WalletNotSelectedError') {
        toast.error('Select a wallet first');
        return null;
      }
      if (error instanceof Error && error.name === 'WalletNotReadyError') {
        setWalletModalVisible(true);
        toast.error('Wallet not ready. Make sure the extension is installed and enabled.');
        return null;
      }
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet');
      return null;
    } finally {
      setWalletConnecting(false);
    }
  }, [connect, connected, publicKey, setWalletModalVisible, wallet]);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(() => {
    void disconnect();
  }, [disconnect]);

  /**
   * Sign in with Solana wallet
   */
  const signInWithWallet = useCallback(
    async (callbackUrl: string = '/dashboard') => {
      setWalletConnecting(true);
      setWalletLoading(true);

      try {
        if (!wallet) {
          setWalletModalVisible(true);
          toast.info('Please select a wallet to continue');
          return;
        }

        if (wallet.readyState === WalletReadyState.NotDetected) {
          setWalletModalVisible(false);
          setPendingWalletInstall({
            name: wallet.adapter.name,
            url: wallet.adapter.url,
          });
          setWalletInstallModalOpen(true);
          return;
        }

        if (wallet.readyState === WalletReadyState.Unsupported) {
          toast.error('This wallet is not supported in your browser.');
          return;
        }

        // Show connecting feedback
        if (!connected) {
          toast.info('Connecting to wallet...');
          await connect();
          toast.success('Wallet connected!');
        }

        const walletAddress = publicKey?.toBase58();

        if (!walletAddress) {
          toast.error('Please connect a wallet first');
          return;
        }

        if (!signMessage) {
          toast.error('Connected wallet does not support message signing');
          return;
        }

        // Get nonce and message from server
        toast.info('Preparing authentication...');
        const nonceResponse = await fetch('/api/auth/solana/nonce');
        const { message } = await nonceResponse.json();

        // Sign message
        toast.info('Please sign the message in your wallet...');
        const encodedMessage = new TextEncoder().encode(message);
        const signedMessage = await signMessage(encodedMessage);
        toast.success('Message signed!');

        // Convert signature to base58
        const bs58 = await import('bs58');
        const signature = bs58.default.encode(signedMessage as Uint8Array);

        // Sign in with NextAuth
        toast.info('Authenticating...');
        const result = await signIn('solana', {
          walletAddress,
          signature,
          message,
          callbackUrl,
          redirect: false,
        });

        if (result?.error || !result?.ok) {
          toast.error('Failed to sign in with wallet');
          console.error('Sign in error:', result?.error ?? 'Unknown error');
        } else {
          toast.success('Successfully signed in! Redirecting...');

          // NextAuth credentials flow with redirect:false requires manual navigation.
          // Use returned URL when present, otherwise fallback to requested callback.
          window.location.href = result.url || callbackUrl;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'WalletNotSelectedError') {
          toast.error('Select a wallet first');
          return;
        }
        if (error instanceof Error && error.name === 'WalletNotReadyError') {
          setWalletModalVisible(true);
          toast.error('Wallet not ready. Make sure the extension is installed and enabled.');
          return;
        }
        if (error instanceof Error && error.message.includes('User rejected')) {
          toast.error('Signature request was rejected');
          return;
        }
        console.error('Failed to sign in with wallet:', error);
        toast.error('Failed to sign in with wallet');
      } finally {
        setWalletConnecting(false);
        setWalletLoading(false);
      }
    },
    [connect, connected, publicKey, signMessage, wallet, setWalletModalVisible]
  );

  /**
   * Sign in with Google
   */
  const signInWithGoogle = useCallback(async () => {
    setGoogleLoading(true);
    try {
      toast.info('Redirecting to Google...');
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Failed to sign in with Google:', error);
      toast.error('Failed to sign in with Google');
      setGoogleLoading(false);
    }
  }, []);

  /**
   * Sign in with GitHub
   */
  const signInWithGitHub = useCallback(async () => {
    setGithubLoading(true);
    try {
      toast.info('Redirecting to GitHub...');
      await signIn('github', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Failed to sign in with GitHub:', error);
      toast.error('Failed to sign in with GitHub');
      setGithubLoading(false);
    }
  }, []);

  /**
   * Sign out
   */
  const signOutUser = useCallback(async () => {
    try {
      await signOut({ callbackUrl: '/' });
      void disconnect();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Failed to sign out:', error);
      toast.error('Failed to sign out');
    }
  }, [disconnect]);

  /**
   * Handle wallet install
   */
  const handleWalletInstall = useCallback(() => {
    if (pendingWalletInstall?.url) {
      window.open(pendingWalletInstall.url, '_blank', 'noopener,noreferrer');
      setWalletInstallModalOpen(false);
      toast.success(
        `Opening ${pendingWalletInstall.name} installation page. Install it and return to sign in.`
      );
    }
  }, [pendingWalletInstall]);

  /**
   * Handle wallet install modal close
   */
  const handleInstallModalClose = useCallback(() => {
    setWalletInstallModalOpen(false);
    setPendingWalletInstall(null);
  }, []);

  /**
   * Handle selecting another wallet
   */
  const handleSelectAnotherWallet = useCallback(() => {
    setWalletInstallModalOpen(false);
    setPendingWalletInstall(null);
    setWalletModalVisible(true);
    toast.info('Select a different wallet to continue');
  }, [setWalletModalVisible]);

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    signInWithGoogle,
    signInWithGitHub,
    signInWithWallet,
    signOutUser,
    googleLoading,
    githubLoading,
    walletLoading,
    walletConnected,
    walletConnecting,
    connectWallet,
    disconnectWallet,
    walletInstallModalOpen,
    setWalletInstallModalOpen,
    pendingWalletInstall,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <WalletInstallModal
        isOpen={walletInstallModalOpen}
        walletName={pendingWalletInstall?.name || ''}
        walletUrl={pendingWalletInstall?.url}
        onClose={handleInstallModalClose}
        onInstall={handleWalletInstall}
        onSelectAnother={handleSelectAnotherWallet}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
