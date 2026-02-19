"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export function WalletConnect() {
	const { wallet, isWalletConnected: _isWalletConnected } = useAuth();
	const { connected, connecting, publicKey, disconnect } = wallet;
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (wallet.wallet) {
			wallet.wallet.adapter.on("error", (err) => {
				console.error("Wallet error:", err);
				setError(err.message || "Wallet connection failed");
			});

			wallet.wallet.adapter.on("connect", (_publicKey) => {
				setError(null);
			});

			wallet.wallet.adapter.on("disconnect", () => {
				setError(null);
			});
		}
	}, [wallet.wallet]);

	if (error) {
		return (
			<div className="flex flex-col gap-2">
				<div className="text-sm text-destructive" role="alert" aria-live="polite">
					{error}
				</div>
				<Button
					onClick={() => {
						setError(null);
						disconnect();
					}}
					variant="outline"
					size="sm"
					aria-label="Retry wallet connection"
				>
					Retry
				</Button>
			</div>
		);
	}

	if (connected && publicKey) {
		return (
			<div className="flex items-center gap-2">
				<span
					className="text-sm text-muted-foreground"
					aria-label={`Connected wallet: ${publicKey.toBase58().slice(0, 8)}...`}
				>
					{publicKey.toBase58().slice(0, 8)}...
				</span>
				<WalletMultiButton
					className="bg-primary! text-primary-foreground! hover:bg-primary/90! h-10! px-4! py-2! rounded-md! text-sm! font-medium!"
					aria-label="Wallet options"
				/>
			</div>
		);
	}

	return (
		<WalletMultiButton
			className="bg-primary! text-primary-foreground! hover:bg-primary/90! h-10! px-4! py-2! rounded-md! text-sm! font-medium!"
			disabled={connecting}
			aria-label={connecting ? "Connecting wallet..." : "Connect wallet"}
		>
			{connecting ? "Connecting..." : "Connect Wallet"}
		</WalletMultiButton>
	);
}
