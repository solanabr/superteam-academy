"use client";

import { createContext, useContext, useMemo } from "react";
import { WALLET_CONFIG } from "@/config/wallet";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
    LedgerWalletAdapter,
} from "@solana/wallet-adapter-wallets";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

type WalletContextType = Record<string, never>;

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWalletContext() {
	const context = useContext(WalletContext);
	if (context === undefined) {
		throw new Error("useWalletContext must be used within a WalletProvider");
	}
	return context;
}

interface WalletProviderProps {
	children: React.ReactNode;
}

export function WalletProviderWrapper({ children }: WalletProviderProps) {
	// The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
	const network = WALLET_CONFIG.network;

	// You can also provide a custom RPC endpoint.
	const endpoint = useMemo(() => clusterApiUrl(network), []);

	const wallets = useMemo(
		() => [
			new PhantomWalletAdapter(),
			new SolflareWalletAdapter(),
			new TorusWalletAdapter(),
			new LedgerWalletAdapter(),
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	const contextValue = useMemo(() => ({}), []);

	return (
		<WalletContext.Provider value={contextValue}>
			<ConnectionProvider endpoint={endpoint}>
				<WalletProvider wallets={wallets} autoConnect={WALLET_CONFIG.autoConnect}>
					<WalletModalProvider>{children}</WalletModalProvider>
				</WalletProvider>
			</ConnectionProvider>
		</WalletContext.Provider>
	);
}
