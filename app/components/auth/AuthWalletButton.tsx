/**
 * @fileoverview Solana wallet authentication button.
 * Encapsulates the logic for signing a message with a Solana wallet and
 * authenticating via a custom Better Auth endpoint.
 */
"use client";

import { WalletIcon } from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
import bs58 from "bs58";
import { useLocale, useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";
import { GitHubIcon, GoogleIcon } from "@/components/shared/Icons";
import { WalletModal } from "@/components/shared/WalletModal";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "@/lib/auth/client";

/**
 * Component for social and wallet-based authentication.
 *
 * @param {boolean} [showSocial=true] - Whether to display GitHub and Google login options.
 */
export function AuthWalletButton({
	showSocial = true,
}: {
	showSocial?: boolean;
}) {
	const { publicKey, signMessage, disconnect } = useWallet();
	const t = useTranslations("Auth.walletButton");
	const locale = useLocale();
	const { refetch: refetchSession } = useSession();
	const [modalOpen, setModalOpen] = useState(false);

	const solanaMutation = useMutation({
		mutationFn: async () => {
			if (!publicKey || !signMessage) {
				setModalOpen(true);
				return;
			}

			const message = `Sign this message to authenticate with Superteam Academy: ${Date.now()}`;
			const messageBytes = new TextEncoder().encode(message);
			const signature = await signMessage(messageBytes);

			const res = await fetch("/api/auth/sign-in/solana", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					publicKey: publicKey.toBase58(),
					signature: bs58.encode(signature),
					message,
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Authentication failed");
			return data;
		},
		onSuccess: async (_, __, ___) => {
			// Identify user and capture wallet auth event
			if (publicKey) {
				posthog.identify(publicKey.toBase58(), {
					wallet_address: publicKey.toBase58(),
				});
				posthog.capture("wallet_authenticated", {
					wallet_address: publicKey.toBase58(),
					method: "solana_wallet",
				});
			}
			toast.success("Wallet authenticated successfully");
			await refetchSession();
			// Redirection is handled in AuthView based on session state
		},
		onError: (error) => {
			posthog.captureException(error);
			console.error(error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to authenticate wallet",
			);
			disconnect();
		},
	});

	const oauthMutation = useMutation({
		mutationFn: async (provider: "github" | "google") => {
			return await signIn.social({
				provider,
				callbackURL: `/${locale}/dashboard`, // Changed from `/${locale}` to be consistent
			});
		},
		onError: (error, provider) => {
			posthog.captureException(error);
			toast.error(`Failed to sign in with ${provider}`);
		},
	});

	const handleSignIn = () => solanaMutation.mutate();
	const handleOAuthSignIn = (provider: "github" | "google") =>
		oauthMutation.mutate(provider);

	return (
		<div className="flex flex-col w-full gap-3">
			{showSocial && (
				<>
					{/* GitHub SignIn */}
					<Button
						variant="outline"
						onClick={() => handleOAuthSignIn("github")}
						disabled={oauthMutation.isPending || solanaMutation.isPending}
						className="w-full h-11 border-ink-secondary/20 bg-bg-surface hover:bg-ink-primary/5 text-ink-primary font-mono uppercase tracking-widest text-xs rounded-none transition-colors flex items-center justify-center gap-3"
					>
						{oauthMutation.isPending && oauthMutation.variables === "github" ? (
							<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
						) : (
							<div className="flex items-center gap-3">
								<GitHubIcon className="w-5 h-5 text-ink-primary" />
								{t("github")}
							</div>
						)}
					</Button>

					{/* Google SignIn */}
					<Button
						variant="outline"
						onClick={() => handleOAuthSignIn("google")}
						disabled={oauthMutation.isPending || solanaMutation.isPending}
						className="w-full h-11 border-ink-secondary/20 bg-bg-surface hover:bg-ink-primary/5 text-ink-primary font-mono uppercase tracking-widest text-xs rounded-none transition-colors flex items-center justify-center gap-3"
					>
						{oauthMutation.isPending && oauthMutation.variables === "google" ? (
							<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
						) : (
							<div className="flex items-center gap-3">
								<GoogleIcon className="w-5 h-5" />
								{t("google")}
							</div>
						)}
					</Button>
				</>
			)}

			{/* Solana Wallet SignIn */}
			<Button
				onClick={handleSignIn}
				disabled={solanaMutation.isPending || oauthMutation.isPending}
				className="w-full h-11 bg-ink-primary text-bg-base hover:bg-ink-secondary font-mono uppercase tracking-widest text-xs rounded-none transition-colors flex items-center justify-center gap-3"
			>
				{solanaMutation.isPending ? (
					<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
				) : (
					<WalletIcon className="w-5 h-5" />
				)}
				{solanaMutation.isPending
					? t("authenticating")
					: publicKey
						? t("walletSignIn")
						: t("walletConnect")}
			</Button>

			<WalletModal open={modalOpen} onOpenChange={setModalOpen} />
		</div>
	);
}
