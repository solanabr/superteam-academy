"use client";

import React, { useMemo, useCallback } from "react";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { ThemeProvider } from "next-themes";
import { DEVNET_RPC } from "@/lib/constants";
import { SolanaDataProvider } from "@/hooks/use-solana-data";
import { AuthProvider } from "@/hooks/use-auth";

import "@solana/wallet-adapter-react-ui/styles.css";

function SolanaProvider({ children }: { children: React.ReactNode }) {
    const endpoint = useMemo(() => DEVNET_RPC, []);

    const wallets = useMemo(
        () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
        []
    );

    const onError = useCallback((error: Error) => {
        console.error("Wallet error:", error);
    }, []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} onError={onError} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <SolanaProvider>
                <AuthProvider>
                    <SolanaDataProvider>
                        {children}
                    </SolanaDataProvider>
                </AuthProvider>
            </SolanaProvider>
        </ThemeProvider>
    );
}
