'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface LinkedAccount {
    provider: string;
    provider_id: string;
}

export function useAccountLinking() {
    const { data: session, status } = useSession();
    const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLinkedAccounts = useCallback(async () => {
        if (status !== 'authenticated') return;

        try {
            const response = await fetch('/api/auth/linked-accounts');
            const data = await response.json();
            setLinkedAccounts(data.accounts || []);
        } catch (error) {
            console.error('Failed to fetch linked accounts:', error);
        } finally {
            setIsLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchLinkedAccounts();
    }, [fetchLinkedAccounts]);

    const linkWallet = useCallback(
        async (walletAddress: string, message: string, signature: string) => {
            const res = await fetch('/api/auth/link/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, message, signature }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to link wallet');
            }

            await fetchLinkedAccounts();
        },
        [fetchLinkedAccounts]
    );

    const linkGoogle = useCallback(async () => {
        const res = await fetch('/api/auth/link/google', { method: 'POST' });
        const data = await res.json();
        if (data.url) {
            const popup = window.open(data.url, 'link-google', 'width=500,height=600,popup=yes');
            // Refresh accounts when popup closes
            const timer = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(timer);
                    fetchLinkedAccounts();
                }
            }, 500);
        }
    }, [fetchLinkedAccounts]);

    const linkGitHub = useCallback(async () => {
        const res = await fetch('/api/auth/link/github', { method: 'POST' });
        const data = await res.json();
        if (data.url) {
            const popup = window.open(data.url, 'link-github', 'width=500,height=600,popup=yes');
            // Refresh accounts when popup closes
            const timer = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(timer);
                    fetchLinkedAccounts();
                }
            }, 500);
        }
    }, [fetchLinkedAccounts]);

    const unlinkProvider = useCallback(
        async (provider: string) => {
            const res = await fetch(`/api/auth/unlink/${provider}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to unlink');
            }

            await fetchLinkedAccounts();
        },
        [fetchLinkedAccounts]
    );

    const hasProvider = useCallback(
        (provider: string) =>
            linkedAccounts.some((a) => a.provider === provider),
        [linkedAccounts]
    );

    return {
        linkedAccounts,
        isLoading,
        session,
        linkWallet,
        linkGoogle,
        linkGitHub,
        unlinkProvider,
        hasProvider,
        refresh: fetchLinkedAccounts,
    };
}
