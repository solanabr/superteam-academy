"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Wallet, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { WalletName } from "@solana/wallet-adapter-base";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";

const WALLET_ICONS: Record<string, string> = {
	Phantom: "/wallets/phantom.png",
	Solflare: "/wallets/solflare.png",
	Backpack: "/wallets/backpack.png",
	Glow: "/wallets/glow.png",
	"Coinbase Wallet": "/wallets/coinbase.png",
};

interface LoginModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type Step = "choose" | "wallet-verify";

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
	const {
		signInWithOAuth,
		wallet,
		verifyWallet,
		isWalletConnected,
		ensureWalletAdaptersLoaded,
	} = useAuth();
	const t = useTranslations("auth");
	const [step, setStep] = useState<Step>("choose");
	const [isLoading, setIsLoading] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showWalletPicker, setShowWalletPicker] = useState(false);

	const reset = useCallback(() => {
		setStep("choose");
		setIsLoading(null);
		setError(null);
		setShowWalletPicker(false);
	}, []);

	const handleOpenChange = useCallback(
		(value: boolean) => {
			if (!value) reset();
			onOpenChange(value);
		},
		[onOpenChange, reset]
	);

	const handleOAuthSignIn = useCallback(
		async (provider: "google" | "github") => {
			setIsLoading(provider);
			setError(null);
			try {
				await signInWithOAuth(provider);
				handleOpenChange(false);
			} catch {
				setError(t("oauthError", { provider }));
			} finally {
				setIsLoading(null);
			}
		},
		[signInWithOAuth, handleOpenChange, t]
	);

	const handleWalletConnect = useCallback(async () => {
		setError(null);
		setIsLoading("wallet");

		try {
			await ensureWalletAdaptersLoaded();
		} catch {
			setError(t("walletConnectError"));
			setIsLoading(null);
			return;
		}

		if (!isWalletConnected) {
			try {
				const defaultWallet = wallet.wallets[0]?.adapter.name ?? null;
				await wallet.select(defaultWallet);
				await wallet?.connect();
				setStep("wallet-verify");
			} catch {
				setError(t("walletConnectError"));
			} finally {
				setIsLoading(null);
			}
			return;
		}
		setIsLoading(null);
		setStep("wallet-verify");
	}, [wallet, isWalletConnected, t, ensureWalletAdaptersLoaded]);

	const handleSelectSpecificWallet = useCallback(
		async (walletName: string) => {
			setError(null);
			setIsLoading(`wallet-switch-${walletName}`);
			try {
				await ensureWalletAdaptersLoaded();
				await wallet.disconnect();
				await wallet.select(walletName as WalletName);
				await wallet?.connect();
				setShowWalletPicker(false);
			} catch {
				setError(t("walletConnectError"));
			} finally {
				setIsLoading(null);
			}
		},
		[wallet, t, ensureWalletAdaptersLoaded]
	);

	const handleWalletVerify = useCallback(async () => {
		setIsLoading("wallet-verify");
		setError(null);
		try {
			await verifyWallet();
			handleOpenChange(false);
		} catch {
			setError(t("walletVerifyError"));
		} finally {
			setIsLoading(null);
		}
	}, [verifyWallet, handleOpenChange, t]);

	const truncatedAddress = wallet.publicKey
		? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
		: null;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-xl">
						{step === "choose" && t("welcomeTitle")}
						{step === "wallet-verify" && t("verifyWalletTitle")}
					</DialogTitle>
					<DialogDescription>
						{step === "choose" && t("welcomeDescription")}
						{step === "wallet-verify" &&
							t("verifyWalletDescription", { address: truncatedAddress ?? "" })}
					</DialogDescription>
				</DialogHeader>

				{error && (
					<div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
						{error}
					</div>
				)}

				{step === "choose" && (
					<div className="space-y-3 pt-2">
						<Button
							variant="outline"
							className="w-full justify-between h-11 px-4"
							onClick={handleWalletConnect}
							disabled={isLoading === "wallet"}
						>
							<span className="flex items-center">
								<Wallet className="w-4 h-4 mr-3" />
								{isLoading === "wallet"
									? t("connecting")
									: isWalletConnected && truncatedAddress
										? t("continueWithWalletAddress", {
												address: truncatedAddress,
											})
										: t("continueWithWallet")}
							</span>
							<div className="flex items-center gap-1.5">
								<img
									src="/wallets/phantom.png"
									alt="Phantom"
									className="w-5 h-5 rounded-sm"
								/>
								<img
									src="/wallets/solflare.png"
									alt="Solflare"
									className="w-5 h-5 rounded-sm"
								/>
								<img
									src="/wallets/backpack.png"
									alt="Backpack"
									className="w-5 h-5 rounded-sm"
								/>
								<img
									src="/wallets/glow.png"
									alt="Glow"
									className="w-5 h-5 rounded-sm"
								/>
								<img
									src="/wallets/coinbase.png"
									alt="Coinbase"
									className="w-5 h-5 rounded-sm"
								/>
							</div>
						</Button>

						<div className="relative my-4">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t border-border" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">
									{t("or")}
								</span>
							</div>
						</div>

						<Button
							variant="outline"
							className="w-full justify-start h-11"
							onClick={() => handleOAuthSignIn("google")}
							disabled={isLoading === "google"}
						>
							<svg className="w-4 h-4 mr-3" viewBox="0 0 24 24">
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							{isLoading === "google" ? t("signingIn") : t("continueWithGoogle")}
						</Button>

						<Button
							variant="outline"
							className="w-full justify-start h-11"
							onClick={() => handleOAuthSignIn("github")}
							disabled={isLoading === "github"}
						>
							<svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
							</svg>
							{isLoading === "github" ? t("signingIn") : t("continueWithGithub")}
						</Button>
					</div>
				)}

				{step === "wallet-verify" && (
					<div className="space-y-4 pt-2">
						<p className="text-sm text-muted-foreground">{t("walletSignMessage")}</p>
						<Button
							className="w-full"
							onClick={handleWalletVerify}
							disabled={isLoading === "wallet-verify"}
						>
							{isLoading === "wallet-verify" ? t("signing") : t("signAndVerify")}
						</Button>

						{!showWalletPicker && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="w-full gap-2"
								onClick={() => setShowWalletPicker(true)}
							>
								<RefreshCw className="w-3.5 h-3.5" />
								{t("switchWallet")}
							</Button>
						)}

						{showWalletPicker && (
							<div className="space-y-2 rounded-lg border border-border p-3">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									{t("selectWallet")}
								</p>
								{wallet.wallets.map((w) => {
									const name = w.adapter.name;
									const icon = WALLET_ICONS[name] ?? w.adapter.icon;
									const isCurrentWallet = wallet.wallet?.adapter.name === name;
									const isSwitching = isLoading === `wallet-switch-${name}`;
									return (
										<Button
											key={name}
											variant={isCurrentWallet ? "secondary" : "ghost"}
											size="sm"
											className="w-full justify-start gap-3 h-10"
											onClick={() => handleSelectSpecificWallet(name)}
											disabled={isCurrentWallet || isSwitching}
										>
											{icon.startsWith("/") ? (
												<img
													src={icon}
													alt={name}
													className="w-5 h-5 rounded-sm"
												/>
											) : (
												<img
													src={icon}
													alt={name}
													className="w-5 h-5 rounded-sm"
												/>
											)}
											<span className="flex-1 text-left">{name}</span>
											{isCurrentWallet && (
												<span className="text-[10px] text-muted-foreground">
													{t("connected")}
												</span>
											)}
											{isSwitching && (
												<RefreshCw className="w-3 h-3 animate-spin" />
											)}
										</Button>
									);
								})}
							</div>
						)}

						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="w-full"
							onClick={() => {
								setStep("choose");
								setError(null);
								setShowWalletPicker(false);
							}}
						>
							<ArrowLeft className="w-3.5 h-3.5 mr-2" />
							{t("backToOptions")}
						</Button>
					</div>
				)}

				<p className="text-xs text-muted-foreground text-center pt-2">{t("termsNotice")}</p>
			</DialogContent>
		</Dialog>
	);
}
