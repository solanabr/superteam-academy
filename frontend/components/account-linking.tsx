"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function AccountLinking() {
	const { isAuthenticated, authMethod, linkWallet, unlinkWallet, isWalletConnected } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [conflictError, setConflictError] = useState<string | null>(null);

	const handleLinkWallet = async () => {
		setIsLoading(true);
		setConflictError(null);
		try {
			await linkWallet();
		} catch (error) {
			if (error instanceof Error && error.message.includes("already linked")) {
				setConflictError(error.message);
			} else {
				console.error("Failed to link wallet:", error);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleUnlinkWallet = async () => {
		setIsLoading(true);
		setConflictError(null);
		try {
			await unlinkWallet();
		} catch (error) {
			console.error("Failed to unlink wallet:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleResolveConflict = () => {
		// TODO: Implement conflict resolution UI
		// This could show options like:
		// - Keep existing link
		// - Replace with new link
		// - Cancel operation
		setConflictError(null);
	};

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">Account Linking</h3>
			<p className="text-sm text-muted-foreground">
				Link your wallet to your OAuth account for a unified experience.
			</p>

			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2">
					<div
						className={`w-3 h-3 rounded-full ${authMethod === "oauth" ? "bg-green-500" : "bg-gray-300"}`}
					/>
					<span className="text-sm">OAuth Account</span>
				</div>

				<div
					className={`w-3 h-3 rounded-full ${isWalletConnected ? "bg-green-500" : "bg-gray-300"}`}
				/>

				<div className="flex items-center gap-2">
					<div
						className={`w-3 h-3 rounded-full ${authMethod === "linked" ? "bg-green-500" : "bg-gray-300"}`}
					/>
					<span className="text-sm">Wallet Linked</span>
				</div>
			</div>

			{conflictError && (
				<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
					<p className="text-sm text-destructive">{conflictError}</p>
					<Button
						onClick={handleResolveConflict}
						variant="outline"
						size="sm"
						className="mt-2"
					>
						Resolve Conflict
					</Button>
				</div>
			)}

			{authMethod === "oauth" && !isWalletConnected && !conflictError && (
				<Button onClick={handleLinkWallet} disabled={isLoading} variant="outline" size="sm">
					{isLoading ? "Linking..." : "Link Wallet"}
				</Button>
			)}

			{authMethod === "linked" && (
				<Button
					onClick={handleUnlinkWallet}
					disabled={isLoading}
					variant="destructive"
					size="sm"
				>
					{isLoading ? "Unlinking..." : "Unlink Wallet"}
				</Button>
			)}

			{authMethod === "wallet" && (
				<p className="text-sm text-muted-foreground">
					Wallet-only authentication detected. Sign in with OAuth to enable linking.
				</p>
			)}
		</div>
	);
}
