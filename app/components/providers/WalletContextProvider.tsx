/**
 * @fileoverview Solana wallet connection provider.
 * Manages connection endpoints, wallet adapters (Phantom, Solflare), and UI feedback.
 */
"use client";

import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import {
	ConnectionProvider,
	useWallet,
	WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
	PhantomWalletAdapter,
	SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { FC, ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

// Import default styles
import "@solana/wallet-adapter-react-ui/styles.css";

const network = WalletAdapterNetwork.Devnet;

/**
 * Internal component to handle wallet-related toast notifications.
 * Provides feedback on connection and disconnection events.
 */
const WalletNotification = () => {
	const { connected, wallet } = useWallet();
	const prevConnected = useRef(connected);
	const ready = useRef(false);

	// Wait 2s after mount before showing connect/disconnect toasts.
	// This reliably suppresses the autoConnect toast on page reload,
	// even under React Strict Mode's double-mount behavior.
	useEffect(() => {
		const timer = setTimeout(() => {
			ready.current = true;
		}, 2000);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (!ready.current) {
			prevConnected.current = connected;
			return;
		}

		if (connected && !prevConnected.current) {
			toast.success("Wallet Connected", {
				description: `Connected to ${wallet?.adapter.name || "Wallet"}`,
			});
		} else if (!connected && prevConnected.current) {
			toast.info("Wallet Disconnected", {
				description: "You have disconnected your wallet.",
			});
		}
		prevConnected.current = connected;
	}, [connected, wallet?.adapter.name]);

	return null;
};

/**
 * Main wallet context provider for the application.
 * Wraps the app with Connection and Wallet providers from @solana/wallet-adapter-react.
 */
export const WalletContextProvider: FC<{ children: ReactNode }> = ({
	children,
}) => {
	const endpoint = useMemo(() => clusterApiUrl(network), []);

	const wallets = useMemo(
		() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
		[],
	);

	const onError = useCallback((error: WalletError) => {
		console.error(error);
		toast.error("Wallet Error", {
			description: error.message ? error.message : "An unknown error occurred",
		});
	}, []);

	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider wallets={wallets} autoConnect onError={onError}>
				<WalletModalProvider>
					<WalletNotification />
					{children}
				</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
};
