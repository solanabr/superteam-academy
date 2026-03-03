'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { goeyToast } from 'goey-toast';

export function useWalletAuth() {
    const { publicKey, signMessage, connected, connecting } = useWallet();
    const { setVisible } = useWalletModal();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingAuth, setPendingAuth] = useState(false);
    const router = useRouter();
    const hasTriggeredAuth = useRef(false);

    const performAuth = useCallback(async () => {
        if (!publicKey || !signMessage) return;

        setIsAuthenticating(true);
        setError(null);

        try {
            const walletAddress = publicKey.toBase58();

            // Step 1: Get nonce message from server
            const nonceRes = await fetch('/api/auth/wallet/sign-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress }),
            });

            if (!nonceRes.ok) {
                const data = await nonceRes.json();
                throw new Error(data.error || 'Failed to get sign message');
            }

            const { message } = await nonceRes.json();

            goeyToast.info('Please approve the sign request...');

            // Step 2: Sign message with wallet
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = await signMessage(messageBytes);
            const bs58 = await import('bs58');
            const signature = bs58.default.encode(signatureBytes);

            goeyToast.info('Verifying signature...');

            // Step 3: Create NextAuth session (signature verified in authorize())
            const result = await signIn('wallet', {
                redirect: false,
                walletAddress,
                message,
                signature,
            });

            if (result?.error) {
                throw new Error('Failed to create session');
            }

            goeyToast.success('Wallet authenticated!');
            sessionStorage.setItem('auth_success', '1');
            router.push('/dashboard');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Authentication failed';
            setError(msg);

            // Error toasts are handled by the login page's walletError useEffect
        } finally {
            setIsAuthenticating(false);
            setPendingAuth(false);
            // Don't reset hasTriggeredAuth here — if auth failed, we don't want
            // the effect to re-fire automatically. The user must click "Connect
            // Wallet" again, which calls authenticate() and resets it there.
        }
    }, [publicKey, signMessage, router]);

    // When wallet connects and auth is pending, trigger sign flow
    useEffect(() => {
        if (pendingAuth && connected && publicKey && signMessage && !hasTriggeredAuth.current) {
            hasTriggeredAuth.current = true;
            goeyToast.success('Wallet connected');
            performAuth();
        }
    }, [pendingAuth, connected, publicKey, signMessage, performAuth]);

    const authenticate = useCallback(() => {
        setError(null);

        if (connected && publicKey && signMessage) {
            performAuth();
        } else {
            setPendingAuth(true);
            hasTriggeredAuth.current = false;
            setVisible(true);
        }
    }, [connected, publicKey, signMessage, performAuth, setVisible]);

    return {
        authenticate,
        isAuthenticating: isAuthenticating || (pendingAuth && connecting),
        error,
        isWalletConnected: connected,
    };
}
