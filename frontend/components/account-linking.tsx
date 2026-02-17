"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function AccountLinking() {
	const { isAuthenticated, authMethod, isWalletConnected, isWalletVerified, verifyWallet } =
		useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleVerifyWallet = async () => {
		setIsLoading(true);
		setError(null);
		try {
			await verifyWallet();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Wallet verification failed");
		} finally {
			setIsLoading(false);
		}
	};

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">Account Linking</h3>
			<p className="text-sm text-muted-foreground">
				Verify your wallet to link it to your OAuth account.
			</p>

			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2">
					<div
						className={`w-3 h-3 rounded-full ${authMethod === "oauth" || authMethod === "linked" ? "bg-green-500" : "bg-gray-300"}`}
					/>
					<span className="text-sm">OAuth Account</span>
				</div>

				<div
					className={`w-3 h-3 rounded-full ${isWalletConnected ? "bg-green-500" : "bg-gray-300"}`}
				/>

				<div className="flex items-center gap-2">
					<div
						className={`w-3 h-3 rounded-full ${isWalletVerified ? "bg-green-500" : "bg-gray-300"}`}
					/>
					<span className="text-sm">Wallet Verified</span>
				</div>
			</div>

			{error && (
				<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
					<p className="text-sm text-destructive">{error}</p>
				</div>
			)}

			{isWalletConnected && !isWalletVerified && (
				<Button
					onClick={handleVerifyWallet}
					disabled={isLoading}
					variant="outline"
					size="sm"
				>
					{isLoading ? "Verifying..." : "Verify Wallet (Sign Message)"}
				</Button>
			)}

			{authMethod === "linked" && (
				<p className="text-sm text-green-600">
					Wallet verified and linked to your account.
				</p>
			)}

			{!isWalletConnected && authMethod === "oauth" && (
				<p className="text-sm text-muted-foreground">
					Connect a wallet first, then verify it to link your accounts.
				</p>
			)}
		</div>
	);
}
